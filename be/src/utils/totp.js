// RFC 6238 TOTP (Google Authenticator / Microsoft Authenticator / Authy / 1Password compatible)
// implemented with Node's crypto only. Also contains secret-at-rest encryption + backup code helpers.
const crypto = require('crypto');

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Encode = (buf) => {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
};

const base32Decode = (str) => {
  const clean = String(str || '').replace(/=+$/, '').replace(/\s+/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
};

const generateSecret = () => base32Encode(crypto.randomBytes(20));

const hotp = (secretBuf, counter) => {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', secretBuf).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  const code = (((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1000000;
  return String(code).padStart(6, '0');
};

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

// Replay protection: a code that was accepted once cannot be reused within its validity window
const usedCounters = new Map();
const pruneUsed = () => {
  const now = Date.now();
  for (const [k, exp] of usedCounters) if (exp < now) usedCounters.delete(k);
};

/** Returns true when `token` is valid for the base32 secret (±1 time-step tolerance). */
const verifyTotp = (secretBase32, token, replayKey = null) => {
  const code = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(code)) return false;
  let secretBuf;
  try { secretBuf = base32Decode(secretBase32); } catch { return false; }
  const step = Math.floor(Date.now() / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    if (safeEqual(hotp(secretBuf, step + w), code)) {
      if (replayKey) {
        pruneUsed();
        const key = `${replayKey}:${step + w}`;
        if (usedCounters.has(key)) return false;
        usedCounters.set(key, Date.now() + 120000);
      }
      return true;
    }
  }
  return false;
};

const buildOtpAuthUrl = ({ secret, accountName, issuer = 'Student Life Cap' }) => {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
};

// ── Encryption of secrets at rest (AES-256-GCM) ──
const encKey = () =>
  crypto.createHash('sha256').update(String(process.env.MFA_ENC_KEY || process.env.JWT_SECRET || 'your_jwt_secret')).digest();

const encryptSecret = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
};

const decryptSecret = (payload) => {
  const [ivHex, tagHex, dataHex] = String(payload).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
};

// ── Backup (recovery) codes ──
const hashBackupCode = (code) =>
  crypto.createHmac('sha256', encKey()).update(String(code).replace(/[\s-]/g, '').toUpperCase()).digest('hex');

const generateBackupCodes = (count = 8) => {
  const plain = [];
  for (let i = 0; i < count; i++) {
    const raw = base32Encode(crypto.randomBytes(7)).slice(0, 10); // 10 chars base32 ≈ 50 bits
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return {
    plain,
    stored: JSON.stringify(plain.map((c) => ({ hash: hashBackupCode(c), used: false }))),
  };
};

/** Returns { ok, stored } – `stored` is the updated JSON string when a code was consumed. */
const consumeBackupCode = (storedJson, code) => {
  let list = [];
  try { list = JSON.parse(storedJson || '[]'); } catch { list = []; }
  const h = hashBackupCode(code);
  const entry = list.find((e) => !e.used && safeEqual(e.hash, h));
  if (!entry) return { ok: false, stored: storedJson };
  entry.used = true;
  return { ok: true, stored: JSON.stringify(list) };
};

const countBackupCodes = (storedJson) => {
  try { return JSON.parse(storedJson || '[]').filter((e) => !e.used).length; } catch { return 0; }
};

module.exports = {
  generateSecret,
  verifyTotp,
  buildOtpAuthUrl,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  consumeBackupCode,
  countBackupCodes,
  hotp,
  base32Decode,
};

