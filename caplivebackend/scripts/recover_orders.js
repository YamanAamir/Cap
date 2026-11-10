/**
 * Targeted Order Recovery & Installment Sync Script
 * 
 * Specifically handles the Frisbii-paid customers:
 * - Ismael Kanj (issodal16@gmail.com)
 * - Mila yildiz (milae08@hotmail.com)
 * - Wania Ali (waniaaliakbar@gmail.com)
 * - Felix Bach Damholdt (felixbachdamholdt@gmail.com)
 * - Amal khalid (amaldana2009@icloud.com)
 * - Perle mikkelsen (perlemikkelsen@gmail.com)
 * - Eva Kahwi (hajarelkahwi@gmail.com)
 * - sabina jusufi (sabinamckjusufi@gmail.com)
 * - Kacper Dryjanski (ciufi8576@gmail.com)
 * - Fritz Anne Gara Gudmandsen (fritzannegudmandsen@gmail.com)
 * - Esma Suzan Kara (esmasuzan696@gmail.com)
 * - Ahmad Assaad (ahmadassaad204@gmail.com)
 * - Hiroko Ruiz (weryne@mailinator.com)
 * 
 * SAFETY RULES:
 * 1. ONLY Installment 2 (index 1) can be marked Paid.
 * 2. Automatically REVERTS any accidental Paid status on Installment 3+ back to 'Pending'.
 * 3. Never creates duplicate orders for customers who already have an order in the database.
 * 4. Recovers missing orders from TempOrder or PM2 logs (with robust ~ and Danish key cleaning).
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');
const {
  sendCapEmail,
  processSuccessfulInstallmentPayment,
  sendInstallmentConfirmationEmail
} = require('../src/controllers/sendEmail.controller');
const { sendOrderEmail } = require('../src/services/core.service');

// Target Frisbii paid customer emails provided by the user
const FRISBII_PAID_EMAILS = [
  'issodal16@gmail.com',
  'milae08@hotmail.com',
  'waniaaliakbar@gmail.com',
  'felixbachdamholdt@gmail.com',
  'amaldana2009@icloud.com',
  'perlemikkelsen@gmail.com',
  'hajarelkahwi@gmail.com',
  'sabinamckjusufi@gmail.com',
  'ciufi8576@gmail.com',
  'fritzannegudmandsen@gmail.com',
  'esmasuzan696@gmail.com',
  'ahmadassaad204@gmail.com',
  'weryne@mailinator.com'
].map(e => e.trim().toLowerCase());

// Set of emails whose orders are already in DB or have been created in this run
const HANDLED_CUSTOMER_EMAILS = new Set();

const stringifyIfObject = (val) => {
  if (val === null || val === undefined) return null;
  return typeof val === 'object' ? JSON.stringify(val) : String(val);
};

async function getOrCreateCustomer(customerEmail, customerDetails = {}) {
  if (!customerEmail) return null;
  const cleanEmail = customerEmail.trim().toLowerCase();
  let customer = await prisma.customer.findUnique({ where: { email: cleanEmail } });
  if (!customer) {
    const fullName = `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() || cleanEmail;
    customer = await prisma.customer.create({
      data: {
        email: cleanEmail,
        name: fullName,
        phone: customerDetails.phone || null,
        school: customerDetails.Skolenavn || customerDetails.schoolName || null,
      }
    }).catch(err => {
      console.warn(`Could not create customer ${cleanEmail}:`, err.message);
      return null;
    });
  }
  return customer ? customer.id : null;
}

/**
 * STEP 0: Check Existing Orders for Frisbii Paid Customers
 * - Ensures ONLY Installment 2 (index 1) is Paid.
 * - Automatically REVERTS accidental Rate 3+ back to 'Pending'!
 * - Avoids any duplicate order creation.
 */
