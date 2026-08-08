const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const flags = await prisma.flag.findMany();
  console.log(`Found ${flags.length} existing flags.`);

  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'configurator_settings' }
  });

  if (!setting) {
    console.log('No configurator_settings found!');
    return;
  }

  let config = setting.value;
  config.programFlags = {};

  const programs = [
    'STX', 'HHX', 'HTX', 'HF', 'EUD', 'EUX',
    'sosuassistent', 'sosuhjælper', 'frisør', 'kosmetolog',
    'pædagog', 'pau', 'ernæringsassisten', 'STU', 'Landmand'
  ];

  const flagData = flags.map(f => ({
    id: f.id.toString(),
    name: f.name,
    price: f.price
  }));

  for (const p of programs) {
    config.programFlags[p] = [...flagData];
  }

  await prisma.systemSetting.update({
    where: { key: 'configurator_settings' },
    data: { value: config }
  });

  console.log('Successfully migrated flags to programFlags in configurator_settings.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
