const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkSettings() {
  const s = await prisma.systemSetting.findUnique({ where: { key: 'PRODUCTION_DISPLAY_TERMS' } });
  console.log(JSON.stringify(s.value, null, 2));
  await prisma.$disconnect();
}
checkSettings();