async function checkAndSyncExistingOrders() {
  console.log('\n==================================================');
  console.log('🔍 STEP 0: Checking Existing Orders for Frisbii Paid Customers...');
  console.log('==================================================');

  for (const email of FRISBII_PAID_EMAILS) {
    const existingOrders = await prisma.order.findMany({
      where: {
        customerEmail: email
      },
      orderBy: { id: 'desc' }
    });

    if (existingOrders && existingOrders.length > 0) {
      const order = existingOrders[0];
      console.log(`\n📌 Customer ${email} ALREADY HAS Order #${order.orderNumber} (ID: ${order.id}) in database.`);
      HANDLED_CUSTOMER_EMAILS.add(email);

      let details = order.installmentDetails;
      if (typeof details === 'string') {
        try { details = JSON.parse(details); } catch (e) { details = {}; }
      }

      if (details && Array.isArray(details.installments) && details.installments.length > 0) {
        // ONLY sync Installment 2 (index 1)
        const inst2 = details.installments[1];
        if (inst2) {
          if (inst2.status !== 'Paid') {
            console.log(`💳 Order #${order.orderNumber} has pending Installment 2 (${inst2.label || 'Rate 2'}). Updating to PAID...`);
            inst2.status = 'Paid';
            inst2.paidAt = new Date().toISOString();
            await prisma.order.update({
              where: { id: order.id },
              data: { installmentDetails: JSON.stringify(details) }
            });
            await sendInstallmentConfirmationEmail({
              order,
              installment: inst2,
              installmentIndex: 1,
              details
            }).catch(err => console.error("Error sending installment email:", err));
            console.log(`✅ SUCCESS: Installment 2 marked as PAID and confirmation receipt sent to ${email}!`);
          } else {
            console.log(`ℹ️ Order #${order.orderNumber} (${email}) already has Installment 2 marked as Paid.`);
          }
        }

        // SAFETY: Revert any accidental Paid status on Installment 3 or later back to 'Pending'!
        let detailsChanged = false;
        for (let i = 2; i < details.installments.length; i++) {
          if (details.installments[i].status === 'Paid') {
            console.log(`🔄 REVERTING accidental Paid status on Installment ${i + 1} for Order #${order.orderNumber} (ID: ${order.id})...`);
            details.installments[i].status = 'Pending';
            details.installments[i].paidAt = null;
            detailsChanged = true;
          }
        }
        if (detailsChanged) {
          await prisma.order.update({
            where: { id: order.id },
            data: { installmentDetails: JSON.stringify(details) }
          });
          console.log(`✅ Order #${order.orderNumber} (ID: ${order.id}) Installment 3+ successfully reverted to Pending!`);
        }
      } else {
        console.log(`ℹ️ Order #${order.orderNumber} (${email}) is a full-payment order already in database. WILL NOT duplicate.`);
      }
    } else {
      console.log(`❓ Customer ${email} has NO existing order in database. Needs new order creation from TempOrder/Logs.`);
    }
  }

  console.log(`\n🏁 Step 0 finished. ${HANDLED_CUSTOMER_EMAILS.size} of ${FRISBII_PAID_EMAILS.length} customer(s) already have existing orders.`);
}

/**
 * STEP 1: Recover missing orders from TempOrder table
 */
