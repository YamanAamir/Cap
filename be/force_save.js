const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function forceSave() {
  const MASTER_TEMPLATE = {
    KOKARDE: ['Emblem', 'Kokarde', 'Roset farve', 'Type'],
    'UDDANNELSESBÅND': ['Broderi farve', 'Broderi foran', 'Hagerem', 'Huebånd', 'Knap farve', 'Materiale', 'År'],
    BRODERI: ['Broderifarve', 'Navne broderi', 'Skolebroderi', 'Skolebroderi farve', 'Top broderi'],
    BETRÆK: ['Farve', 'Kantbånd', 'Stjerner', 'Topkant', 'Flagbånd'],
    SKYGGE: ['Materiale', 'Skyggebånd', 'Skyggegravering Line 1', 'Skyggegravering Line 2', 'Skyggegravering Line 3', 'Type'],
    FOER: ['Farve', 'Foer', 'Sløjfe', 'Svederem', 'Silk Type', 'Satin Type', 'Indvendigt foer billede'],
    EKSTRABETRÆK: ['Tilvælg'],
    TILBEHØR: ['Bucketpins', 'Ekstra korkarde', 'Ekstra korkarde Text', 'Flag 1', 'Flag 2', 'Flag 3', 'Fløjte', 'Handsker', 'Huekuglepen', 'Hueæske', 'Luksus champagneglas', 'Lyskugle', 'Premium æske', 'Silkepude', 'Smart Tag', 'Store kuglepen', 'Trompet'],
    STØRRELSE: ['Vælg størrelse', 'Millimeter tilpasningssæt']
  };

  const newSettings = {};
  for (const cat of Object.keys(MASTER_TEMPLATE)) {
    newSettings[cat] = {
      visible: cat !== 'KOKARDE', // Hide KOKARDE for testing
      fields: {}
    };
    for (const field of MASTER_TEMPLATE[cat]) {
      newSettings[cat].fields[field] = true;
    }
  }

  await prisma.systemSetting.update({
    where: { key: 'PRODUCTION_DISPLAY_TERMS' },
    data: { value: newSettings }
  });
  console.log('Done');
  await prisma.$disconnect();
}
forceSave();
