/**
 * Targeted Recovery Script for Perle Mikkelsen
 * 
 * Target:
 * - Customer: perlemikkelsen@gmail.com
 * - Correct Order Number: CAP-1794234944195
 * - Correct Amount: 1,929.00 DKK
 * 
 * Actions:
 * 1. Removes incorrect order(s) for perlemikkelsen@gmail.com (e.g. ID 259 / CAP-1794234571312 with 2,929 DKK).
 * 2. Searches TempOrder and PM2 error logs for the paid order CAP-1794234944195.
 * 3. Creates the correct order in database with totalPrice: 1,929.00 DKK, status PAID, and cap images.
 * 4. Sends order confirmation email to perlemikkelsen@gmail.com.
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');
const { sendCapEmail } = require('../src/controllers/sendEmail.controller');

const TARGET_ORDER_NUMBER = 'CAP-1794234944195';
const TARGET_EMAIL = 'perlemikkelsen@gmail.com';
const TARGET_PRICE = 1929.00;

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

function cleanAndParseLogBlock(raw) {
  let cleaned = raw.replace(/^\s*\d+\|cap-live\s*\|\s*/gm, '');

  cleaned = cleaned
    .split('\n')
    .filter(line => !/^\s*[~^?-]{2,}/.test(line) && !/^\s*\?\s+/.test(line))
    .join('\n');

  cleaned = cleaned.replace(/~/g, ' ');

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

async function removeIncorrectOrders() {
  console.log('\n==================================================');
  console.log(`🔍 Checking and removing incorrect orders for ${TARGET_EMAIL}...`);
  console.log('==================================================');

  const incorrectOrders = await prisma.order.findMany({
    where: {
      customerEmail: TARGET_EMAIL,
      orderNumber: { not: TARGET_ORDER_NUMBER }
    }
  });

  if (incorrectOrders.length === 0) {
    console.log(`✓ No incorrect orders found for ${TARGET_EMAIL}.`);
    return;
  }

  for (const o of incorrectOrders) {
    console.log(`🗑️ Deleting incorrect order #${o.orderNumber} (ID: ${o.id}, Total: ${o.totalPrice} DKK)...`);
    await prisma.order.delete({ where: { id: o.id } });
    console.log(`✅ Deleted incorrect order ID ${o.id}!`);
  }
}

async function findOrderData() {
  console.log('\n==================================================');
  console.log(`🔍 Searching for order data for ${TARGET_ORDER_NUMBER}...`);
  console.log('==================================================');

  // 1. Check TempOrder table
  try {
    const tempRows = await prisma.$queryRaw`
      SELECT * FROM TempOrder 
      WHERE id = ${TARGET_ORDER_NUMBER} 
         OR orderData LIKE ${'%' + TARGET_ORDER_NUMBER + '%'}
    `;

    if (tempRows && tempRows.length > 0) {
      console.log(`✓ Found ${tempRows.length} matching row(s) in TempOrder!`);
      for (const row of tempRows) {
        let orderData = row.orderData;
        if (typeof orderData === 'string') {
          try { orderData = JSON.parse(orderData); } catch (e) { continue; }
        }
        if (orderData && (orderData.orderNumber === TARGET_ORDER_NUMBER || String(orderData.totalPrice) === '1929')) {
          console.log(`🎉 Successfully retrieved ${TARGET_ORDER_NUMBER} from TempOrder!`);
          return orderData;
        }
      }
    }
  } catch (err) {
    console.warn('TempOrder query error:', err.message);
  }

  // 2. Check PM2 error logs
  console.log('Searching in PM2 error logs...');
  const defaultPaths = [
    '/home/studentlife-app/.pm2/logs/cap-live-backend-error.log',
    '/root/.pm2/logs/cap-live-backend-error.log'
  ];

  let targetLog = null;
  for (const p of defaultPaths) {
    if (fs.existsSync(p)) {
      targetLog = p;
      break;
    }
  }

  if (!targetLog) {
    console.log('PM2 error log file not found.');
    return null;
  }

  const content = fs.readFileSync(targetLog, 'utf8');
  const targetIdx = content.indexOf(TARGET_ORDER_NUMBER);

  if (targetIdx === -1) {
    console.log(`Order ${TARGET_ORDER_NUMBER} not found in ${targetLog}`);
    return null;
  }

  console.log(`Found occurrence of ${TARGET_ORDER_NUMBER} in PM2 log at offset ${targetIdx}! Extracting payload...`);
  const startIdx = content.lastIndexOf('data: {', targetIdx);
  if (startIdx === -1) {
    console.log('Could not find start of data: { block');
    return null;
  }

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

  if (endIdx === -1) {
    console.log('Could not find matching closing brace for block');
    return null;
  }

  const rawBlock = content.substring(startIdx + 6, endIdx);
  const parsed = cleanAndParseLogBlock(rawBlock);
  console.log(`🎉 Successfully parsed ${TARGET_ORDER_NUMBER} from PM2 logs!`);
  return parsed;
}

