/**
 * Automated Order Recovery & Email Re-trigger Script
 * 
 * Usage on Server:
 *   node scripts/recover_orders.js
 * 
 * What it does:
 * 1. Checks TempOrder table for any pending/unclaimed orders that weren't created in Order table.
 * 2. Parses PM2 error logs (/home/studentlife-app/.pm2/logs/cap-live-backend-error.log) to reconstruct
 *    any orders that failed due to "Argument customerDetails: Invalid value provided".
 * 3. Safely inserts recovered orders into the MySQL Order table with all capImages, options, and details.
 * 4. Sends order confirmation emails (Customer, Admin, Factory) for any newly recovered orders.
 * 5. Scans orders where installment status was triggered (e.g. rate 2 payment link) and ensures
 *    the payment link email is sent to the customer.
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');
const { sendCapEmail } = require('../src/controllers/sendEmail.controller');
const { sendOrderEmail } = require('../src/services/core.service');
const { buildInstallmentPaymentRequestEmail } = require('../src/controllers/sendEmail.controller');

const stringifyIfObject = (val) => {
  if (val === null || val === undefined) return null;
  return typeof val === 'object' ? JSON.stringify(val) : String(val);
};

async function recoverFromTempOrders() {
  console.log('\n==================================================');
  console.log('🔍 STEP 1: Checking TempOrder table for stuck orders...');
  console.log('==================================================');

  try {
    const tempRows = await prisma.$queryRaw`SELECT * FROM TempOrder`;
    console.log(`Found ${tempRows.length} row(s) in TempOrder table.`);

    let recoveredCount = 0;
    for (const row of tempRows) {
      let orderData = row.orderData;
      if (typeof orderData === 'string') {
        try { orderData = JSON.parse(orderData); } catch (e) { continue; }
      }

      if (!orderData || !orderData.orderNumber) continue;

      const exists = await prisma.order.findFirst({
        where: { orderNumber: orderData.orderNumber }
      });

      if (exists) {
        console.log(`ℹ️ Order ${orderData.orderNumber} already exists in Order table (ID: ${exists.id}). Cleaning TempOrder...`);
        await prisma.$executeRaw`DELETE FROM TempOrder WHERE id = ${row.id}`.catch(() => {});
        continue;
      }

      console.log(`🚀 Recovering order ${orderData.orderNumber} (${orderData.email || orderData.customerEmail})...`);

      const paidStatus = await prisma.orderStatus.findUnique({ where: { slug: 'paid' } });

      const customerDetailsStr = stringifyIfObject(orderData.customerDetails) || '{}';
      const selectedOptionsStr = stringifyIfObject(orderData.selectedOptions) || '{}';
      const capImagesStr = stringifyIfObject(orderData.capImages);
      const installmentDetailsStr = stringifyIfObject(orderData.installmentDetails);

      const newOrder = await prisma.order.create({
        data: {
          orderNumber: orderData.orderNumber,
          customerEmail: orderData.email || orderData.customerEmail,
          customerDetails: customerDetailsStr,
          selectedOptions: selectedOptionsStr,
          totalPrice: parseFloat(orderData.finalPrice || orderData.totalPrice) || 0,
          currency: orderData.currency || 'DKK',
          orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date(),
          status: paidStatus ? paidStatus.name.toUpperCase().replace(/\s+/g, '_') : 'PAID',
          statusId: paidStatus?.id || null,
          packageName: orderData.packageName || null,
          program: orderData.program || null,
          customerId: orderData.customerId || null,
          capImages: capImagesStr,
          discountCodeId: orderData.discountRecord?.id || null,
          discountAmount: orderData.discountAmount || null,
          installmentPlanId: orderData.installmentPlanId ? parseInt(orderData.installmentPlanId) : null,
          installmentDetails: installmentDetailsStr,
        }
      });

      console.log(`✅ Order ${newOrder.orderNumber} created with ID ${newOrder.id}. Sending emails...`);

      // Trigger standard order confirmation emails
      await sendCapEmail(
        {
          body: {
            customerDetails: orderData.customerDetails,
            selectedOptions: orderData.selectedOptions,
            totalPrice: newOrder.totalPrice,
            currency: newOrder.currency,
            orderNumber: newOrder.orderNumber,
            orderDate: newOrder.orderDate,
            email: newOrder.customerEmail,
            packageName: newOrder.packageName,
            program: newOrder.program,
            capImages: orderData.capImages,
            installmentDetails: orderData.installmentDetails,
          }
        },
        { status: () => ({ json: () => {} }) }
      ).catch(err => console.error(`❌ Email error for ${newOrder.orderNumber}:`, err.message));

      await prisma.$executeRaw`DELETE FROM TempOrder WHERE id = ${row.id}`.catch(() => {});
      recoveredCount++;
    }

    console.log(`🏁 Step 1 finished. Recovered ${recoveredCount} order(s) from TempOrder.`);
  } catch (err) {
    console.error('Error in recoverFromTempOrders:', err.message);
  }
}

async function recoverFromPm2Logs(logFilePath) {
  console.log('\n==================================================');
  console.log('🔍 STEP 2: Scanning PM2 Error Logs for failed orders...');
  console.log('==================================================');

  const defaultPaths = [
    logFilePath,
    '/home/studentlife-app/.pm2/logs/cap-live-backend-error.log',
    path.join(process.env.HOME || '', '.pm2/logs/cap-live-backend-error.log')
  ].filter(Boolean);

  let targetPath = null;
  for (const p of defaultPaths) {
    if (fs.existsSync(p)) {
      targetPath = p;
      break;
    }
  }

  if (!targetPath) {
    console.log('⚠️ PM2 error log file not found at default paths. Skipping log extraction.');
    return;
  }

  console.log(`📖 Reading log file: ${targetPath}`);
  const content = fs.readFileSync(targetPath, 'utf8');

  // Search for failed processSuccessfulCapOrder blocks
  const regex = /Error in processSuccessfulCapOrder:[\s\S]*?Invalid `prisma\.order\.create\(\)` invocation[\s\S]*?data:\s*(\{[\s\S]*?\n(?:\d+\|cap-live\s*\|\s*)?\s{8}\})/g;

  let match;
  let recoveredCount = 0;

  // Alternatively search for orderNumber: "CAP-..." pattern
  const orderNumberMatches = [...content.matchAll(/orderNumber:\s*["'](CAP-\d+)["']/g)];
  console.log(`Found ${orderNumberMatches.length} orderNumber occurrence(s) in log.`);

  const seenOrderNumbers = new Set();

  for (const m of orderNumberMatches) {
    const orderNum = m[1];
    if (seenOrderNumbers.has(orderNum)) continue;
    seenOrderNumbers.add(orderNum);

    const exists = await prisma.order.findFirst({
      where: { orderNumber: orderNum }
    });

    if (exists) {
      console.log(`ℹ️ Order ${orderNum} already exists in database (ID: ${exists.id}).`);
      continue;
    }

    console.log(`🚨 Order ${orderNum} was found in error logs but NOT in database! Attempting extraction...`);

    const orderIdx = m.index;
    const startIdx = content.lastIndexOf('data: {', orderIdx);
    if (startIdx === -1) {
      console.warn(`Could not find start of data block for ${orderNum}`);
      continue;
    }

    // Find the end of data block by matching braces
    let openBraces = 0;
    let endIdx = -1;
    let inString = false;
    let escape = false;

    for (let i = startIdx + 6; i < content.length; i++) {
      const ch = content[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"' || ch === "'") {
        if (!inString) inString = ch;
        else if (inString === ch) inString = false;
        continue;
      }
      if (!inString) {
        if (ch === '{') openBraces++;
        else if (ch === '}') {
          if (openBraces === 0) {
            endIdx = i + 1;
            break;
          }
          openBraces--;
        }
      }
    }

    if (endIdx === -1) {
      console.warn(`Could not find closing brace for order ${orderNum}`);
      continue;
    }

    let rawBlock = content.substring(startIdx + 6, endIdx);
    // Strip PM2 prefix "4|cap-live | "
    rawBlock = rawBlock.replace(/^\s*\d+\|[\w-]+\s*\|\s*/gm, '');
    // Strip Prisma underline characters
    rawBlock = rawBlock.replace(/~+\n?/g, '');
    // Strip Prisma hints like "+ adminUser: ..."
    rawBlock = rawBlock.replace(/\+\s+\w+:\s*\{[\s\S]*?\}\n?/g, '');
    rawBlock = rawBlock.replace(/\?\s+\w+\?:\s*\w+\n?/g, '');

    let parsedOrder = null;
    try {
      // Evaluate object literal safely
      const fn = new Function(`return (${rawBlock});`);
      parsedOrder = fn();
    } catch (evalErr) {
      console.error(`Failed to parse extracted data block for ${orderNum}:`, evalErr.message);
      continue;
    }

    if (!parsedOrder || !parsedOrder.orderNumber) continue;

    const paidStatus = await prisma.orderStatus.findUnique({ where: { slug: 'paid' } });

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: parsedOrder.orderNumber,
        customerEmail: parsedOrder.customerEmail || parsedOrder.email,
        customerDetails: stringifyIfObject(parsedOrder.customerDetails) || '{}',
        selectedOptions: stringifyIfObject(parsedOrder.selectedOptions) || '{}',
        totalPrice: parseFloat(parsedOrder.totalPrice || parsedOrder.finalPrice) || 0,
        currency: parsedOrder.currency || 'DKK',
        orderDate: parsedOrder.orderDate ? new Date(parsedOrder.orderDate) : new Date(),
        status: paidStatus ? paidStatus.name.toUpperCase().replace(/\s+/g, '_') : 'PAID',
        statusId: paidStatus?.id || null,
        packageName: parsedOrder.packageName || null,
        program: parsedOrder.program || null,
        customerId: parsedOrder.customerId || null,
        capImages: stringifyIfObject(parsedOrder.capImages),
        discountCodeId: parsedOrder.discountCodeId || null,
        discountAmount: parsedOrder.discountAmount || null,
        installmentPlanId: parsedOrder.installmentPlanId ? parseInt(parsedOrder.installmentPlanId) : null,
        installmentDetails: stringifyIfObject(parsedOrder.installmentDetails),
      }
    });

    console.log(`🎉 SUCCESS: Recovered order ${newOrder.orderNumber} (ID: ${newOrder.id})! Sending confirmation emails...`);

    await sendCapEmail(
      {
        body: {
          customerDetails: parsedOrder.customerDetails,
          selectedOptions: parsedOrder.selectedOptions,
          totalPrice: newOrder.totalPrice,
          currency: newOrder.currency,
          orderNumber: newOrder.orderNumber,
          orderDate: newOrder.orderDate,
          email: newOrder.customerEmail,
          packageName: newOrder.packageName,
          program: newOrder.program,
          capImages: parsedOrder.capImages,
          installmentDetails: parsedOrder.installmentDetails,
        }
      },
      { status: () => ({ json: () => {} }) }
    ).catch(err => console.error(`❌ Email error for ${newOrder.orderNumber}:`, err.message));

    recoveredCount++;
  }

  console.log(`🏁 Step 2 finished. Recovered ${recoveredCount} order(s) from PM2 logs.`);
}

