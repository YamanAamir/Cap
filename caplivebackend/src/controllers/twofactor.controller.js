const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const rateLimit = require('../utils/rateLimit');
const {
  generateSecret,
  verifyTotp,
  buildOtpAuthUrl,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  consumeBackupCode,
  countBackupCodes,
} = require('../utils/totp');

const checkPassword = async (userId, password) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !password) return null;
  return (await bcrypt.compare(String(password), user.password)) ? user : null;
};

const deviceDto = (d) => ({
  id: d.id,
  name: d.name,
  verified: d.verified,
  createdAt: d.createdAt,
  lastUsedAt: d.lastUsedAt,
});

const getStatus = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const devices = await prisma.userAuthenticator.findMany({
      where: { userId: req.user.userId, verified: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({
      enabled: !!user?.twoFactorEnabled && devices.length > 0,
      authenticators: devices.map(deviceDto),
      backupCodesRemaining: countBackupCodes(user?.backupCodes),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Step 1 – create a pending authenticator and return the QR code + manual key. */
const setup = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim().slice(0, 60) || 'Authenticator';
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // clean up abandoned setups
    await prisma.userAuthenticator.deleteMany({ where: { userId, verified: false } });

    const count = await prisma.userAuthenticator.count({ where: { userId, verified: true } });
    if (count >= 10) return res.status(400).json({ message: 'Maximum of 10 authenticator devices reached' });

    const secret = generateSecret();
    const row = await prisma.userAuthenticator.create({
      data: { userId, name, secretEnc: encryptSecret(secret), verified: false },
    });

    const otpauthUrl = buildOtpAuthUrl({ secret, accountName: user.email });
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });

    res.json({ id: row.id, name: row.name, secret, otpauthUrl, qrDataUrl });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ message: 'Could not start 2FA setup' });
  }
};

/** Step 2 – confirm with a code from the app. First device also enables 2FA and returns backup codes. */
const verifySetup = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, code } = req.body || {};
    const limit = rateLimit.hit(`mfasetup:${userId}`, 10, 10 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ message: 'Too many attempts. Try again later.' });

    const device = await prisma.userAuthenticator.findFirst({ where: { id: parseInt(id), userId, verified: false } });
    if (!device) return res.status(404).json({ message: 'Setup session not found. Start again.' });

    if (!verifyTotp(decryptSecret(device.secretEnc), code, `setup:${device.id}`)) {
      return res.status(400).json({ message: 'Invalid code. Check the time on your phone and try again.' });
    }

    await prisma.userAuthenticator.update({ where: { id: device.id }, data: { verified: true, lastUsedAt: new Date() } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    let backupCodes = null;
    if (!user.twoFactorEnabled) {
      const gen = generateBackupCodes(8);
      backupCodes = gen.plain;
      await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true, backupCodes: gen.stored } });
    }

    await logAudit({ req, action: 'TWO_FACTOR_DEVICE_ADDED', entity: 'auth', entityId: userId, details: { device: device.name } });
    res.json({ message: 'Authenticator added', backupCodes });
  } catch (err) {
    console.error('2FA verify error:', err);
    res.status(500).json({ message: 'Could not verify code' });
  }
};

const removeAuthenticator = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await checkPassword(userId, req.body?.password);
    if (!user) return res.status(400).json({ message: 'Password is incorrect' });

    const id = parseInt(req.params.id);
    const device = await prisma.userAuthenticator.findFirst({ where: { id, userId } });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    await prisma.userAuthenticator.delete({ where: { id } });
    const remaining = await prisma.userAuthenticator.count({ where: { userId, verified: true } });
    if (remaining === 0) {
      await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, backupCodes: null } });
    }

    await logAudit({ req, action: 'TWO_FACTOR_DEVICE_REMOVED', entity: 'auth', entityId: userId, details: { device: device.name, remaining } });
    res.json({ message: 'Device removed', twoFactorEnabled: remaining > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Needs password AND a current code (or backup code) so a stolen session can't turn 2FA off. */
const disable = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await checkPassword(userId, req.body?.password);
    if (!user) return res.status(400).json({ message: 'Password is incorrect' });

    const code = String(req.body?.code || '').trim();
    let ok = false;
    if (/^\d{6}$/.test(code.replace(/\s+/g, ''))) {
      const devices = await prisma.userAuthenticator.findMany({ where: { userId, verified: true } });
      ok = devices.some((d) => { try { return verifyTotp(decryptSecret(d.secretEnc), code, `disable:${d.id}`); } catch { return false; } });
    } else {
      ok = consumeBackupCode(user.backupCodes, code).ok;
    }
    if (!ok) return res.status(400).json({ message: 'Invalid verification code' });

    await prisma.userAuthenticator.deleteMany({ where: { userId } });
    await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, backupCodes: null } });
    await logAudit({ req, action: 'TWO_FACTOR_DISABLED', entity: 'auth', entityId: userId });
    res.json({ message: 'Two-factor authentication disabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const regenerateBackupCodes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await checkPassword(userId, req.body?.password);
    if (!user) return res.status(400).json({ message: 'Password is incorrect' });
    if (!user.twoFactorEnabled) return res.status(400).json({ message: 'Enable two-factor authentication first' });

    const gen = generateBackupCodes(8);
    await prisma.user.update({ where: { id: userId }, data: { backupCodes: gen.stored } });
    await logAudit({ req, action: 'BACKUP_CODES_REGENERATED', entity: 'auth', entityId: userId });
    res.json({ backupCodes: gen.plain });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const myLoginHistory = async (req, res) => {
  try {
    const rows = await prisma.loginHistory.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, success: true, reason: true, ip: true, device: true, browser: true, os: true, createdAt: true },
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Super-admin: remove all authenticators of another user (lost phone). */
const adminResetUser2fa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ message: 'User not found' });
    await prisma.userAuthenticator.deleteMany({ where: { userId: id } });
    await prisma.user.update({ where: { id }, data: { twoFactorEnabled: false, backupCodes: null } });
    await logAudit({ req, action: 'TWO_FACTOR_RESET_BY_ADMIN', entity: 'users', entityId: id, details: { targetEmail: target.email } });
    res.json({ message: `Two-factor authentication reset for ${target.email}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStatus,
  setup,
  verifySetup,
  removeAuthenticator,
  disable,
  regenerateBackupCodes,
  myLoginHistory,
  adminResetUser2fa,
};