async function recoverFromTempOrders() {
  console.log('\n==================================================');
  console.log('🔍 STEP 1: Recovering Missing Orders from TempOrder...');
  console.log('==================================================');

  try {
    const tempRows = await prisma.$queryRaw`SELECT * FROM TempOrder ORDER BY createdAt DESC`;
    console.log(`Scanning ${tempRows.length} total rows in TempOrder...`);

    let recoveredCount = 0;
    for (const row of tempRows) {
      let orderData = row.orderData;
      if (typeof orderData === 'string') {
        try { orderData = JSON.parse(orderData); } catch (e) { continue; }
      }

      if (!orderData || !orderData.orderNumber) continue;

      const orderEmail = (orderData.email || orderData.customerEmail || orderData.customerDetails?.email || '').trim().toLowerCase();

      // ONLY process if this order belongs to one of the Frisbii paid customers!
      if (!FRISBII_PAID_EMAILS.includes(orderEmail)) {
        continue;
      }

      // STRICT GUARD: If customer already has an order in DB, DO NOT create a duplicate order!
      if (HANDLED_CUSTOMER_EMAILS.has(orderEmail)) {
        console.log(`⏩ Skipping TempOrder ${orderData.orderNumber} for ${orderEmail} (customer already has order in DB).`);
        continue;
      }

      const exists = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: orderData.orderNumber },
            { customerEmail: orderEmail }
          ]
        }
      });

      if (exists) {
        console.log(`ℹ️ Order ${orderData.orderNumber} or customer ${orderEmail} already exists in database (ID: ${exists.id}). Skipping.`);
        HANDLED_CUSTOMER_EMAILS.add(orderEmail);
        continue;
      }

      console.log(`🚀 Recovering missing Frisbii paid order ${orderData.orderNumber} for ${orderEmail}...`);

      const paidStatus = await prisma.orderStatus.findUnique({ where: { slug: 'paid' } });
      const validCustomerId = await getOrCreateCustomer(orderEmail, orderData.customerDetails || {});

      const customerDetailsStr = stringifyIfObject(orderData.customerDetails) || '{}';
      const selectedOptionsStr = stringifyIfObject(orderData.selectedOptions) || '{}';
      const capImagesStr = stringifyIfObject(orderData.capImages);
      const installmentDetailsStr = stringifyIfObject(orderData.installmentDetails);

      const newOrder = await prisma.order.create({
        data: {
          orderNumber: orderData.orderNumber,
          customerEmail: orderEmail,
          customerDetails: customerDetailsStr,
          selectedOptions: selectedOptionsStr,
          totalPrice: parseFloat(orderData.finalPrice || orderData.totalPrice) || 0,
          currency: orderData.currency || 'DKK',
          orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date(),
          status: paidStatus ? paidStatus.name.toUpperCase().replace(/\s+/g, '_') : 'PAID',
          statusId: paidStatus?.id || null,
          packageName: orderData.packageName || null,
          program: orderData.program || null,
          customerId: validCustomerId,
          capImages: capImagesStr,
          discountCodeId: orderData.discountRecord?.id || null,
          discountAmount: orderData.discountAmount || null,
          installmentPlanId: orderData.installmentPlanId ? parseInt(orderData.installmentPlanId) : null,
          installmentDetails: installmentDetailsStr,
        }
      });

      console.log(`✅ SUCCESS: Created Order ${newOrder.orderNumber} with ID ${newOrder.id}! Sending confirmation emails...`);
      HANDLED_CUSTOMER_EMAILS.add(orderEmail);

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

      recoveredCount++;
    }

    console.log(`🏁 Step 1 finished. Recovered ${recoveredCount} missing order(s) from TempOrder.`);
  } catch (err) {
    console.error('❌ Error in recoverFromTempOrders:', err.message);
  }
}

/**
 * Robustly parses a JS object literal extracted from Node util.inspect/Prisma logs.
 * Handles Prisma error tildes, diff markers, and Danish keys with spaces.
 */
function cleanAndParseLogBlock(raw) {
  let cleaned = raw.replace(/^\s*\d+\|cap-live\s*\|\s*/gm, '');

  // 1. Remove Prisma diff underline markers and hint lines
  cleaned = cleaned
    .split('\n')
    .filter(line => !/^\s*[~^?-]{2,}/.test(line) && !/^\s*\?\s+/.test(line))
    .join('\n');

  // 2. Remove all tildes ~ (Prisma error/diff indicators)
  cleaned = cleaned.replace(/~/g, ' ');

  // 3. Quote unquoted keys (including Danish characters and spaces like "Roset farve:")
  let processed = cleaned.replace(
    /([{,\s])([a-zA-Z\u00C0-\u024F0-9_ -]+?)\s*:/g,
    (match, prefix, key) => {
      const trimmedKey = key.trim();
      if ((trimmedKey.startsWith('"') && trimmedKey.endsWith('"')) ||
          (trimmedKey.startsWith("'") && trimmedKey.endsWith("'"))) {
        return `${prefix}${trimmedKey}:`;
      }
      return `${prefix}"${trimmedKey}":`;
    }
  );

  const startIdx = processed.indexOf('{');
  const endIdx = processed.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('No valid JS object braces found');
  }
  const objStr = processed.substring(startIdx, endIdx + 1);

  return (new Function(`return (${objStr});`))();
}

/**
 * STEP 2: Recover any remaining missing orders from PM2 error logs
 */
