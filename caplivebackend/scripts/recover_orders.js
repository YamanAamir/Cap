/**
 * Comprehensive Order Recovery & Installment Status Sync Script
 * 
 * 1. INSTALLMENT STATUS CORRECTION:
 *    - ONLY the verified customers who actually paid Installment 2 will have Installment 2 marked as 'Paid':
 *      * issodal16@gmail.com
 *      * rory@staehr.dk
 *      * waniaaliakbar@gmail.com
 *      * amaldana2009@icloud.com
 *      * hajarelkahwi@gmail.com
 *      * ciufi8576@gmail.com
 *    - ALL OTHER ORDERS that had Installment 2 or 3 accidentally marked as 'Paid' (e.g. milae08@hotmail.com,
 *      sabinamckjusufi@gmail.com, etc.) are REVERTED BACK to 'Pending' (with paidAt: null).
 *    - Installment 3 is reverted to 'Pending' for ALL orders.
 * 
 * 2. ORDER RECOVERY FOR FAILED CHECKOUTS:
 *    - Specifically recovers the 5 failed orders provided by user:
 *      * felixbachdamholdt@gmail.com  (725.00 DKK)
 *      * perlemikkelsen@gmail.com    (1,929.00 DKK) - already in DB (ID: 257)
 *      * fritzannegudmandsen@gmail.com (1,929.00 DKK)
 *      * esmasuzan696@gmail.com       (971.00 DKK)
 *      * ahmadassaad204@gmail.com     (396.00 DKK)
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');
const { sendCapEmail } = require('../src/controllers/sendEmail.controller');

// Exactly the customers who paid Installment 2
const LEGIT_INSTALLMENT_2_PAID_EMAILS = [
  'issodal16@gmail.com',
  'rory@staehr.dk',
  'waniaaliakbar@gmail.com',
  'amaldana2009@icloud.com',
  'hajarelkahwi@gmail.com',
  'ciufi8576@gmail.com'
].map(e => e.trim().toLowerCase());

// Target failed orders to recover
const TARGET_FAILED_ORDERS = [
  { email: 'felixbachdamholdt@gmail.com', expectedAmount: 725.00 },
  { email: 'perlemikkelsen@gmail.com', expectedAmount: 1929.00 },
  { email: 'fritzannegudmandsen@gmail.com', expectedAmount: 1929.00 },
  { email: 'esmasuzan696@gmail.com', expectedAmount: 971.00 },
  { email: 'ahmadassaad204@gmail.com', expectedAmount: 396.00 }
];

const TARGET_EMAILS = TARGET_FAILED_ORDERS.map(o => o.email.toLowerCase());

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
 * STEP 0: Correct All Installment Statuses in Database
 */
async function fixAllInstallmentStatuses() {
  console.log('\n==================================================');
  console.log('🔧 STEP 0: Syncing & Correcting Installment Statuses...');
  console.log('==================================================');

  const orders = await prisma.order.findMany({
    where: {
      installmentDetails: { not: null }
    }
  });

  console.log(`Found ${orders.length} order(s) with installment details in database.`);

  let updatedCount = 0;
  for (const order of orders) {
    let details = order.installmentDetails;
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch (e) { continue; }
    }

    if (!details || !Array.isArray(details.installments) || details.installments.length === 0) {
      continue;
    }

    const orderEmail = (order.customerEmail || '').trim().toLowerCase();
    const isLegitPaid = LEGIT_INSTALLMENT_2_PAID_EMAILS.includes(orderEmail);

    let changed = false;

    // Check Installment 2 (index 1)
    if (details.installments[1]) {
      if (isLegitPaid) {
        if (details.installments[1].status !== 'Paid') {
          console.log(`💳 Marking Installment 2 as PAID for ${orderEmail} (Order #${order.orderNumber})...`);
          details.installments[1].status = 'Paid';
          if (!details.installments[1].paidAt) {
            details.installments[1].paidAt = new Date().toISOString();
          }
          changed = true;
        } else {
          console.log(`✓ Installment 2 is already PAID for verified customer ${orderEmail} (Order #${order.orderNumber}).`);
        }
      } else {
        // Customer is NOT in the verified paid list -> must be PENDING!
        if (details.installments[1].status === 'Paid') {
          console.log(`🔄 REVERTING Installment 2 back to PENDING for ${orderEmail} (Order #${order.orderNumber})...`);
          details.installments[1].status = 'Pending';
          details.installments[1].paidAt = null;
          changed = true;
        }
      }
    }

    // Safety: ALL Installment 3 and beyond (index 2+) must ALWAYS be PENDING!
    for (let i = 2; i < details.installments.length; i++) {
      if (details.installments[i].status === 'Paid') {
        console.log(`🔄 REVERTING accidental Rate ${i + 1} back to PENDING for ${orderEmail} (Order #${order.orderNumber})...`);
        details.installments[i].status = 'Pending';
        details.installments[i].paidAt = null;
        changed = true;
      }
    }

    if (changed) {
      await prisma.order.update({
        where: { id: order.id },
        data: { installmentDetails: JSON.stringify(details) }
      });
      updatedCount++;
    }
  }

  console.log(`🏁 Step 0 finished. Updated and corrected ${updatedCount} installment order(s).`);
}

