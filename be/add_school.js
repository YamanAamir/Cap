const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE Customer ADD COLUMN school VARCHAR(191) NULL');
    console.log('Column school added');
  } catch (e) {
    console.log('Column school might already exist:', e.message);
  }
}
main().finally(() => prisma.$disconnect());
