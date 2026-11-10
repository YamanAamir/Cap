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

const getHumanActionTitle = (method, path, entity) => {
  const m = (method || '').toUpperCase();
  const cleanPath = (path || '').toLowerCase();
  
  if (cleanPath.includes('/installment-jobs')) {
    if (cleanPath.includes('/trigger') || cleanPath.includes('/run')) return 'Run Installment Job';
    if (cleanPath.includes('/toggle')) return 'Toggle Installment Job';
    if (m === 'POST') return 'Create Installment Job';
    if (m === 'PUT' || m === 'PATCH') return 'Update Installment Job';
    if (m === 'DELETE') return 'Delete Installment Job';
    return 'Installment Job Action';
  }
  if (cleanPath.includes('/customers')) {
    if (m === 'POST') return 'Create Customer';
    if (m === 'PUT' || m === 'PATCH') return 'Update Customer';
    if (m === 'DELETE') return 'Delete Customer';
    return 'Customer Action';
  }
  if (cleanPath.includes('/orders')) {
    if (cleanPath.includes('/status')) return 'Update Order Status';
    if (m === 'POST') return 'Create Order';
    if (m === 'PUT' || m === 'PATCH') return 'Update Order';
    if (m === 'DELETE') return 'Delete Order';
    return 'Order Action';
  }
  if (cleanPath.includes('/users')) {
    if (m === 'POST') return 'Create User';
    if (m === 'PUT' || m === 'PATCH') return 'Update User';
    if (m === 'DELETE') return 'Delete User';
    return 'User Action';
  }
  if (cleanPath.includes('/security') || cleanPath.includes('/2fa')) {
    return 'Update 2FA Security';
  }
  if (cleanPath.includes('/email-templates')) {
    if (m === 'POST') return 'Create Email Template';
    if (m === 'PUT' || m === 'PATCH') return 'Update Email Template';
    if (m === 'DELETE') return 'Delete Email Template';
  }
  if (cleanPath.includes('/sms')) {
    if (cleanPath.includes('/send')) return 'Send SMS';
    if (m === 'POST') return 'Create SMS Campaign';
    if (m === 'DELETE') return 'Delete SMS Campaign';
  }
  if (cleanPath.includes('/discount')) {
    if (m === 'POST') return 'Create Discount Code';
    if (m === 'PUT' || m === 'PATCH') return 'Update Discount Code';
    if (m === 'DELETE') return 'Delete Discount Code';
  }
  if (cleanPath.includes('/installment-plan')) {
    if (m === 'POST') return 'Create Installment Plan';
    if (m === 'PUT' || m === 'PATCH') return 'Update Installment Plan';
    if (m === 'DELETE') return 'Delete Installment Plan';
  }
  
  const verbMap = { POST: 'Create', PUT: 'Update', PATCH: 'Update', DELETE: 'Delete' };
  const verb = verbMap[m] || m;
  const entityName = (entity || 'Item').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${verb} ${entityName}`;
};

const auditMiddleware = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const originalUrl = req.originalUrl || '';
  if (SKIP_PATH.test(originalUrl)) return next();

  res.on('finish', async () => {
    // req.user is attached by verifyToken inside the router. Unauthenticated calls are not part of the admin trail.
    if (!req.user) return;
    const pathOnly = originalUrl.split('?')[0];
    const segs = pathOnly.split('/').filter(Boolean); // ['api','admin','users','5']
    const rest = segs.slice(1).filter((s) => s !== 'admin');
    const entity = rest[0] || null;
    const idSeg = rest.find((s, i) => i > 0 && /^[0-9a-f-]{1,40}$/i.test(s) && /\d/.test(s));
    const pattern = pathOnly.replace(/\/\d+(?=\/|$)/g, '/:id');
    const humanAction = getHumanActionTitle(req.method, pathOnly, entity);
    let userName = req.user.name || null;

    let finalEntityId = idSeg || null;
    if ((entity === 'orders' || pathOnly.includes('/orders/')) && idSeg && /^\d+$/.test(idSeg)) {
      try {
        const ord = await getPrisma().order.findUnique({
          where: { id: parseInt(idSeg) },
          select: { orderNumber: true },
        });
        if (ord && ord.orderNumber) {
          finalEntityId = ord.orderNumber;
        }
      } catch (err) {}
    }

    logAudit({
      req,
      user: { id: req.user.id || req.user.userId, name: userName, email: req.user.email },
      action: humanAction,
      entity,
      entityId: finalEntityId,
      statusCode: res.statusCode,
      details: { body: req.body, query: req.query, route: `${req.method} ${pattern}` },
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