async function retriggerInstallmentEmails() {
  console.log('\n==================================================');
  console.log('🔍 STEP 3: Checking Installment Orders needing payment links...');
  console.log('==================================================');

  try {
    const triggerStatuses = await prisma.orderStatus.findMany({
      where: {
        isInstallmentTrigger: true,
        installmentTriggerIndex: { not: null }
      }
    });

    if (triggerStatuses.length === 0) {
      console.log('ℹ️ No status is currently configured as an installment trigger.');
      return;
    }

    console.log(`Found ${triggerStatuses.length} installment trigger status(es):`);
    triggerStatuses.forEach(s => console.log(` - Status "${s.name}" (ID ${s.id}) triggers rate index ${s.installmentTriggerIndex}`));

    const triggerStatusIds = triggerStatuses.map(s => s.id);

    const orders = await prisma.order.findMany({
      where: {
        statusId: { in: triggerStatusIds }
      },
      include: { orderStatus: true }
    });

    console.log(`Checking ${orders.length} order(s) currently in trigger status...`);

    let sentCount = 0;
    for (const order of orders) {
      let instDetails = order.installmentDetails;
      if (typeof instDetails === 'string') {
        try { instDetails = JSON.parse(instDetails); } catch { instDetails = null; }
      }

      if (!instDetails || !Array.isArray(instDetails.installments)) continue;

      const idx = order.orderStatus.installmentTriggerIndex;
      const targetRate = instDetails.installments[idx];

      if (!targetRate) continue;

      if (targetRate.status === 'Paid') {
        console.log(`ℹ️ Order ${order.orderNumber} rate ${idx + 1} is already Paid.`);
        continue;
      }

      console.log(`📧 Sending rate ${idx + 1} (${targetRate.label}) payment link to ${order.customerEmail} for order ${order.orderNumber}...`);

      const apiRoot = process.env.API_BASE_URL || 'https://capliveapi.studentlife.dk/api';
      const frontendParam = instDetails.frontendUrl ? `&frontendUrl=${encodeURIComponent(instDetails.frontendUrl)}` : '';
      const paymentLink = `${apiRoot.replace(/\/$/, '')}/sendEmail/pay-installment?orderId=${order.id}&installmentIndex=${idx}${frontendParam}`;

      let emailData = null;
      try {
        emailData = buildInstallmentPaymentRequestEmail({
          order,
          installment: targetRate,
          installmentIndex: idx,
          paymentLink
        });
      } catch (e) {
        console.error('Error generating email HTML:', e.message);
      }

      const subject = emailData ? emailData.subject : `Din næste rate for ordre ${order.orderNumber} er klar til betaling`;
      const body = emailData ? emailData.html : `
        <p>Hej,</p>
        <p>Din næste rate (<strong>${targetRate.label}</strong>) på <strong>${targetRate.amount} DKK</strong> for ordre ${order.orderNumber} er klar til betaling.</p>
        <p><a href="${paymentLink}" style="padding:10px 20px; background:#16a34a; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">Betal nu</a></p>
      `;

      await sendOrderEmail(order.customerEmail, subject, body).catch(err => {
        console.error(`Failed to send email to ${order.customerEmail}:`, err.message);
      });

      console.log(`✅ Email sent to ${order.customerEmail} for order ${order.orderNumber}.`);
      sentCount++;
    }

    console.log(`🏁 Step 3 finished. Sent ${sentCount} installment email(s).`);
  } catch (err) {
    console.error('Error in retriggerInstallmentEmails:', err.message);
  }
}

async function main() {
  const logPathArg = process.argv[2];
  console.log('🚀 STARTING COMPREHENSIVE ORDER RECOVERY & EMAIL SYNC...');
  console.log('Time:', new Date().toISOString());

  await recoverFromTempOrders();
  await recoverFromPm2Logs(logPathArg);
  await retriggerInstallmentEmails();

  console.log('\n==================================================');
  console.log('✨ ALL RECOVERY TASKS COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal recovery error:', err);
  process.exit(1);
});

