// Wraps a webhook handler so every call (and its outcome) is recorded in WebhookLog.
// The wrapper never changes the behaviour/response of the wrapped handler.
const { getClientIp } = require('./requestInfo');
const { sanitize } = require('./audit');

const getPrisma = () => require('./prisma');

const parseBody = (body) => {
  try {
    if (Buffer.isBuffer(body)) return JSON.parse(body.toString('utf8'));
    if (typeof body === 'string') return JSON.parse(body);
    return body;
  } catch {
    return null;
  }
};

const extractMeta = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  const eventType = obj.event_type || obj.type || null;
  const eventId = obj.id || null;
  const reference =
    obj.invoice ||
    obj.data?.object?.metadata?.tempOrderId ||
    obj.data?.object?.metadata?.orderNumber ||
    obj.data?.object?.id ||
    null;
  return {
    eventType: eventType ? String(eventType).slice(0, 100) : null,
    eventId: eventId ? String(eventId).slice(0, 100) : null,
    reference: reference ? String(reference).slice(0, 190) : null,
  };
};

const withWebhookLog = (provider, handler) => async (req, res) => {
  const start = Date.now();
  const bodyObj = parseBody(req.body);
  const meta = extractMeta(bodyObj);
  let logId = null;

  try {
    let payload = null;
    if (bodyObj) {
      payload = JSON.stringify(sanitize(bodyObj));
      if (payload.length > 20000) payload = `${payload.slice(0, 20000)}…`;
    }
    const row = await getPrisma().webhookLog.create({
      data: { provider, ...meta, status: 'RECEIVED', payload, ip: getClientIp(req) },
    });
    logId = row.id;
  } catch (e) {
    console.error('[WEBHOOK-LOG] could not create log row:', e.message);
  }

  let responseBody = null;
  const origJson = res.json.bind(res);
  const origSend = res.send.bind(res);
  res.json = (b) => { responseBody = b; return origJson(b); };
  res.send = (b) => { if (responseBody === null) responseBody = b; return origSend(b); };

  res.on('finish', async () => {
    if (!logId) return;
    try {
      const ok = res.statusCode < 400;
      let error = null;
      if (!ok) {
        try { error = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody); } catch { error = `HTTP ${res.statusCode}`; }
        error = String(error || `HTTP ${res.statusCode}`).slice(0, 1000);
      }
      await getPrisma().webhookLog.update({
        where: { id: logId },
        data: { status: ok ? 'SUCCESS' : 'FAILED', httpStatus: res.statusCode, error, durationMs: Date.now() - start },
      });
    } catch (e) {
      console.error('[WEBHOOK-LOG] could not update log row:', e.message);
    }
  });

  try {
    await handler(req, res);
  } catch (err) {
    console.error(`[WEBHOOK-LOG] ${provider} handler threw:`, err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
};

module.exports = { withWebhookLog };

