// Automatic installment trigger jobs.
//
// A job says: "Move orders to <installment trigger status> N days/months after the previous payment,
// at HH:mm". Moving an order to that status goes through the SAME code path as an admin changing the
// status by hand (processSingleOrderStatusUpdate) so the existing "installment trigger" behaviour
// (payment-link email, status email template, status history) is reused 1:1.
//
//   Installment 2 (index 1): reference date = date of the first payment (order date)
//   Installment 3+ (index ≥2): reference date = date the previous installment was PAID
//   → installments can never fire together; each one waits for the previous payment.
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');

const TZ = 'Europe/Copenhagen';
const FAILED_RETRY_LIMIT = 3;

const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

const wallParts = (date) => {
  const o = {};
  for (const p of fmt.formatToParts(date)) if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10);
  return { y: o.year, m: o.month, d: o.day, hh: o.hour, mm: o.minute };
};

const pad = (n) => String(n).padStart(2, '0');
const naiveToString = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

const parseSendTime = (s) => {
  const m = String(s || '09:00').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return { h: 9, min: 0 };
  return { h: Math.min(23, parseInt(m[1])), min: Math.min(59, parseInt(m[2])) };
};

/** Due moment as "Copenhagen wall-clock" milliseconds (naive UTC trick – DST safe for day/month math). */
const computeDueNaive = (refDate, job) => {
  const p = wallParts(new Date(refDate));
  const { h, min } = parseSendTime(job.sendTime);
  const n = Math.max(0, parseInt(job.delayValue) || 0);
  if (String(job.delayUnit).toUpperCase() === 'DAYS') {
    return Date.UTC(p.y, p.m - 1, p.d + n, h, min);
  }
  const totalMonths = p.m - 1 + n;
  const ty = p.y + Math.floor(totalMonths / 12);
  const tm = ((totalMonths % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return Date.UTC(ty, tm, Math.min(p.d, lastDay), h, min);
};

const nowNaive = () => {
  const p = wallParts(new Date());
  return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm);
};

const safeParse = (v) => {
  if (v && typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return null; }
};

/**
 * Evaluates every order against a job. Returns { status, installmentIndex, rows, error }.
 * Row states: DUE, SCHEDULED, WAITING_PREVIOUS, NO_REFERENCE_DATE, ALREADY_TRIGGERED, ALREADY_IN_STATUS
 */
const evaluateJob = async (job) => {
  const status = await prisma.orderStatus.findUnique({ where: { id: job.statusId } });
  if (!status) return { error: 'The selected status no longer exists.', rows: [] };

  // Auto-detect installment trigger index if not explicitly configured so the job works seamlessly
  if (!status.isInstallmentTrigger || status.installmentTriggerIndex === null || status.installmentTriggerIndex === undefined) {
    const combined = `${status.name || ''} ${status.slug || ''}`.toLowerCase();
    let detectedIndex = 1; // Default to Rate 2 = index 1
    if (combined.includes('3') || combined.includes('three') || combined.includes('tredje')) {
      detectedIndex = 2; // Rate 3 = index 2
    }
    await prisma.orderStatus.update({
      where: { id: status.id },
      data: { isInstallmentTrigger: true, installmentTriggerIndex: detectedIndex },
    }).catch(() => {});
    status.isInstallmentTrigger = true;
    status.installmentTriggerIndex = detectedIndex;
  }

  const idx = status.installmentTriggerIndex;
  if (idx < 1) {
    return { status, installmentIndex: idx, error: 'Installment 1 is the initial down payment and cannot be triggered by a job.', rows: [] };
  }

  const where = { installmentDetails: { not: null } };
  if (job.onlyOrdersAfter) where.createdAt = { gte: job.onlyOrdersAfter };

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true, orderNumber: true, customerEmail: true, customerDetails: true, installmentDetails: true,
      orderDate: true, createdAt: true, statusId: true, totalPrice: true, currency: true,
    },
    orderBy: { id: 'asc' },
  });

  const logs = await prisma.installmentJobLog.findMany({
    where: { jobId: job.id },
    select: { orderId: true, status: true },
  });
  const doneOrders = new Set();
  const failCounts = new Map();
  for (const l of logs) {
    if (l.status === 'SUCCESS' || l.status === 'SKIPPED') doneOrders.add(l.orderId);
    if (l.status === 'FAILED') failCounts.set(l.orderId, (failCounts.get(l.orderId) || 0) + 1);
  }

  const now = nowNaive();
  const rows = [];

  for (const o of orders) {
    const details = safeParse(o.installmentDetails);
    const inst = details && Array.isArray(details.installments) ? details.installments : null;
    if (!inst || inst.length <= idx) continue; // order has no such installment
    const target = inst[idx];
    if (!target) continue;

    const cust = safeParse(o.customerDetails) || {};
    const orderDateVal = o.orderDate || o.createdAt;
    const base = {
      orderId: o.id,
      orderNumber: o.orderNumber,
      customerEmail: o.customerEmail,
      customerName: `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || o.customerEmail,
      amount: target.amount,
      label: target.label || `Installment ${idx + 1}`,
      orderDate: orderDateVal ? new Date(orderDateVal).toISOString() : null,
      currentStatus: o.status || 'Pending',
    };

    if (target.status === 'Paid') {
      rows.push({
        ...base,
        state: 'ALREADY_PAID',
        reason: `${base.label} is already marked as PAID`,
      });
      continue;
    }

    if (doneOrders.has(o.id)) {
      rows.push({
        ...base,
        state: 'ALREADY_TRIGGERED',
        reason: 'Payment link was already sent by this job',
      });
      continue;
    }

    if ((failCounts.get(o.id) || 0) >= FAILED_RETRY_LIMIT) {
      rows.push({
        ...base,
        state: 'FAILED_GAVE_UP',
        reason: `Failed ${FAILED_RETRY_LIMIT} times previously`,
      });
      continue;
    }

    let ref = null;
    let refLabel = '';
    if (idx === 1) {
      ref = inst[0]?.paidAt || o.orderDate || o.createdAt;
      refLabel = 'Order checkout';
    } else {
      const prev = inst[idx - 1];
      if (!prev || prev.status !== 'Paid') {
        rows.push({
          ...base,
          state: 'WAITING_PREVIOUS',
          waitingFor: prev?.label || `Installment ${idx}`,
          reason: `Waiting for ${prev?.label || 'Rate ' + idx} payment`,
        });
        continue;
      }
      ref = prev.paidAt || null;
      refLabel = `${prev.label || 'Installment ' + idx} paid`;
    }

    if (!ref) {
      rows.push({
        ...base,
        state: 'NO_REFERENCE_DATE',
        reason: 'Missing reference timestamp',
      });
      continue;
    }

    const dueNaive = computeDueNaive(ref, job);
    const dueDateIso = new Date(dueNaive).toISOString();
    let state = now >= dueNaive ? 'DUE' : 'SCHEDULED';
    let reason = state === 'DUE' ? 'Ready to trigger now' : `Scheduled for ${new Date(dueNaive).toLocaleDateString()}`;

    if (o.statusId === job.statusId) {
      state = 'ALREADY_IN_STATUS';
      reason = `Order is already in target status "${status.name}"`;
    }

    rows.push({
      ...base,
      state,
      reason,
      referenceDate: new Date(ref).toISOString(),
      referenceLabel: refLabel,
      delayDueDate: dueDateIso,
      dueAt: naiveToString(dueNaive),
    });
  }

  return { status, installmentIndex: idx, rows };
};

const headersFromBase = (apiBaseUrl) => {
  try {
    const u = new URL(apiBaseUrl);
    return { 'x-forwarded-proto': u.protocol.replace(':', ''), 'x-forwarded-host': u.host };
  } catch {
    return {};
  }
};

const writeLog = (job, order, installmentIndex, status, message, trigger) =>
  prisma.installmentJobLog.create({
    data: {
      jobId: job.id,
      jobName: job.name,
      orderId: order.orderId,
      orderNumber: order.orderNumber || null,
      customerEmail: order.customerEmail || null,
      installmentIndex,
      status,
      message: message ? String(message).slice(0, 1000) : null,
      trigger,
    },
  }).catch((e) => console.error('[INSTALLMENT-JOB] log write failed:', e.message));

/**
 * Executes a job. `onlyOrderIds` (manual run) forces exactly those orders regardless of the due date;
 * automatic runs only touch orders in state DUE.
 */
const runJob = async (job, { trigger = 'AUTO', onlyOrderIds = null } = {}) => {
  const evalResult = await evaluateJob(job);
  const summary = { jobId: job.id, triggered: 0, failed: 0, skipped: 0, error: evalResult.error || null };
  if (evalResult.error) return summary;

  const idx = evalResult.installmentIndex;
  let targets;
  if (onlyOrderIds) {
    const set = new Set(onlyOrderIds.map((n) => parseInt(n)));
    targets = evalResult.rows.filter((r) => set.has(r.orderId) && !['ALREADY_TRIGGERED', 'WAITING_PREVIOUS', 'NO_REFERENCE_DATE'].includes(r.state));
  } else {
    targets = evalResult.rows.filter((r) => r.state === 'DUE');
  }

  // Lazy require: avoids a circular dependency at boot (order.controller → … → scheduler)
  const { processSingleOrderStatusUpdate } = require('../controllers/order.controller');
  const apiBase = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || job.apiBaseUrl;
  if (!apiBase) {
    const msg = 'API base URL unknown – cannot build the payment link. Set API_BASE_URL in .env or re-save the job from the dashboard.';
    for (const t of targets) await writeLog(job, t, idx, 'FAILED', msg, trigger);
    summary.failed = targets.length;
    summary.error = msg;
    return summary;
  }
  const headers = headersFromBase(apiBase);

  for (const t of targets) {
    // re-check right before sending (protects against double triggers)
    const fresh = await prisma.order.findUnique({ where: { id: t.orderId }, select: { statusId: true, installmentDetails: true } });
    const freshDetails = safeParse(fresh?.installmentDetails);
    if (freshDetails?.installments?.[idx]?.status === 'Paid') {
      await writeLog(job, t, idx, 'SKIPPED', 'Installment was paid in the meantime.', trigger);
      summary.skipped++;
      continue;
    }
    if (fresh && fresh.statusId === job.statusId && trigger === 'AUTO') {
      await writeLog(job, t, idx, 'SKIPPED', 'Order is already in this status (payment link was sent earlier).', trigger);
      summary.skipped++;
      continue;
    }

    try {
      await processSingleOrderStatusUpdate(t.orderId, job.statusId, { name: `Auto job: ${job.name}`, email: 'system' }, headers);
      await writeLog(job, t, idx, 'SUCCESS', `Status set to "${evalResult.status.name}" – payment link email queued (see Email Logs for delivery).`, trigger);
      summary.triggered++;
      await logAudit({
        user: { id: null, name: 'System', email: 'installment-job' },
        action: 'INSTALLMENT_JOB_TRIGGER',
        entity: 'orders',
        entityId: t.orderId,
        details: { job: job.name, status: evalResult.status.name, order: t.orderNumber, trigger },
      });
    } catch (err) {
      await writeLog(job, t, idx, 'FAILED', err.message, trigger);
      summary.failed++;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  await prisma.installmentJob.update({ where: { id: job.id }, data: { lastRunAt: new Date() } }).catch(() => {});
  return summary;
};

let running = false;
const runAllActiveJobs = async () => {
  if (running) return;
  running = true;
  try {
    const jobs = await prisma.installmentJob.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    for (const job of jobs) {
      try {
        const s = await runJob(job, { trigger: 'AUTO' });
        if (s.triggered || s.failed) console.log(`[CRON] Installment job #${job.id} "${job.name}": triggered=${s.triggered} failed=${s.failed} skipped=${s.skipped}`);
      } catch (err) {
        console.error(`[CRON] Installment job #${job.id} error:`, err.message);
      }
    }
  } finally {
    running = false;
  }
};

module.exports = { evaluateJob, runJob, runAllActiveJobs, FAILED_RETRY_LIMIT };

