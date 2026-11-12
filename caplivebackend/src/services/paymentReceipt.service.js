const prisma = require('../utils/prisma');
const { getTransporter } = require('../utils/mailer');
const flatpayService = require('./flatpay.service');

// Default admin notification email
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_PAYMENT_RECEIPT_EMAIL || 'info@studentlife.dk';
const SETTINGS_KEY = 'payment_receipt_settings';

/**
 * Ensure PaymentReceiptLog and SystemSetting tables exist in the database
 * Safe and idempotent for all environments
 */
let tableChecked = false;
const ensureTableExists = async () => {
  if (tableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`PaymentReceiptLog\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`orderNumber\` VARCHAR(191) NOT NULL,
        \`orderId\` INT NULL,
        \`orderType\` VARCHAR(50) NOT NULL DEFAULT 'CAP_ORDER',
        \`transactionId\` VARCHAR(191) NULL,
        \`receiptNumber\` VARCHAR(191) NULL,
        \`amount\` DOUBLE NOT NULL,
        \`currency\` VARCHAR(10) NOT NULL DEFAULT 'DKK',
        \`paymentMethod\` VARCHAR(100) NULL,
        \`customerName\` VARCHAR(191) NULL,
        \`customerEmail\` VARCHAR(191) NULL,
        \`recipientEmail\` VARCHAR(191) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        \`error\` TEXT NULL,
        \`retryCount\` INT NOT NULL DEFAULT 0,
        \`maxRetries\` INT NOT NULL DEFAULT 3,
        \`lastAttemptAt\` DATETIME(3) NULL,
        \`sentAt\` DATETIME(3) NULL,
        \`paymentDate\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`metadata\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`PaymentReceiptLog_orderNumber_idx\` (\`orderNumber\`),
        INDEX \`PaymentReceiptLog_status_idx\` (\`status\`),
        INDEX \`PaymentReceiptLog_recipientEmail_idx\` (\`recipientEmail\`),
        INDEX \`PaymentReceiptLog_createdAt_idx\` (\`createdAt\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`SystemSetting\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`key\` VARCHAR(191) NOT NULL,
        \`value\` LONGTEXT NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`SystemSetting_key_key\` (\`key\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    tableChecked = true;
  } catch (err) {
    // If table already exists or user has limited DDL permissions, ignore
    tableChecked = true;
  }
};

/**
 * Retrieve admin payment receipt notification settings
 */
const getReceiptSettings = async () => {
  await ensureTableExists();
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY }
    });
    if (setting && setting.value) {
      try {
        const parsed = JSON.parse(setting.value);
        return {
          recipientEmail: (parsed.recipientEmail || DEFAULT_ADMIN_EMAIL).trim(),
          enabled: parsed.enabled !== false
        };
      } catch (e) {
        console.warn('[PaymentReceipt] Could not parse settings JSON, using default');
      }
    }
  } catch (err) {
    console.error('[PaymentReceipt] Error fetching settings:', err.message);
  }

  return {
    recipientEmail: DEFAULT_ADMIN_EMAIL,
    enabled: true
  };
};

/**
 * Update admin payment receipt notification settings
 */
const updateReceiptSettings = async ({ recipientEmail, enabled }) => {
  await ensureTableExists();
  const cleanEmail = (recipientEmail || DEFAULT_ADMIN_EMAIL).trim();
  const isEnabled = enabled !== false;

  const value = JSON.stringify({
    recipientEmail: cleanEmail,
    enabled: isEnabled,
    updatedAt: new Date().toISOString()
  });

  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value },
    create: { key: SETTINGS_KEY, value }
  });

  return { recipientEmail: cleanEmail, enabled: isEnabled };
};

const getAppTimezone = () => {
  return process.env.TIMEZONE || process.env.TZ || 'Asia/Karachi';
};

/**
 * Format date for receipt (e.g. "Nov 12, 2026, 6:41:32 PM")
 */
const formatReceiptDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleString('en-US', {
    timeZone: getAppTimezone(),
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Format currency amount (e.g. "972.00 kr.")
 */
const formatReceiptAmount = (amount, currency = 'DKK') => {
  const num = parseFloat(amount) || 0;
  const isDanish = currency.toUpperCase() === 'DKK';
  const symbol = isDanish ? 'kr.' : currency.toUpperCase();
  return `${num.toFixed(2)} ${symbol}`;
};

/**
 * Generate Administrator Payment Receipt HTML matching the template image
 */
const generateAdminPaymentReceiptHtml = ({
  receiptNumber,
  amount,
  currency = 'DKK',
  paymentDate,
  paymentMethod,
  orderNumber,
  customerName,
  customerEmail,
  lineItems = []
}) => {
  const formattedAmount = formatReceiptAmount(amount, currency);
  const formattedDate = formatReceiptDate(paymentDate);
  const displayReceiptNo = receiptNumber || orderNumber || 'REC-UNKNOWN';
  const displayPaymentMethod = paymentMethod || 'Frisbii Payment';

  // Build items rows
  const safeItems = (Array.isArray(lineItems) && lineItems.length > 0)
    ? lineItems
    : [{ description: `Cap Order : ${orderNumber} × 1`, amount: formattedAmount }];

  const itemsHtml = safeItems.map((item, idx) => {
    const itemAmount = typeof item.amount === 'number'
      ? formatReceiptAmount(item.amount, currency)
      : (item.amount || formattedAmount);

    return `
      <tr>
        <td style="padding: 12px 0; font-size: 14px; color: #334155; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${item.description || `Order item #${idx + 1}`}
        </td>
        <td style="padding: 12px 0; font-size: 14px; color: #334155; text-align: right; white-space: nowrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${itemAmount}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt from Studentlife ApS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Top Geometric Header Banner -->
          <tr>
            <td style="padding: 0; line-height: 0; background-color: #3b4252;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="height: 120px; background: linear-gradient(135deg, #2e3440 0%, #3b4252 50%, #434c5e 100%);">
                <tr>
                  <td style="position: relative; height: 120px; overflow: hidden;">
                    <!-- Stylized SVG Polygon Header matching template -->
                    <svg width="100%" height="120" viewBox="0 0 580 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                      <!-- Base dark slate navy triangle -->
                      <polygon points="0,0 580,0 580,60 0,120" fill="#434c5e" />
                      <!-- Top dark left accent -->
                      <polygon points="0,0 360,0 0,110" fill="#3b4252" />
                      <!-- Right geometric wedge -->
                      <polygon points="360,0 580,0 580,120 360,70" fill="#4c566a" opacity="0.85" />
                      <!-- Soft contrast polygon on right -->
                      <polygon points="360,70 580,40 580,120" fill="#e5e9f0" opacity="0.9" />
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Receipt Content Body -->
          <tr>
            <td style="padding: 36px 40px 40px 40px;">

              <!-- Title & Receipt Number -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 500; color: #1e293b; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Receipt from Studentlife ApS
                    </h1>
                    <div style="font-size: 15px; color: #64748b; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      Receipt no. ${displayReceiptNo}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 3-Column Payment Summary -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 36px;">
                <tr>
                  <!-- AMOUNT PAID -->
                  <td width="33.33%" valign="top" style="padding-right: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      AMOUNT PAID
                    </div>
                    <div style="font-size: 15px; font-weight: 600; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ${formattedAmount}
                    </div>
                  </td>

                  <!-- PAYMENT DATE -->
                  <td width="33.33%" valign="top" style="padding-right: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      PAYMENT DATE
                    </div>
                    <div style="font-size: 15px; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ${formattedDate}
                    </div>
                  </td>

                  <!-- PAYMENT METHOD -->
                  <td width="33.33%" valign="top">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      PAYMENT METHOD
                    </div>
                    <div style="font-size: 15px; color: #1e293b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      <span style="display: inline-block; vertical-align: middle; margin-right: 4px;">💳</span> ${displayPaymentMethod}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Customer info if available -->
              ${(customerName || customerEmail) ? `
              <div style="margin-bottom: 24px; padding: 10px 14px; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 8px; font-size: 13px; color: #475569;">
                <strong>Customer:</strong> ${customerName || ''} ${customerEmail ? `(${customerEmail})` : ''}
              </div>
              ` : ''}

              <!-- OVERVIEW Section Header -->
              <div style="font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                OVERVIEW
              </div>

              <!-- Overview Card -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 22px; margin-bottom: 32px;">
                <tr>
                  <td>
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <!-- Line Items -->
                      ${itemsHtml}

                      <!-- Divider -->
                      <tr>
                        <td colspan="2" style="padding-top: 10px; border-top: 1px solid #e2e8f0;"></td>
                      </tr>

                      <!-- Amount Paid Row -->
                      <tr>
                        <td style="padding: 10px 0 4px 0; font-size: 15px; font-weight: 700; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                          Amount paid
                        </td>
                        <td style="padding: 10px 0 4px 0; font-size: 15px; font-weight: 700; color: #0f172a; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                          ${formattedAmount}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bottom Divider -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="border-top: 1px solid #e2e8f0;"></td>
                </tr>
              </table>

              <!-- Footer Contact Note -->
              <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                If you have any questions, you can contact us at <a href="mailto:info@studentlife.dk" style="color: #4f46e5; font-weight: 600; text-decoration: none;">info@studentlife.dk</a> or call us at <a href="tel:+4543120240" style="color: #4f46e5; font-weight: 600; text-decoration: none;">+45 43 12 02 40</a> .
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Dispatch an individual receipt email by Log ID
 */
const attemptDispatchReceipt = async (logId, overrideRecipientEmail = null) => {
  await ensureTableExists();

  const log = await prisma.paymentReceiptLog.findUnique({
    where: { id: parseInt(logId) }
  });

  if (!log) {
    throw new Error(`Payment receipt log #${logId} not found`);
  }

  const recipient = (overrideRecipientEmail || log.recipientEmail || DEFAULT_ADMIN_EMAIL).trim();

  let parsedMetadata = {};
  try {
    if (log.metadata) {
      parsedMetadata = JSON.parse(log.metadata);
    }
  } catch (e) { }

  const html = generateAdminPaymentReceiptHtml({
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

  const subject = `Receipt from Studentlife ApS - ${log.receiptNumber || log.orderNumber} (${formatReceiptAmount(log.amount, log.currency)})`;

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from: `"Studentlife" <${process.env.EMAIL_USER || 'info@studentlife.dk'}>`,
      to: recipient,
      subject: subject,
      html: html
    });

    console.log(`✅ [PaymentReceipt] Receipt email sent successfully to ${recipient} (MessageId: ${info.messageId})`);

    // Update log to SENT
    await prisma.paymentReceiptLog.update({
      where: { id: log.id },
      data: {
        recipientEmail: recipient,
        status: 'SENT',
        sentAt: new Date(),
        lastAttemptAt: new Date(),
        error: null,
      }
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [PaymentReceipt] Failed to send receipt for log #${log.id}:`, err.message);

    const nextRetryCount = log.retryCount + 1;
    const isExhausted = nextRetryCount >= log.maxRetries;
    const nextStatus = isExhausted ? 'FAILED' : 'RETRYING';

    await prisma.paymentReceiptLog.update({
      where: { id: log.id },
      data: {
        status: nextStatus,
        retryCount: nextRetryCount,
        lastAttemptAt: new Date(),
        error: err.message || 'Unknown email dispatch error'
      }
    });

    throw err;
  }
};

/**
 * Main Entry Point: Send or queue payment receipt email to administrator
 * Completely non-blocking and safe - never crashes the calling payment or order flow!
 */
const sendOrQueuePaymentReceipt = async ({
  orderNumber,
  orderId = null,
  orderType = 'CAP_ORDER', // 'CAP_ORDER' | 'INSTALLMENT' | 'WEBSHOP'
  amount,
  currency = 'DKK',
  paymentDate = new Date(),
  paymentMethod = null,
  transactionId = null,
  receiptNumber = null,
  customerName = null,
  customerEmail = null,
  lineItems = [],
  rawInvoiceData = null
}) => {
  try {
    await ensureTableExists();

    if (!orderNumber) {
      console.warn('[PaymentReceipt] Skipping: missing orderNumber');
      return null;
    }

    // 1. Fetch Frisbii transaction details if available and not explicitly provided
    let resolvedTransactionId = transactionId;
    let resolvedReceiptNumber = receiptNumber;
    let resolvedPaymentMethod = paymentMethod;

    if ((!resolvedReceiptNumber || !resolvedPaymentMethod) && resolvedTransactionId) {
      try {
        const frisbiiInvoice = await flatpayService.getInvoice(resolvedTransactionId);
        const frisbiiCharge = frisbiiInvoice ? null : await flatpayService.getCharge(resolvedTransactionId);
        const invoiceData = frisbiiInvoice || frisbiiCharge || rawInvoiceData;

        if (invoiceData) {
          if (!resolvedReceiptNumber) {
            resolvedReceiptNumber = invoiceData.id || invoiceData.handle || resolvedTransactionId;
          }
          if (!resolvedPaymentMethod) {
            if (Array.isArray(invoiceData.transactions) && invoiceData.transactions[0]) {
              const tx = invoiceData.transactions[0];
              const masked = tx.card?.masked_card || tx.masked_card || (tx.card?.last4 ? `•••• ${tx.card.last4}` : null);
              resolvedPaymentMethod = masked ? `Card - ${masked.slice(-4)}` : (tx.payment_method || 'Frisbii');
            } else {
              resolvedPaymentMethod = invoiceData.payment_method || 'Frisbii Payment';
            }
          }
        }
      } catch (frisbiiErr) {
        console.warn('[PaymentReceipt] Could not enrich from Frisbii API:', frisbiiErr.message);
      }
    }

    // Fallbacks
    if (!resolvedReceiptNumber) resolvedReceiptNumber = resolvedTransactionId || orderNumber;
    if (!resolvedPaymentMethod) resolvedPaymentMethod = 'Frisbii Payment';

    // 2. Check if receipt already sent to avoid duplicate emails
    const existingLog = await prisma.paymentReceiptLog.findFirst({
      where: {
        orderNumber: String(orderNumber),
        orderType: String(orderType),
        status: 'SENT'
      }
    });

    if (existingLog) {
      console.log(`ℹ️ [PaymentReceipt] Receipt already sent for ${orderNumber} (${orderType}). Skipping duplicate.`);
      return existingLog;
    }

    // 3. Get admin email configuration
    const settings = await getReceiptSettings();
    if (!settings.enabled) {
      console.log('ℹ️ [PaymentReceipt] Payment receipt emails are currently disabled in Admin settings.');
    }

    const metadataObj = {
      lineItems,
      rawInvoiceData: rawInvoiceData ? { id: rawInvoiceData.id, state: rawInvoiceData.state } : null
    };

    // 4. Create log record in database
    const newLog = await prisma.paymentReceiptLog.create({
      data: {
        orderNumber: String(orderNumber),
        orderId: orderId ? parseInt(orderId) : null,
        orderType: String(orderType),
        transactionId: resolvedTransactionId ? String(resolvedTransactionId) : null,
        receiptNumber: String(resolvedReceiptNumber),
        amount: parseFloat(amount) || 0,
        currency: (currency || 'DKK').toUpperCase(),
        paymentMethod: String(resolvedPaymentMethod),
        customerName: customerName ? String(customerName) : null,
        customerEmail: customerEmail ? String(customerEmail) : null,
        recipientEmail: settings.recipientEmail,
        status: settings.enabled ? 'PENDING' : 'DISABLED',
        metadata: JSON.stringify(metadataObj),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        retryCount: 0,
        maxRetries: 3
      }
    });

    // If disabled in settings, don't attempt dispatch
    if (!settings.enabled) {
      return newLog;
    }

    // 5. Attempt dispatch asynchronously
    attemptDispatchReceipt(newLog.id).catch(dispatchErr => {
      console.warn(`[PaymentReceipt] Initial email dispatch failed for log #${newLog.id}, will retry:`, dispatchErr.message);
    });

    return newLog;
  } catch (err) {
    console.error('❌ [PaymentReceipt] Error in sendOrQueuePaymentReceipt:', err.message);
    return null; // Guarantee order processing continues unharmed
  }
};

/**
 * Retry runner: Automatically retry failed or retrying receipts
 */
const retryFailedReceipts = async () => {
  try {
    await ensureTableExists();

    const pendingLogs = await prisma.paymentReceiptLog.findMany({
      where: {
        status: { in: ['RETRYING', 'FAILED', 'PENDING'] },
        retryCount: { lt: 3 }
      },
      take: 10,
      orderBy: { createdAt: 'asc' }
    });

    if (!pendingLogs || pendingLogs.length === 0) {
      return;
    }

    console.log(`[PaymentReceipt Cron] Retrying ${pendingLogs.length} pending/failed receipts...`);

    for (const log of pendingLogs) {
      try {
        await attemptDispatchReceipt(log.id);
      } catch (err) {
        // Individual log failure already recorded in attemptDispatchReceipt
      }
    }
  } catch (err) {
    console.error('[PaymentReceipt Cron] Error running retryFailedReceipts:', err.message);
  }
};

/**
 * Manual resend triggered by admin from dashboard
 */
const resendReceipt = async (logId, overrideEmail = null) => {
  return await attemptDispatchReceipt(logId, overrideEmail);
};

module.exports = {
  sendOrQueuePaymentReceipt,
  retryFailedReceipts,
  resendReceipt,
  getReceiptSettings,
  updateReceiptSettings,
  generateAdminPaymentReceiptHtml,
  ensureTableExists
};

