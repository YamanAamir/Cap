const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const totalOrders = await prisma.order.count();
  const installmentOrders = await prisma.order.count({
    where: {
      OR: [
        { installmentPlanId: { not: null } },
        { installmentDetails: { not: null } }
      ]
    }
  });
  console.log('Total Orders:', totalOrders);
  console.log('Installment Orders:', installmentOrders);
}

main().finally(() => prisma.$disconnect());
