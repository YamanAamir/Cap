const prisma = require('../src/utils/prisma');

async function main() {
  const email = process.argv[2] || 'info@studentlife.dk';
  console.log(`Setting administrator notification receipt email to: ${email}...`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`SystemSetting\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`key\` VARCHAR(191) NOT NULL,
      \`value\` LONGTEXT NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`SystemSetting_key_key\` (\`key\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  const value = JSON.stringify({
    recipientEmail: email.trim(),
    enabled: true,
    updatedAt: new Date().toISOString()
  });

  await prisma.systemSetting.upsert({
    where: { key: 'payment_receipt_settings' },
    update: { value },
    create: { key: 'payment_receipt_settings', value }
  });

  console.log(`✅ Successfully saved! Admin payment receipts will now be sent to: ${email}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

