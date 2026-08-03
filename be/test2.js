const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

prisma.settings.findUnique({ where: { id: 'configurator' } })
  .then(s => console.dir(JSON.parse(s.value), { depth: null }))
  .finally(() => prisma.$disconnect());
