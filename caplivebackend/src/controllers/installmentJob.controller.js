const prisma = require('../utils/prisma');
const { evaluateJob, runJob } = require('../services/installmentJob.service');

const requestApiBase = (req) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return null;
  return `${String(proto).split(',')[0]}://${String(host).split(',')[0]}/api`;
};

const validateBody = async (body) => {
  const statusId = parseInt(body.statusId !== undefined ? body.statusId : body.targetStatusId);
  const delayValue = parseInt(body.delayValue !== undefined ? body.delayValue : 1);
  const delayUnit = String(body.delayUnit || 'MONTHS').toUpperCase();
  const sendTime = String(body.sendTime || body.triggerTime || '09:00');
  if (!String(body.name || '').trim()) return { error: 'Name is required' };
  if (isNaN(statusId)) return { error: 'Please choose a status' };
  if (isNaN(delayValue) || delayValue < 0 || delayValue > 3650) return { error: 'Delay must be a number between 0 and 3650' };
  if (!['DAYS', 'MONTHS'].includes(delayUnit)) return { error: 'Unit must be DAYS or MONTHS' };
  if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(sendTime)) return { error: 'Time must be HH:mm' };
  const status = await prisma.orderStatus.findUnique({ where: { id: statusId } });
  if (!status) return { error: 'Status not found' };

  // If the status is not yet flagged as installment trigger, auto-detect from name/slug so admin is never blocked
  if (!status.isInstallmentTrigger || status.installmentTriggerIndex === null || status.installmentTriggerIndex < 1) {
    const combined = `${status.name || ''} ${status.slug || ''}`.toLowerCase();
    let detectedIndex = 1; // default to Installment 2 (Rate 2 = index 1)
    if (combined.includes('3') || combined.includes('three') || combined.includes('tredje')) {
      detectedIndex = 2; // Installment 3 (Rate 3 = index 2)
    }

    await prisma.orderStatus.update({
      where: { id: status.id },
      data: { isInstallmentTrigger: true, installmentTriggerIndex: detectedIndex },
    }).catch((e) => console.warn('[INSTALLMENT-JOB] Could not auto-flag status as installment trigger:', e.message));
  }

  let onlyOrdersAfter = null;
  const rawDate = body.onlyOrdersAfter || body.orderDateFrom;
  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d)) {
      onlyOrdersAfter = d;
    }
  }
  return { data: { name: String(body.name).trim().slice(0, 120), statusId, delayValue, delayUnit, sendTime: sendTime.padStart(5, '0'), onlyOrdersAfter } };
};

const summarize = (rows) => {
  const c = {};
  for (const r of rows) c[r.state] = (c[r.state] || 0) + 1;
  return c;
};

const decorate = async (job) => {
  const ev = await evaluateJob(job);
  return {
    ...job,
    statusName: ev.status?.name || null,
    statusColor: ev.status?.color || null,
    installmentIndex: ev.installmentIndex ?? null,
    installmentNumber: ev.installmentIndex !== undefined && ev.installmentIndex !== null ? ev.installmentIndex + 1 : null,
    configError: ev.error || null,
    counts: summarize(ev.rows),
  };
};

exports.listJobs = async (req, res) => {
  try {
    const jobs = await prisma.installmentJob.findMany({ orderBy: { id: 'asc' } });
    const out = [];
    for (const j of jobs) out.push(await decorate(j));
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const v = await validateBody(req.body || {});
    if (v.error) return res.status(400).json({ message: v.error });
    const job = await prisma.installmentJob.create({
      data: { ...v.data, isActive: !!req.body.isActive, apiBaseUrl: requestApiBase(req) },
    });
    res.status(201).json(await decorate(job));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const v = await validateBody(req.body || {});
    if (v.error) return res.status(400).json({ message: v.error });
    const job = await prisma.installmentJob.update({
      where: { id },
      data: { ...v.data, ...(req.body.isActive !== undefined ? { isActive: !!req.body.isActive } : {}), apiBaseUrl: requestApiBase(req) },
    });
    res.json(await decorate(job));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleJob = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.installmentJob.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Job not found' });
    const job = await prisma.installmentJob.update({
      where: { id },
      data: { isActive: !existing.isActive, apiBaseUrl: requestApiBase(req) || existing.apiBaseUrl },
    });
    res.json(await decorate(job));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    await prisma.installmentJob.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Shows exactly which orders are due / scheduled / waiting – nothing is sent. */
exports.previewJob = async (req, res) => {
  try {
    const job = await prisma.installmentJob.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const ev = await evaluateJob(job);
    res.json({
      job: { id: job.id, name: job.name, sendTime: job.sendTime, delayValue: job.delayValue, delayUnit: job.delayUnit },
      statusName: ev.status?.name || null,
      installmentNumber: ev.installmentIndex !== undefined ? ev.installmentIndex + 1 : null,
      error: ev.error || null,
      counts: summarize(ev.rows),
      rows: ev.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Manual run: either all due orders or only the selected ones. */
exports.runJobNow = async (req, res) => {
  try {
    const job = await prisma.installmentJob.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const base = requestApiBase(req);
    if (base && base !== job.apiBaseUrl) job.apiBaseUrl = base;
    const orderIds = Array.isArray(req.body?.orderIds) && req.body.orderIds.length ? req.body.orderIds : null;
    const summary = await runJob(job, { trigger: 'MANUAL', onlyOrderIds: orderIds });
    res.json({
      message: `Triggered ${summary.triggered}, failed ${summary.failed}, skipped ${summary.skipped}`,
      ...summary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getJobLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const where = {};
    if (req.query.jobId) where.jobId = parseInt(req.query.jobId);
    if (req.query.status && ['SUCCESS', 'FAILED', 'SKIPPED'].includes(String(req.query.status).toUpperCase())) {
      where.status = String(req.query.status).toUpperCase();
    }
    if (req.query.search) {
      const s = String(req.query.search);
      where.OR = [{ orderNumber: { contains: s } }, { customerEmail: { contains: s } }];
    }
    const [rows, total] = await Promise.all([
      prisma.installmentJobLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.installmentJobLog.count({ where }),
    ]);
    res.json({ data: rows, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

