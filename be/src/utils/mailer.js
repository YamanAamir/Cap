const nodemailer = require('nodemailer');

let transporterInstance = null;

// ─────────────────────────────────────────────────────────────
// Email logging: every message that goes through the shared transporter is written to EmailLog
// (status, error, html + attachments so it can be re-sent from the dashboard).
// Logging is best-effort and can never make an email fail.
// ─────────────────────────────────────────────────────────────
const MAX_ATTACHMENT_BYTES = 1.5 * 1024 * 1024;
const MAX_HTML_CHARS = 2 * 1024 * 1024;

const addrToString = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(addrToString).filter(Boolean).join(', ');
  if (typeof v === 'object') return v.address ? (v.name ? `${v.name} <${v.address}>` : v.address) : '';
  return String(v);
};

const serializeAttachments = (attachments) => {
  if (!Array.isArray(attachments) || attachments.length === 0) return { json: null, truncated: false };
  let total = 0;
  let truncated = false;
  const out = attachments.map((a) => {
    const item = { filename: a.filename || null, contentType: a.contentType || null, cid: a.cid || null, path: a.path || null };
    let b64 = null;
    if (Buffer.isBuffer(a.content)) b64 = a.content.toString('base64');
    else if (typeof a.content === 'string') b64 = a.encoding === 'base64' ? a.content : Buffer.from(a.content, a.encoding || 'utf8').toString('base64');
    if (b64 !== null) {
      if (total + b64.length <= MAX_ATTACHMENT_BYTES) {
        item.contentBase64 = b64;
        total += b64.length;
      } else {
        truncated = true;
      }
    }
    return item;
  });
  return { json: JSON.stringify(out), truncated };
};

const writeEmailLog = async (mailOptions, status, info, err, meta) => {
  try {
    const prisma = require('./prisma');
    const html = typeof mailOptions.html === 'string' ? mailOptions.html : null;
    const text = typeof mailOptions.text === 'string' ? mailOptions.text : null;
    const att = serializeAttachments(mailOptions.attachments);
    const subject = mailOptions.subject ? String(mailOptions.subject) : null;

    // 1. Explicit meta or option
    let orderNum = meta?.orderNumber || mailOptions.orderNumber || null;

    // 2. Regex matching CAP-
    if (!orderNum) {
      const combined = `${subject || ''} ${text ? text.slice(0, 10000) : ''} ${html ? html.slice(0, 10000) : ''}`;
      const orderMatch = combined.match(/CAP-[A-Za-z0-9_-]+/i);
      if (orderMatch) {
        orderNum = orderMatch[0];
      }
    }

    const options = {
      from: addrToString(mailOptions.from),
      to: addrToString(mailOptions.to),
      cc: addrToString(mailOptions.cc),
      bcc: addrToString(mailOptions.bcc),
      replyTo: addrToString(mailOptions.replyTo),
    };

    // 3. Fallback: Lookup latest order by recipient email
    if (!orderNum && options.to) {
      try {
        const toClean = options.to.toLowerCase().trim();
        const matched = await prisma.order.findFirst({
          where: { customerEmail: { equals: toClean } },
          orderBy: { id: 'desc' },
          select: { orderNumber: true },
        });
        if (matched && matched.orderNumber) {
          orderNum = matched.orderNumber;
        }
      } catch (lookupErr) {
        // best effort lookup
      }
    }

    await prisma.emailLog.create({
      data: {
        toEmail: options.to.slice(0, 5000) || '(unknown)',
        fromEmail: options.from ? options.from.slice(0, 190) : null,
        subject,
        orderNumber: orderNum,
        status,
        error: err ? String(err.message || err).slice(0, 2000) : null,
        messageId: info?.messageId ? String(info.messageId).slice(0, 250) : null,
        html: html && html.length <= MAX_HTML_CHARS ? html : html ? html.slice(0, MAX_HTML_CHARS) : null,
        textBody: text ? text.slice(0, 200000) : null,
        attachments: att.json,
        attachmentsTruncated: att.truncated,
        optionsJson: JSON.stringify(options),
        resendOfId: meta?.resendOfId || null,
      },
    });
  } catch (e) {
    console.error('[EMAIL-LOG] failed to write email log:', e.message);
  }
};

const attachLogging = (transporter) => {
  const original = transporter.sendMail.bind(transporter);
  transporter.sendMail = async function loggedSendMail(mailOptions, ...rest) {
    // Callback style / unexpected usage: leave untouched
    if (typeof mailOptions === 'function' || rest.length > 0 || !mailOptions || typeof mailOptions !== 'object') {
      return original(mailOptions, ...rest);
    }
    let meta = null;
    let opts = mailOptions;
    if (mailOptions.__logMeta) {
      meta = mailOptions.__logMeta;
      opts = { ...mailOptions };
      delete opts.__logMeta;
    }
    try {
      const info = await original(opts);
      const accepted = info && Array.isArray(info.accepted) ? info.accepted.length : null;
      const rejected = info && Array.isArray(info.rejected) ? info.rejected : [];
      if (accepted === 0 && rejected.length > 0) {
        await writeEmailLog(opts, 'FAILED', info, new Error(`All recipients rejected: ${rejected.join(', ')}`), meta);
      } else {
        await writeEmailLog(opts, 'SENT', info, null, meta);
      }
      return info;
    } catch (err) {
      await writeEmailLog(opts, 'FAILED', null, err, meta);
      throw err;
    }
  };
  return transporter;
};

const getTransporter = () => {
  if (!transporterInstance) {
    transporterInstance = attachLogging(
      nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.simply.com',
        port: parseInt(process.env.EMAIL_PORT || '465'),
        secure: process.env.EMAIL_SECURE !== 'false',
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    );
  }
  return transporterInstance;
};

module.exports = { getTransporter };
