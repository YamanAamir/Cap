const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

async function main() {
  try {
    // Add column if it doesn't exist
    await prisma.$executeRawUnsafe('ALTER TABLE SmsCampaign ADD COLUMN slug VARCHAR(191)');
    console.log('Column added');
  } catch (e) {
    console.log('Column might already exist:', e.message);
  }
  
  try {
    const campaigns = await prisma.smsCampaign.findMany();
    for (const c of campaigns) {
      if (!c.slug) {
        await prisma.$executeRawUnsafe(`UPDATE SmsCampaign SET slug = '${uuidv4()}' WHERE id = ${c.id}`);
      }
    }
    console.log('Slugs generated');
  } catch(e) {
    console.log('Error updating slugs', e);
  }

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE SmsCampaign MODIFY COLUMN slug VARCHAR(191) NOT NULL');
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX SmsCampaign_slug_key ON SmsCampaign(slug)');
    console.log('Constraints added');
  } catch (e) {
    console.log('Constraints might already exist:', e.message);
  }
}
main().finally(() => prisma.$disconnect());
