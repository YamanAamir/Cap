const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { getTransporter } = require('../utils/mailer');
const { logAudit, logLogin } = require('../utils/audit');
const { getClientIp } = require('../utils/requestInfo');
const rateLimit = require('../utils/rateLimit');
const { verifyTotp, decryptSecret, consumeBackupCode } = require('../utils/totp');

const JWT_SECRET = () => process.env.JWT_SECRET || 'your_jwt_secret';

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  twoFactorEnabled: !!user.twoFactorEnabled,
});

/** Issues the real session (cookie + token). Same response shape the dashboards already expect. */
const completeLogin = async (req, res, user, method = 'password') => {
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET(),
    { expiresIn: '1d' }
  );

  res.cookie('token', token, {
    httpOnly: false, // unchanged: dashboards read this cookie
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  });

  prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
  await logLogin({ req, user, email: user.email, success: true, reason: method === '2fa' ? 'Login with 2FA' : 'Login' });
  await logAudit({ req, user, action: 'LOGIN', entity: 'auth', entityId: user.id, details: { method } });

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: publicUser(user),
  });
};

const login = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const ip = getClientIp(req) || 'unknown';
    const limit = rateLimit.hit(`login:${ip}:${email.toLowerCase()}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      await logLogin({ req, email, success: false, reason: 'Rate limited' });
      return res.status(429).json({ message: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minute(s).` });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      await logLogin({ req, email, success: false, reason: 'Unknown email' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      await logLogin({ req, user, email, success: false, reason: 'Wrong password' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2FA enabled → password is only step one
    if (user.twoFactorEnabled) {
      const deviceCount = await prisma.userAuthenticator.count({ where: { userId: user.id, verified: true } });
      if (deviceCount > 0) {
        const mfaToken = jwt.sign({ userId: user.id, purpose: 'mfa' }, JWT_SECRET(), { expiresIn: '5m' });
        return res.status(200).json({ requires2FA: true, mfaToken, message: 'Two-factor code required' });
      }
    }

    rateLimit.reset(`login:${ip}:${email.toLowerCase()}`);
    return await completeLogin(req, res, user, 'password');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/** Step two of login: authenticator code (or one-time backup code). */
const login2fa = async (req, res) => {
  try {
    const { mfaToken, code } = req.body || {};
    if (!mfaToken || !code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(mfaToken, JWT_SECRET());
    } catch {
      return res.status(401).json({ message: 'Verification session expired. Please log in again.', expired: true });
    }
    if (decoded.purpose !== 'mfa') {
      return res.status(401).json({ message: 'Invalid verification session' });
    }

    const limit = rateLimit.hit(`mfa:${decoded.userId}`, 6, 10 * 60 * 1000);
    if (!limit.allowed) {
      return res.status(429).json({ message: `Too many wrong codes. Try again in ${Math.ceil(limit.retryAfterSec / 60)} minute(s).` });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: 'Invalid verification session' });

    const clean = String(code).trim();
    let ok = false;

    if (/^\d{6}$/.test(clean.replace(/\s+/g, ''))) {
      const devices = await prisma.userAuthenticator.findMany({ where: { userId: user.id, verified: true } });
      for (const d of devices) {
        let secret;
        try { secret = decryptSecret(d.secretEnc); } catch { continue; }
        if (verifyTotp(secret, clean, `login:${d.id}`)) {
          ok = true;
          prisma.userAuthenticator.update({ where: { id: d.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
          break;
        }
      }
    } else {
      const result = consumeBackupCode(user.backupCodes, clean);
      if (result.ok) {
        ok = true;
        await prisma.user.update({ where: { id: user.id }, data: { backupCodes: result.stored } });
        await logAudit({ req, user, action: 'BACKUP_CODE_USED', entity: 'auth', entityId: user.id });
      }
    }

    if (!ok) {
      await logLogin({ req, user, email: user.email, success: false, reason: 'Wrong 2FA code' });
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    rateLimit.reset(`mfa:${user.id}`);
    return await completeLogin(req, res, user, '2fa');
  } catch (error) {
    console.error('2FA login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, twoFactorEnabled: true, lastLoginAt: true },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

// ─────────────── Forgot / reset password ───────────────
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const resolveDashboardBase = (req) => {
  const fromEnv = (process.env.DASHBOARD_URL || '').split(',')[0].trim().replace(/\/+$/, '');
  let origin = '';
  if (fromEnv) {
    try { origin = new URL(fromEnv).origin; } catch { origin = ''; }
  }
  if (!origin) {
    // Fallback (set DASHBOARD_URL in .env for production!)
    const o = req.headers.origin || '';
    try { origin = o ? new URL(o).origin : ''; } catch { origin = ''; }
    if (origin) console.warn('[AUTH] DASHBOARD_URL is not set – using request Origin for password reset links. Set DASHBOARD_URL in .env.');
  }
  let basePath = '/';
  const p = String(req.body?.redirectPath || '');
  if (/^\/[A-Za-z0-9/_-]*$/.test(p) && !p.startsWith('//')) basePath = p.endsWith('/') ? p : `${p}/`;
  let envPath = '';
  try { if (fromEnv) envPath = new URL(fromEnv).pathname.replace(/\/+$/, ''); } catch { envPath = ''; }
  if (envPath) basePath = `${envPath}/`;
  return { origin, basePath };
};

const forgotPassword = async (req, res) => {
  const generic = { message: 'If an account with that email exists, a password reset link has been sent.' };
  try {
    const email = String(req.body?.email || '').trim();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const ip = getClientIp(req) || 'unknown';
    const limit = rateLimit.hit(`forgot:${ip}:${email.toLowerCase()}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ message: 'Too many requests. Please try again later.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json(generic);

    const { origin, basePath } = resolveDashboardBase(req);
    if (!origin) {
      console.error('[AUTH] Cannot build reset link: no DASHBOARD_URL and no Origin header');
      return res.json(generic);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: sha256(rawToken), resetTokenExpires: new Date(Date.now() + 30 * 60 * 1000) },
    });

    const link = `${origin}${basePath}reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111827">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>Hi ${user.name || ''},</p>
        <p>We received a request to reset the password for your dashboard account. Click the button below to choose a new password. This link is valid for <strong>30 minutes</strong>.</p>
        <p style="margin:24px 0"><a href="${link}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">Reset password</a></p>
        <p style="font-size:13px;color:#6b7280">If you did not request this, you can safely ignore this email – your password will stay the same.</p>
        <p style="font-size:12px;color:#9ca3af;word-break:break-all">Link: ${link}</p>
      </div>`;

    try {
      await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: 'Reset your dashboard password',
        html,
      });
    } catch (mailErr) {
      console.error('[AUTH] Failed to send password reset email:', mailErr.message);
    }

    await logAudit({ req, user, action: 'PASSWORD_RESET_REQUESTED', entity: 'auth', entityId: user.id });
    return res.json(generic);
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.json(generic);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body || {};
    if (!token || !email || !password) return res.status(400).json({ message: 'Token, email and new password are required' });
    if (String(password).length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const ip = getClientIp(req) || 'unknown';
    const limit = rateLimit.hit(`reset:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) return res.status(429).json({ message: 'Too many attempts. Please try again later.' });

    const user = await prisma.user.findUnique({ where: { email: String(email).trim() } });
    const bad = () => res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    if (!user || !user.resetTokenHash || !user.resetTokenExpires) return bad();
    if (user.resetTokenExpires.getTime() < Date.now()) return bad();

    const a = Buffer.from(sha256(String(token)));
    const b = Buffer.from(user.resetTokenHash);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return bad();

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(String(password), 10), resetTokenHash: null, resetTokenExpires: null },
    });

    await logAudit({ req, user, action: 'PASSWORD_RESET_COMPLETED', entity: 'auth', entityId: user.id });
    return res.json({ message: 'Password has been reset. You can now log in.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new password are required' });
    if (String(newPassword).length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || !(await bcrypt.compare(String(currentPassword), user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(String(newPassword), 10) } });
    await logAudit({ req, user, action: 'PASSWORD_CHANGED', entity: 'auth', entityId: user.id });
    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
  login2fa,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};