async function main() {
  console.log('🚀 STARTING TARGETED RECOVERY FOR PERLE MIKKELSEN...');
  console.log('Target Order:', TARGET_ORDER_NUMBER);
  console.log('Target Amount:', TARGET_PRICE, 'DKK');
  console.log('Target Email:', TARGET_EMAIL);

  // Step 1: Remove wrong order(s) for Perle (e.g. ID 259 with 2,929 DKK)
  await removeIncorrectOrders();

  // Step 2: Check if correct order already exists
  const existing = await prisma.order.findFirst({
    where: { orderNumber: TARGET_ORDER_NUMBER }
  });

  if (existing) {
    console.log(`✓ Correct order #${TARGET_ORDER_NUMBER} (ID: ${existing.id}) already exists in database with totalPrice: ${existing.totalPrice} DKK.`);
    console.log('✨ All done!');
    process.exit(0);
  }

  // Step 3: Find order data from TempOrder or PM2 logs
  let orderData = await findOrderData();

  if (!orderData) {
    console.error(`❌ Could not locate data for ${TARGET_ORDER_NUMBER} in TempOrder or PM2 logs.`);
    process.exit(1);
  }

  // Step 4: Create the correct order in database
  console.log('\n==================================================');
  console.log(`🚀 Creating correct Order #${TARGET_ORDER_NUMBER} in database...`);
  console.log('==================================================');

  const paidStatus = await prisma.orderStatus.findUnique({ where: { slug: 'paid' } });
  const validCustomerId = await getOrCreateCustomer(TARGET_EMAIL, orderData.customerDetails || {});

  const newOrder = await prisma.order.create({
    data: {
      orderNumber: TARGET_ORDER_NUMBER,
      customerEmail: TARGET_EMAIL,
      customerDetails: stringifyIfObject(orderData.customerDetails) || '{}',
      selectedOptions: stringifyIfObject(orderData.selectedOptions) || '{}',
      totalPrice: TARGET_PRICE,
      currency: orderData.currency || 'DKK',
      orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date(),
      status: paidStatus ? paidStatus.name.toUpperCase().replace(/\s+/g, '_') : 'PAID',
      statusId: paidStatus?.id || null,
      packageName: orderData.packageName || null,
      program: orderData.program || null,
      customerId: validCustomerId,
      capImages: stringifyIfObject(orderData.capImages),
      discountCodeId: orderData.discountRecord?.id || orderData.discountCodeId || null,
      discountAmount: orderData.discountAmount || null,
      installmentPlanId: orderData.installmentPlanId ? parseInt(orderData.installmentPlanId) : null,
      installmentDetails: stringifyIfObject(orderData.installmentDetails),
    }
  });

  console.log(`🎉 SUCCESS: Created correct Order #${newOrder.orderNumber} with ID: ${newOrder.id} and Total Price: ${newOrder.totalPrice} DKK!`);

  // Step 5: Send order confirmation email
  console.log(`📧 Sending confirmation email to ${TARGET_EMAIL}...`);
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

  console.log('\n==================================================');
  console.log('✨ PERLE MIKKELSEN ORDER RECOVERY COMPLETED SUCCESSFULLY!');
  console.log(`✅ Order Number: ${newOrder.orderNumber}`);
  console.log(`✅ Order ID: ${newOrder.id}`);
  console.log(`✅ Amount: ${newOrder.totalPrice} DKK`);
  console.log(`✅ Customer: ${TARGET_EMAIL}`);
  console.log('==================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
