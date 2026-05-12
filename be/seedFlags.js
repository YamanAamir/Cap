const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const flags = [
    { name: 'Danmark', price: 0 },
    { name: 'Sverige', price: 29 },
    { name: 'Norge', price: 29 },
    { name: 'Tyskland', price: 29 },
    { name: 'Frankrig', price: 29 },
    { name: 'Spanien', price: 29 },
    { name: 'Italien', price: 29 },
    { name: 'Storbritannien', price: 29 },
    { name: 'USA', price: 29 },
  ];

  for (const flag of flags) {
    await prisma.flag.upsert({
      where: { name: flag.name },
      update: {},
      create: flag,
    });
  }

  console.log('Seeded flags');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
