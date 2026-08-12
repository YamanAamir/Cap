const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function getOptions() {
  const orders = await prisma.order.findMany({ where: { selectedOptions: { not: 'null' } }, take: 10 });
  for (const order of orders) {
      if (order.selectedOptions && Object.keys(order.selectedOptions).length > 2) {
          console.log(JSON.stringify(order.selectedOptions, null, 2));
          break;
      }
  }
  await prisma.$disconnect();
}
getOptions();