/**
 * STEP 1: Check existing orders for the 5 target failed orders
 */
async function checkExistingTargetOrders() {
  console.log('\n==================================================');
  console.log('🔍 STEP 1: Checking Existing Orders for 5 Target Customers...');
  console.log('==================================================');

  const pendingRecovery = [];

  for (const target of TARGET_FAILED_ORDERS) {
    const existingOrders = await prisma.order.findMany({
      where: { customerEmail: target.email },
      orderBy: { id: 'desc' }
    });

    if (existingOrders && existingOrders.length > 0) {
      const order = existingOrders[0];
      console.log(`✅ Order #${order.orderNumber} (ID: ${order.id}) already exists for ${target.email} (Total: ${order.totalPrice} DKK). No recovery needed.`);
    } else {
      console.log(`🚨 Missing order for ${target.email} (Expected Amount: ${target.expectedAmount} DKK). Will recover in Step 2/3.`);
      pendingRecovery.push(target);
    }
  }

  return pendingRecovery;
}

/**
 * STEP 2: Recover missing orders from TempOrder table
 */
async function recoverFromTempOrders(pendingTargets) {
  if (pendingTargets.length === 0) return [];
  console.log('\n==================================================');
  console.log('🔍 STEP 2: Checking TempOrder Table for missing orders...');
  console.log('==================================================');

  const remaining = [...pendingTargets];

  try {
    const tempRows = await prisma.$queryRaw`SELECT * FROM TempOrder ORDER BY createdAt DESC`;
    console.log(`Scanning ${tempRows.length} total rows in TempOrder...`);

    for (const row of tempRows) {
      let orderData = row.orderData;
      if (typeof orderData === 'string') {
        try { orderData = JSON.parse(orderData); } catch (e) { continue; }
      }

      if (!orderData || !orderData.orderNumber) continue;

      const orderEmail = (orderData.email || orderData.customerEmail || orderData.customerDetails?.email || '').trim().toLowerCase();

      const targetIdx = remaining.findIndex(t => t.email === orderEmail);
      if (targetIdx === -1) continue;

      const target = remaining[targetIdx];

      console.log(`🚀 Recovering order ${orderData.orderNumber} for ${orderEmail} from TempOrder...`);

      const paidStatus = await prisma.orderStatus.findUnique({ where: { slug: 'paid' } });
      const validCustomerId = await getOrCreateCustomer(orderEmail, orderData.customerDetails || {});

      const newOrder = await prisma.order.create({
        data: {
          orderNumber: orderData.orderNumber,
          customerEmail: orderEmail,
          customerDetails: stringifyIfObject(orderData.customerDetails) || '{}',
          selectedOptions: stringifyIfObject(orderData.selectedOptions) || '{}',
          totalPrice: parseFloat(orderData.finalPrice || orderData.totalPrice || target.expectedAmount) || 0,
          currency: orderData.currency || 'DKK',
          orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date(),
          status: paidStatus ? paidStatus.name.toUpperCase().replace(/\s+/g, '_') : 'PAID',
          statusId: paidStatus?.id || null,
          packageName: orderData.packageName || null,
          program: orderData.program || null,
          customerId: validCustomerId,
          capImages: stringifyIfObject(orderData.capImages),
          discountCodeId: orderData.discountRecord?.id || null,
          discountAmount: orderData.discountAmount || null,
          installmentPlanId: orderData.installmentPlanId ? parseInt(orderData.installmentPlanId) : null,
          installmentDetails: stringifyIfObject(orderData.installmentDetails),
        }
      });

      console.log(`🎉 SUCCESS: Created Order ${newOrder.orderNumber} (ID: ${newOrder.id}) for ${orderEmail}! Sending confirmation email...`);

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

      remaining.splice(targetIdx, 1);
    }
  } catch (err) {
    console.error('❌ Error checking TempOrders:', err.message);
  }

  return remaining;
}