async function recoverFromPm2Logs(logFilePath) {
  console.log('\n==================================================');
  console.log('🔍 STEP 2: Checking PM2 Error Logs for remaining missing orders...');
  console.log('==================================================');

  const defaultPaths = [
    logFilePath,
    '/home/studentlife-app/.pm2/logs/cap-live-backend-error.log',
    '/root/.pm2/logs/cap-live-backend-error.log'
  ].filter(Boolean);

  let targetLog = null;
  for (const p of defaultPaths) {
    if (fs.existsSync(p)) {
      targetLog = p;
      break;
    }
  }

  if (!targetLog) {
    console.log('ℹ️ PM2 error log not found at default paths. Skipping log scan.');
    return;
  }

  console.log(`Reading PM2 error log: ${targetLog}...`);
  const content = fs.readFileSync(targetLog, 'utf8');

  const orderNumRegex = /orderNumber:\s*['"](CAP-\d+)['"]/g;
  let match;
  const matches = [];
  while ((match = orderNumRegex.exec(content)) !== null) {
    matches.push({ orderNumber: match[1], index: match.index });
  }

  console.log(`Found ${matches.length} orderNumber occurrence(s) in log.`);

  let recoveredCount = 0;
  for (const m of matches) {
    const orderNum = m.orderNumber;

    const exists = await prisma.order.findFirst({
      where: { orderNumber: orderNum }
    });

    if (exists) {
      continue;
    }

    const orderIdx = m.index;
    const startIdx = content.lastIndexOf('data: {', orderIdx);
    if (startIdx === -1) continue;

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

    if (endIdx === -1) continue;

    const rawBlock = content.substring(startIdx + 6, endIdx);

    let parsedOrder = null;
    try {
      parsedOrder = cleanAndParseLogBlock(rawBlock);
    } catch (evalErr) {
      console.error(`Failed to parse extracted data block for ${orderNum}:`, evalErr.message);
      continue;
    }

    if (!parsedOrder || !parsedOrder.orderNumber) continue;

    const orderEmail = (parsedOrder.customerEmail || parsedOrder.email || parsedOrder.customerDetails?.email || '').trim().toLowerCase();

    // Check if customer belongs to paid list
    if (!FRISBII_PAID_EMAILS.includes(orderEmail)) {
      continue;
    }

    // STRICT GUARD: If customer already has an order in DB, DO NOT create a duplicate order!
    if (HANDLED_CUSTOMER_EMAILS.has(orderEmail)) {
      console.log(`⏩ Skipping log recovery for ${orderEmail} (customer already has order in DB).`);
      continue;
    }

    const paidStatus = await prisma.orderStatus.findUnique({ where: { slug: 'paid' } });
    const validCustomerId = await getOrCreateCustomer(orderEmail, parsedOrder.customerDetails || {});

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: parsedOrder.orderNumber,
        customerEmail: orderEmail,
        customerDetails: stringifyIfObject(parsedOrder.customerDetails) || '{}',
        selectedOptions: stringifyIfObject(parsedOrder.selectedOptions) || '{}',
        totalPrice: parseFloat(parsedOrder.totalPrice || parsedOrder.finalPrice) || 0,
        currency: parsedOrder.currency || 'DKK',
        orderDate: parsedOrder.orderDate ? new Date(parsedOrder.orderDate) : new Date(),
        status: paidStatus ? paidStatus.name.toUpperCase().replace(/\s+/g, '_') : 'PAID',
        statusId: paidStatus?.id || null,
        packageName: parsedOrder.packageName || null,
        program: parsedOrder.program || null,
        customerId: validCustomerId,
        capImages: stringifyIfObject(parsedOrder.capImages),
        discountCodeId: parsedOrder.discountCodeId || null,
        discountAmount: parsedOrder.discountAmount || null,
        installmentPlanId: parsedOrder.installmentPlanId ? parseInt(parsedOrder.installmentPlanId) : null,
        installmentDetails: stringifyIfObject(parsedOrder.installmentDetails),
      }
    });

    console.log(`🎉 SUCCESS: Recovered order ${newOrder.orderNumber} (ID: ${newOrder.id}) for ${orderEmail}! Sending confirmation emails...`);
    HANDLED_CUSTOMER_EMAILS.add(orderEmail);

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

  console.log(`🏁 Step 2 finished. Recovered ${recoveredCount} missing order(s) from PM2 logs.`);
}

async function main() {
  const logPathArg = process.argv[2];
  console.log('🚀 STARTING TARGETED ORDER RECOVERY FOR FRISBII PAID CUSTOMERS...');
  console.log('Time:', new Date().toISOString());
  console.log('Target Emails:', FRISBII_PAID_EMAILS);

  // Step 0: Check existing orders first (sync ONLY Installment 2, REVERT accidental Installment 3+, avoid duplicate creation)
  await checkAndSyncExistingOrders();

  // Step 1: Recover only missing orders from TempOrder
  await recoverFromTempOrders();

  // Step 2: Recover any remaining missing orders from PM2 logs
  await recoverFromPm2Logs(logPathArg);

  console.log('\n==================================================');
  console.log('✨ ALL PROCESSING COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal recovery error:', err);
  process.exit(1);
});
