/**
 * Script to manually mark an installment as Paid in the database
 * Usage:
 *   node scripts/markInstallmentPaid.js [orderNumberOrEmail] [rateNumber (default: 2)] [paidDate (default: 2026-11-09)]
 *
 * Example:
 *   node scripts/markInstallmentPaid.js CAP-1791289629814 2 2026-11-09
 *   node scripts/markInstallmentPaid.js sabinamckjusufi@gmail.com 2 2026-11-09
 *   node scripts/markInstallmentPaid.js (will use Sabina's order defaults)
 */

const prisma = require('../src/utils/prisma');

async function markPaid() {
  const args = process.argv.slice(2);
  const targetIdentifier = args[0] || 'CAP-1791289629814';
  const targetEmail = 'sabinamckjusufi@gmail.com';
  const targetRateNumber = parseInt(args[1]) || 2; // Rate 2 = index 1
  const targetIndex = targetRateNumber - 1;
  const paidDateArg = args[2] || '2026-11-09';
  const paidAtDate = new Date(`${paidDateArg}T12:00:00.000Z`);

  console.log('---------------------------------------------------------');
  console.log('  StudentLife - Mark Installment as Paid (No Email Send) ');
  console.log('---------------------------------------------------------');
  console.log(`Target Identifier: ${targetIdentifier}`);
  console.log(`Target Rate: Rate ${targetRateNumber} (Index: ${targetIndex})`);
  console.log(`Payment Date to set: ${paidAtDate.toISOString().split('T')[0]}`);
  console.log('Searching database...\n');

  // Search by orderNumber or customerEmail
  let order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber: targetIdentifier },
        { customerEmail: targetIdentifier },
        { customerEmail: targetEmail },
        { orderNumber: { contains: targetIdentifier.replace('CAP-', '') } }
      ]
    }
  });

  if (!order) {
    console.error(`❌ Order not found for identifier: ${targetIdentifier}`);
    return;
  }

  console.log(`✅ Order found:`);
  console.log(`   ID: ${order.id}`);
  console.log(`   Order Number: ${order.orderNumber}`);
  console.log(`   Customer Email: ${order.customerEmail}`);
  console.log(`   Total Price: ${order.totalPrice} ${order.currency}`);

  let details = order.installmentDetails;
  if (typeof details === 'string') {
    try {
      details = JSON.parse(details);
    } catch (e) {
      details = {};
    }
  }

  if (!details || !Array.isArray(details.installments)) {
    console.error('❌ Order has no installments array in installmentDetails.');
    return;
  }

  const targetInst = details.installments[targetIndex];
  if (!targetInst) {
    console.error(`❌ Installment at index ${targetIndex} (Rate ${targetRateNumber}) does not exist on this order.`);
    console.log('Available installments:', details.installments.map((inst, i) => `${i + 1}: ${inst.label} (${inst.status})`));
    return;
  }

  console.log('\n--- Target Installment Details ---');
  console.log(`Label: ${targetInst.label || `Rate ${targetRateNumber}`}`);
  console.log(`Amount: ${targetInst.amount} DKK`);
  console.log(`Current Status: ${targetInst.status}`);
  console.log(`Previous Paid Date: ${targetInst.paidAt || 'None'}`);

  // Update status to Paid and set paidAt
  targetInst.status = 'Paid';
  targetInst.paidAt = paidAtDate.toISOString();

  // Save updated installmentDetails to database
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      installmentDetails: JSON.stringify(details)
    }
  });

  console.log('\n=========================================================');
  console.log(`🎉 SUCCESS! Rate ${targetRateNumber} marked as PAID.`);
  console.log(`   Order: ${updatedOrder.orderNumber}`);
  console.log(`   Installment: ${targetInst.label || `Rate ${targetRateNumber}`}`);
  console.log(`   Status: Paid`);
  console.log(`   Payment Date: ${targetInst.paidAt}`);
  console.log('=========================================================');
  console.log('Note: No email was sent as per instruction. You can resend the confirmation email anytime from the admin dashboard.');
}

markPaid()
  .catch((err) => {
    console.error('❌ Error executing script:', err.message);
  })
  .finally(() => {
    prisma.$disconnect();
  });

