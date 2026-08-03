const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

prisma.systemSetting.findUnique({ where: { key: 'configurator' } })
  .then(s => console.dir(s ? s.value : 'not found', { depth: null }))
  .finally(() => prisma.$disconnect());
