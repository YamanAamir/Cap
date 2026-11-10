// Audit trail + login history helpers. Logging must NEVER break a request, so everything is try/catch'd.
const { getClientIp, parseUserAgent } = require('./requestInfo');

const getPrisma = () => require('./prisma');

const SENSITIVE_KEY = /pass(word)?|secret|token|otp|backup|cvv|card|authorization|capimages|image|base64|svg|html|signature/i;

const sanitize = (val, depth = 0) => {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') return val.length > 200 ? `${val.slice(0, 200)}…(${val.length} chars)` : val;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (depth >= 3) return '[…]';
  if (Array.isArray(val)) {
    if (val.length > 15) return `[array of ${val.length} items]`;
    return val.map((v) => sanitize(v, depth + 1));
  }
  if (typeof val === 'object') {
    const out = {};
    for (const k of Object.keys(val).slice(0, 40)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[hidden]' : sanitize(val[k], depth + 1);
    }
    return out;
  }
  return String(val);
};

const stringifyDetails = (details) => {
  if (details === undefined || details === null) return null;
  try {
    const s = JSON.stringify(sanitize(details));
    return s.length > 4000 ? `${s.slice(0, 4000)}…` : s;
  } catch {
    return null;
  }
};

/** Explicit audit entry (login, 2FA changes, system jobs, …). */
const logAudit = async ({ req = null, user = null, action, entity = null, entityId = null, details = null, statusCode = null }) => {
  try {
    const u = user || req?.user || {};
    await getPrisma().auditLog.create({
      data: {
        userId: u.id || u.userId || null,
        userName: u.name || null,
        userEmail: u.email || null,
        action: String(action).slice(0, 190),
        method: req?.method || null,
        path: req ? String(req.originalUrl || '').split('?')[0].slice(0, 250) : null,
        statusCode,
        entity: entity ? String(entity).slice(0, 100) : null,
        entityId: entityId !== null && entityId !== undefined ? String(entityId).slice(0, 100) : null,
        details: stringifyDetails(details),
        ip: req ? getClientIp(req) : null,
        userAgent: req ? String(req.headers['user-agent'] || '').slice(0, 500) : null,
      },
    });
  } catch (err) {
    console.error('[AUDIT] failed to write audit log:', err.message);
  }
};

/** Login history row (success or failure) with IP + device. */
const logLogin = async ({ req, user = null, email, success, reason = null }) => {
  try {
    const ua = String(req.headers['user-agent'] || '');
    const info = parseUserAgent(ua);
    await getPrisma().loginHistory.create({
      data: {
        userId: user?.id || null,
        email: String(email || user?.email || '').slice(0, 190),
        success: !!success,
        reason: reason ? String(reason).slice(0, 190) : null,
        ip: getClientIp(req),
        userAgent: ua.slice(0, 500),
        device: info.device,
        browser: info.browser,
        os: info.os,
      },
    });
  } catch (err) {
    console.error('[AUDIT] failed to write login history:', err.message);
  }
};

// Generic middleware: records every authenticated write (POST/PUT/PATCH/DELETE) made by a dashboard user.
const SKIP_PATH = /^\/api\/(webhook|auth\/(login|forgot-password|reset-password))/;

const auditMiddleware = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const originalUrl = req.originalUrl || '';
  if (SKIP_PATH.test(originalUrl)) return next();

  res.on('finish', () => {
    // req.user is attached by verifyToken inside the router. Unauthenticated calls are not part of the admin trail.
    if (!req.user) return;
    const pathOnly = originalUrl.split('?')[0];
    const segs = pathOnly.split('/').filter(Boolean); // ['api','admin','users','5']
    const rest = segs.slice(1).filter((s) => s !== 'admin');
    const entity = rest[0] || null;
    const idSeg = rest.find((s, i) => i > 0 && /^[0-9a-f-]{1,40}$/i.test(s) && /\d/.test(s));
    const pattern = pathOnly.replace(/\/\d+(?=\/|$)/g, '/:id');
    let userName = req.user.name || null;
    logAudit({
      req,
      user: { id: req.user.id || req.user.userId, name: userName, email: req.user.email },
      action: `${req.method} ${pattern}`,
      entity,
      entityId: idSeg || null,
      statusCode: res.statusCode,
      details: { body: req.body, query: req.query },
    });
  });
  next();
};

/** Deletes old rows so log tables don't grow forever. */
const cleanupOldLogs = async () => {
  const prisma = getPrisma();
  const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  try {
    const a = await prisma.emailLog.deleteMany({ where: { createdAt: { lt: daysAgo(120) } } });
    const b = await prisma.webhookLog.deleteMany({ where: { createdAt: { lt: daysAgo(120) } } });
    const c = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: daysAgo(400) } } });
    const d = await prisma.loginHistory.deleteMany({ where: { createdAt: { lt: daysAgo(400) } } });
    const e = await prisma.installmentJobLog.deleteMany({ where: { createdAt: { lt: daysAgo(400) } } });
    console.log(`[CRON] Log cleanup: email=${a.count} webhook=${b.count} audit=${c.count} login=${d.count} jobLogs=${e.count}`);
  } catch (err) {
    console.error('[CRON] Log cleanup error:', err.message);
  }
};

module.exports = { logAudit, logLogin, auditMiddleware, cleanupOldLogs, sanitize };
