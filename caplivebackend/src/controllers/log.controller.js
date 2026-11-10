// Read-only log endpoints (audit, login history, email, webhook) + email resend.
const prisma = require('../utils/prisma');
const { getTransporter } = require('../utils/mailer');
const { logAudit } = require('../utils/audit');

const pageParams = (req, defLimit = 25) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const dateRange = (req) => {
  const range = {};
  if (req.query.from) { const d = new Date(req.query.from); if (!isNaN(d)) range.gte = d; }
  if (req.query.to) { const d = new Date(req.query.to); if (!isNaN(d)) { d.setHours(23, 59, 59, 999); range.lte = d; } }
  return Object.keys(range).length ? range : undefined;
};

const paged = (data, total, page, limit) => ({ data, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });

// ───────────── Audit logs ─────────────
exports.getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req);
    const where = {};
    if (req.query.userId) where.userId = parseInt(req.query.userId);
    if (req.query.entity) where.entity = String(req.query.entity);
    if (req.query.method) where.method = String(req.query.method).toUpperCase();
    const created = dateRange(req);
    if (created) where.createdAt = created;
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [{ action: { contains: s } }, { userEmail: { contains: s } }, { path: { contains: s } }, { entityId: { contains: s } }];
    }
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.auditLog.count({ where }),
    ]);
    res.json(paged(rows, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ───────────── Login history (all users) ─────────────
exports.getLoginHistory = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req);
    const where = {};
    if (req.query.userId) where.userId = parseInt(req.query.userId);
    if (req.query.success === 'true') where.success = true;
    if (req.query.success === 'false') where.success = false;
    const created = dateRange(req);
    if (created) where.createdAt = created;
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [{ email: { contains: s } }, { ip: { contains: s } }];
    }
    const [rows, total] = await Promise.all([
      prisma.loginHistory.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.loginHistory.count({ where }),
    ]);
    res.json(paged(rows, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ───────────── Email logs ─────────────
const emailListSelect = {
  id: true, toEmail: true, fromEmail: true, subject: true, orderNumber: true, status: true, error: true,
  messageId: true, attachmentsTruncated: true, resendOfId: true, resentCount: true, lastResentAt: true, createdAt: true,
};

exports.getEmailLogs = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req);
    const where = {};
    if (req.query.status && ['SENT', 'FAILED'].includes(String(req.query.status).toUpperCase())) {
      where.status = String(req.query.status).toUpperCase();
    }
    const created = dateRange(req);
    if (created) where.createdAt = created;
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [{ toEmail: { contains: s } }, { subject: { contains: s } }, { orderNumber: { contains: s } }];
    }
    const [rows, total, sent, failed] = await Promise.all([
      prisma.emailLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, select: emailListSelect }),
      prisma.emailLog.count({ where }),
      prisma.emailLog.count({ where: { ...where, status: 'SENT' } }),
      prisma.emailLog.count({ where: { ...where, status: 'FAILED' } }),
    ]);
    res.json({ ...paged(rows, total, page, limit), stats: { sent, failed } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getEmailLog = async (req, res) => {
  try {
    const row = await prisma.emailLog.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!row) return res.status(404).json({ message: 'Email log not found' });
    let attachments = [];
    try { attachments = JSON.parse(row.attachments || '[]').map((a) => ({ filename: a.filename, contentType: a.contentType, cid: a.cid, stored: !!a.contentBase64 })); } catch { attachments = []; }
    // Send html as an explicit string so the global JSON auto-parser can never touch it
    res.json({ ...row, attachments, html: row.html || '', htmlIsString: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resendOne = async (id, overrideTo = null) => {
  const row = await prisma.emailLog.findUnique({ where: { id } });
  if (!row) throw new Error('Email log not found');

  let opts = {};
  try { opts = JSON.parse(row.optionsJson || '{}'); } catch { opts = {}; }

  let attachments;
  try {
    const parsed = JSON.parse(row.attachments || '[]');
    const withData = parsed.filter((a) => a.contentBase64 || a.path);
    attachments = withData.map((a) => ({
      filename: a.filename || undefined,
      contentType: a.contentType || undefined,
      cid: a.cid || undefined,
      ...(a.contentBase64 ? { content: Buffer.from(a.contentBase64, 'base64') } : { path: a.path }),
    }));
  } catch { attachments = undefined; }

  const mail = {
    from: opts.from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: overrideTo || opts.to || row.toEmail,
    subject: row.subject || '',
    html: row.html || undefined,
    text: row.textBody || undefined,
    __logMeta: { resendOfId: row.id, orderNumber: row.orderNumber },
  };
  if (!overrideTo && opts.cc) mail.cc = opts.cc;
  if (!overrideTo && opts.bcc) mail.bcc = opts.bcc;
  if (opts.replyTo) mail.replyTo = opts.replyTo;
  if (attachments && attachments.length) mail.attachments = attachments;

  await getTransporter().sendMail(mail);
  await prisma.emailLog.update({ where: { id: row.id }, data: { resentCount: { increment: 1 }, lastResentAt: new Date() } });
  return { id: row.id, attachmentsMissing: row.attachmentsTruncated };
};

exports.resendEmail = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const to = req.body?.to ? String(req.body.to).trim() : null;
    const result = await resendOne(id, to);
    await logAudit({ req, action: 'EMAIL_RESENT', entity: 'email-logs', entityId: id, details: { to } });
    res.json({ message: 'Email re-sent', ...result });
  } catch (err) {
    res.status(500).json({ message: `Re-send failed: ${err.message}` });
  }
};

exports.resendEmailsBulk = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((n) => parseInt(n)).filter(Boolean).slice(0, 200) : [];
    if (!ids.length) return res.status(400).json({ message: 'No emails selected' });
    const results = [];
    for (const id of ids) {
      try {
        const r = await resendOne(id);
        results.push({ id, success: true, ...r });
      } catch (e) {
        results.push({ id, success: false, error: e.message });
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    const ok = results.filter((r) => r.success).length;
    await logAudit({ req, action: 'EMAIL_RESENT_BULK', entity: 'email-logs', details: { ids, ok, failed: results.length - ok } });
    res.json({ message: `${ok} of ${results.length} email(s) re-sent`, success: ok, failed: results.length - ok, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ───────────── Webhook logs ─────────────
exports.getWebhookLogs = async (req, res) => {
  try {
    const { page, limit, skip } = pageParams(req);
    const where = {};
    if (req.query.provider) where.provider = String(req.query.provider);
    if (req.query.status && ['SUCCESS', 'FAILED', 'RECEIVED'].includes(String(req.query.status).toUpperCase())) {
      where.status = String(req.query.status).toUpperCase();
    }
    const created = dateRange(req);
    if (created) where.createdAt = created;
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [{ reference: { contains: s } }, { eventType: { contains: s } }, { eventId: { contains: s } }];
    }
    const [rows, total, success, failed] = await Promise.all([
      prisma.webhookLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, select: { id: true, provider: true, eventType: true, eventId: true, reference: true, status: true, httpStatus: true, error: true, durationMs: true, ip: true, createdAt: true } }),
      prisma.webhookLog.count({ where }),
      prisma.webhookLog.count({ where: { ...where, status: 'SUCCESS' } }),
      prisma.webhookLog.count({ where: { ...where, status: 'FAILED' } }),
    ]);
    res.json({ ...paged(rows, total, page, limit), stats: { success, failed } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWebhookLog = async (req, res) => {
  try {
    const row = await prisma.webhookLog.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!row) return res.status(404).json({ message: 'Webhook log not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

