const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Add column if it doesn't exist
    await prisma.$executeRawUnsafe('ALTER TABLE SmsMessage ADD COLUMN gatewayId VARCHAR(191) NULL');
    console.log('Column added');
  } catch (e) {
    console.log('Column might already exist:', e.message);
  }
  
  try {
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX SmsMessage_gatewayId_key ON SmsMessage(gatewayId)');
    console.log('Constraints added');
  } catch (e) {
    console.log('Constraints might already exist:', e.message);
  }
}
main().finally(() => prisma.$disconnect());
