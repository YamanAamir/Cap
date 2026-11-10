/**
 * Targeted Order Recovery & Email Sync Script
 * 
 * Specifically recovers the Frisbii-paid orders:
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
 */

const fs = require('fs');
const path = require('path');
const prisma = require('../src/utils/prisma');
const { sendCapEmail } = require('../src/controllers/sendEmail.controller');
const { sendOrderEmail } = require('../src/services/core.service');
const { buildInstallmentPaymentRequestEmail } = require('../src/controllers/sendEmail.controller');

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

async function recoverFromTempOrders() {
  console.log('\n==================================================');
  console.log('🔍 STEP 1: Recovering Frisbii Paid Orders from TempOrder...');
  console.log('==================================================');

  try {
    const tempRows = await prisma.$queryRaw`SELECT * FROM TempOrder ORDER BY createdAt DESC`;
    console.log(`Scanning ${tempRows.length} total rows in TempOrder for paid customer emails...`);

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

      const exists = await prisma.order.findFirst({
        where: { orderNumber: orderData.orderNumber }
      });

      if (exists) {
        console.log(`ℹ️ Order ${orderData.orderNumber} (${orderEmail}) already exists in database (ID: ${exists.id}).`);
        continue;
      }

      console.log(`🚀 Recovering Frisbii paid order ${orderData.orderNumber} for ${orderEmail}...`);

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

    console.log(`🏁 Step 1 finished. Recovered ${recoveredCount} Frisbii-paid order(s) from TempOrder.`);
  } catch (err) {
    console.error('Error in recoverFromTempOrders:', err.message);
  }
}

function cleanAndParseLogBlock(block) {
  let cleaned = block;
  cleaned = cleaned.replace(/^\s*\d+\|[\w-]+\s*\|\s*/gm, '');
  cleaned = cleaned.replace(/^\s*~+\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*[\+\?]\s+.*$/gm, '');

  cleaned = cleaned.trim();
  if (!cleaned.startsWith('{')) cleaned = '{ ' + cleaned;
  if (!cleaned.endsWith('}')) cleaned = cleaned + ' }';

  // Quote unquoted keys (including those with spaces and danish characters)
  cleaned = cleaned.replace(/([{,\s])([a-zA-Z\u00C0-\u024F0-9_ -]+?)\s*:/g, (match, prefix, key) => {
    const trimmed = key.trim();
    if (!trimmed) return match;
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return match;
    }
    return `${prefix}"${trimmed}":`;
  });

  const fn = new Function(`return (${cleaned});`);
  return fn();
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
    console.log('⚠️ PM2 error log file not found at default paths.');
    return;
  }

  console.log(`📖 Reading log file: ${targetPath}`);
  const content = fs.readFileSync(targetPath, 'utf8');

  // Search for failed order blocks in the log
  const orderNumberMatches = [...content.matchAll(/orderNumber:\s*["'](CAP-\d+)["']/g)];
  console.log(`Found ${orderNumberMatches.length} orderNumber occurrence(s) in log.`);

  const seenOrderNumbers = new Set();
  let recoveredCount = 0;

  for (const m of orderNumberMatches) {
    const orderNum = m[1];
    if (seenOrderNumbers.has(orderNum)) continue;
    seenOrderNumbers.add(orderNum);

    const exists = await prisma.order.findFirst({
      where: { orderNumber: orderNum }
    });

    if (exists) {
      console.log(`ℹ️ Order ${orderNum} already exists in database (ID: ${exists.id}). Skipping.`);
      continue;
    }

    console.log(`🚨 Order ${orderNum} was found in error logs but NOT in database! Extracting payload...`);

    const orderIdx = m.index;
    const startIdx = content.lastIndexOf('data: {', orderIdx);
    if (startIdx === -1) {
      console.warn(`Could not find start of data block for ${orderNum}`);
      continue;
    }

    // Bracket-matching to extract the exact data object block
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

async function main() {
  const logPathArg = process.argv[2];
  console.log('🚀 STARTING TARGETED ORDER RECOVERY FOR FRISBII PAID CUSTOMERS...');
  console.log('Time:', new Date().toISOString());
  console.log('Target Emails:', FRISBII_PAID_EMAILS);

  await recoverFromTempOrders();
  await recoverFromPm2Logs(logPathArg);

  console.log('\n==================================================');
  console.log('✨ TARGETED ORDER RECOVERY COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal recovery error:', err);
  process.exit(1);
});
