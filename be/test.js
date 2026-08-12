const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function getOptions() {
  const orders = await prisma.order.findMany();
  for (const order of orders) {
      if (order.selectedOptions && order.selectedOptions.length > 10) {
          console.log(order.selectedOptions);
          break;
      }
  }
  await prisma.$disconnect();
}
getOptions();
