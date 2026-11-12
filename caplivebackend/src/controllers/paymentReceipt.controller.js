const prisma = require('../utils/prisma');
const paymentReceiptService = require('../services/paymentReceipt.service');

const pageParams = (req, defLimit = 25) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
};

const dateRange = (req) => {
  const range = {};
  if (req.query.from) {
    const d = new Date(req.query.from);
    if (!isNaN(d)) range.gte = d;
  }
  if (req.query.to) {
    const d = new Date(req.query.to);
    if (!isNaN(d)) {
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
  }
  return Object.keys(range).length ? range : undefined;
};

/**
 * Get paginated payment receipt logs with statistics
 */
exports.getPaymentReceipts = async (req, res) => {
  try {
    await paymentReceiptService.ensureTableExists();

    const { page, limit, skip } = pageParams(req);
    const where = {};

    if (req.query.status) {
      where.status = String(req.query.status).toUpperCase();
    }

    if (req.query.orderType) {
      where.orderType = String(req.query.orderType).toUpperCase();
    }

    const created = dateRange(req);
    if (created) {
      where.createdAt = created;
    }

    if (req.query.search) {
      const s = String(req.query.search).trim();
      where.OR = [
        { orderNumber: { contains: s } },
        { transactionId: { contains: s } },
        { receiptNumber: { contains: s } },
        { customerEmail: { contains: s } },
        { customerName: { contains: s } },
        { recipientEmail: { contains: s } }
      ];
    }

    const [rows, total, totalSent, totalFailed, totalRetrying, totalPending] = await Promise.all([
      prisma.paymentReceiptLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.paymentReceiptLog.count({ where }),
      prisma.paymentReceiptLog.count({ where: { status: 'SENT' } }).catch(() => 0),
      prisma.paymentReceiptLog.count({ where: { status: 'FAILED' } }).catch(() => 0),
      prisma.paymentReceiptLog.count({ where: { status: 'RETRYING' } }).catch(() => 0),
      prisma.paymentReceiptLog.count({ where: { status: 'PENDING' } }).catch(() => 0)
    ]);

    res.json({
      data: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total,
        sent: totalSent,
        failed: totalFailed,
        retrying: totalRetrying,
        pending: totalPending
      }
    });
  } catch (err) {
    console.error('Error in getPaymentReceipts:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get single payment receipt by ID
 */
exports.getPaymentReceiptById = async (req, res) => {
  try {
    await paymentReceiptService.ensureTableExists();
    const id = parseInt(req.params.id);

    const log = await prisma.paymentReceiptLog.findUnique({
      where: { id }
    });

    if (!log) {
      return res.status(404).json({ message: 'Payment receipt not found' });
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Resend payment receipt email
 */
exports.resendPaymentReceipt = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { overrideEmail } = req.body;

    const result = await paymentReceiptService.resendReceipt(id, overrideEmail || null);

    res.json({
      success: true,
      message: `Payment receipt successfully sent to ${overrideEmail || 'configured administrator'}`,
      details: result
    });
  } catch (err) {
    console.error('Error in resendPaymentReceipt:', err);
    res.status(500).json({ message: err.message || 'Failed to resend payment receipt' });
  }
};

/**
 * Get administrator receipt notification settings
 */
exports.getReceiptSettings = async (req, res) => {
  try {
    const settings = await paymentReceiptService.getReceiptSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update administrator receipt notification settings
 */
exports.updateReceiptSettings = async (req, res) => {
  try {
    const { recipientEmail, enabled } = req.body;
    if (!recipientEmail || !recipientEmail.trim()) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    const updated = await paymentReceiptService.updateReceiptSettings({
      recipientEmail: recipientEmail.trim(),
      enabled: enabled !== false
    });

    res.json({
      success: true,
      message: 'Payment receipt settings updated successfully',
      settings: updated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get HTML preview of receipt
 */
exports.previewReceipt = async (req, res) => {
  try {
    await paymentReceiptService.ensureTableExists();
    const id = parseInt(req.params.id);

    const log = await prisma.paymentReceiptLog.findUnique({
      where: { id }
    });

    if (!log) {
      return res.status(404).send('Receipt not found');
    }

    let parsedMetadata = {};
    try {
      if (log.metadata) parsedMetadata = JSON.parse(log.metadata);
    } catch (e) { }

    const html = paymentReceiptService.generateAdminPaymentReceiptHtml({
      receiptNumber: log.receiptNumber || log.transactionId || log.orderNumber,
      amount: log.amount,
      currency: log.currency,
      paymentDate: log.paymentDate || log.createdAt,
      paymentMethod: log.paymentMethod,
      orderNumber: log.orderNumber,
      customerName: log.customerName,
      customerEmail: log.customerEmail,
      lineItems: parsedMetadata.lineItems || []
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send(`Error generating preview: ${err.message}`);
  }
};

