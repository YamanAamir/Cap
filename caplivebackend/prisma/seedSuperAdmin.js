const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_SEED_EMAIL || 'info@studentlife.dk';
  const plainPassword = process.env.SUPERADMIN_SEED_PASSWORD || '123456789';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: 'StudentLife Super Admin',
        password: hashedPassword,
        role: 'superadmin',
      },
      create: {
        name: 'StudentLife Super Admin',
        email,
        password: hashedPassword,
        role: 'superadmin',
      },
    });

    console.log('✅ Superadmin user seeded successfully:');
    console.log(`  Email:    ${user.email}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`  Password: ${plainPassword}`);
      console.log('  (Override with SUPERADMIN_SEED_EMAIL / SUPERADMIN_SEED_PASSWORD in .env)');
    } else {
      console.log('  Password: set via environment variables (hidden in production)');
    }
  } catch (error) {
    console.error('❌ Error seeding superadmin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