/**
 * Robustly parses a JS object literal extracted from Node util.inspect/Prisma logs.
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
 * STEP 3: Recover remaining missing orders from PM2 error logs
 */
async function recoverFromPm2Logs(pendingTargets, logFilePath) {
  if (pendingTargets.length === 0) {
    console.log('✓ All target orders have already been recovered!');
    return;
  }

  console.log('\n==================================================');
  console.log('🔍 STEP 3: Checking PM2 Error Logs for remaining missing orders...');
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
  const seenOrderNums = new Set();

  while ((match = orderNumRegex.exec(content)) !== null) {
    const num = match[1];
    if (!seenOrderNums.has(num)) {
      seenOrderNums.add(num);
      matches.push({ orderNumber: num, index: match.index });
    }
  }

  console.log(`Found ${matches.length} unique orderNumber occurrence(s) in log.`);

  const remaining = [...pendingTargets];

  for (const m of matches) {
    if (remaining.length === 0) break;

    const orderNum = m.orderNumber;
    const orderIdx = m.index;
    const startIdx = content.lastIndexOf('data: {', orderIdx);
    if (startIdx === -1) continue;

    let openBraces = 0;
    let endIdx = -1;
    let inString = false;
    let escape = false;

    // Fixed brace matching logic: decrements first, then checks openBraces === 0
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
        if (ch === '{') {
          openBraces++;
        } else if (ch === '}') {
          openBraces--;
          if (openBraces === 0) {
            endIdx = i + 1;
            break;
          }
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

    // Check if this parsed order matches one of our pending targets
    const targetIdx = remaining.findIndex(t => t.email === orderEmail);
    if (targetIdx === -1) continue;

    const target = remaining[targetIdx];

    // Check if order already in DB
    const exists = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: parsedOrder.orderNumber },
          { customerEmail: orderEmail }
        ]
      }
    });

    if (exists) {
      console.log(`ℹ️ Order for ${orderEmail} already exists in database (ID: ${exists.id}). Skipping.`);
      remaining.splice(targetIdx, 1);
      continue;
    }

    console.log(`🚀 Recovering order ${parsedOrder.orderNumber} for ${orderEmail} (${parsedOrder.totalPrice || target.expectedAmount} DKK)...`);

    const paidStatus = await prisma.orderStatus.findUnique({ where: { slug: 'paid' } });
    const validCustomerId = await getOrCreateCustomer(orderEmail, parsedOrder.customerDetails || {});

    const newOrder = await prisma.order.create({
      data: {
        orderNumber: parsedOrder.orderNumber,
        customerEmail: orderEmail,
        customerDetails: stringifyIfObject(parsedOrder.customerDetails) || '{}',
        selectedOptions: stringifyIfObject(parsedOrder.selectedOptions) || '{}',
        totalPrice: parseFloat(parsedOrder.totalPrice || parsedOrder.finalPrice || target.expectedAmount) || 0,
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

    console.log(`🎉 SUCCESS: Created Order ${newOrder.orderNumber} (ID: ${newOrder.id}) for ${orderEmail}! Sending confirmation email...`);

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

    remaining.splice(targetIdx, 1);
  }

  if (remaining.length > 0) {
    console.log(`⚠️ Could not find log entries for: ${remaining.map(r => r.email).join(', ')}`);
  } else {
    console.log(`✨ All target failed orders have been successfully recovered!`);
  }
}

async function main() {
  const logPathArg = process.argv[2];
  console.log('🚀 STARTING ACCURATE ORDER RECOVERY & INSTALLMENT SYNC...');
  console.log('Time:', new Date().toISOString());

  // Step 0: Fix all installment statuses (keep ONLY legit 6 as Paid, revert all others to Pending)
  await fixAllInstallmentStatuses();

  // Step 1: Check existing orders for target customers
  const pendingTargets = await checkExistingTargetOrders();

  // Step 2: Recover from TempOrder
  const remainingAfterTemp = await recoverFromTempOrders(pendingTargets);

  // Step 3: Recover from PM2 logs
  await recoverFromPm2Logs(remainingAfterTemp, logPathArg);

  console.log('\n==================================================');
  console.log('✨ ALL PROCESSING COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal recovery error:', err);
  process.exit(1);
});
