const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

prisma.order.findFirst({ orderBy: { id: 'desc' } })
  .then(order => console.dir(order, { depth: null }))
  .finally(() => prisma.$disconnect());
