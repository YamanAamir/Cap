const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROGRAM_LIST = [
  "STX", "HHX", "HTX", "HF", "EUD", "EUX",
  "sosuassistent", "sosuhjælper", "frisør", "kosmetolog", "pædagog", "pau", "ernæringsassisten", "STU", "Landmand"
];

// List of custom country flags (Israel explicitly excluded)
const FLAG_NAMES = [
  "Danmark",
  "Sverige",
  "Norge",
  "Finland",
  "Island",
  "Færøerne",
  "Grønland",
  "Tyskland",
  "Frankrig",
  "Storbritannien",
  "Spanien",
  "Italien",
  "Holland",
  "Belgien",
  "Schweiz",
  "Østrig",
  "Portugal",
  "Polen",
  "Tjekkiet",
  "Ungarn",
  "Grækenland",
  "Tyrkiet",
  "Kroatien",
  "Serbien",
  "Bosnien-Hercegovina",
  "Albanien",
  "Nordmakedonien",
  "Kosovo",
  "Montenegro",
  "Slovakiet",
  "Slovenien",
  "Bulgarien",
  "Rumænien",
  "Ukraine",
  "Hviderusland",
  "Estland",
  "Letland",
  "Litauen",
  "Irland",
  "Skotland",
  "Wales",
  "Cypern",
  "Malta",
  "Moldavien",
  "Luxembourg",
  "Monaco",
  "San Marino",
  "Andorra",
  "Liechtenstein",
  "USA",
  "Canada",
  "Mexico",
  "Brasilien",
  "Argentina",
  "Colombia",
  "Chile",
  "Peru",
  "Venezuela",
  "Ecuador",
  "Bolivia",
  "Paraguay",
  "Uruguay",
  "Cuba",
  "Jamaica",
  "Dominikanske Republik",
  "Haiti",
  "Puerto Rico",
  "Costa Rica",
  "Panama",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Bahamas",
  "Barbados",
  "Trinidad og Tobago",
  "Palæstina",
  "Irak",
  "Iran",
  "Kurdistan",
  "Libanon",
  "Syrien",
  "Jordan",
  "Saudi-Arabien",
  "Forenede Arabiske Emirater",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jemen",
  "Pakistan",
  "Indien",
  "Bangladesh",
  "Sri Lanka",
  "Nepal",
  "Afghanistan",
  "Kina",
  "Japan",
  "Sydkorea",
  "Vietnam",
  "Thailand",
  "Indonesien",
  "Malaysia",
  "Filippinerne",
  "Singapore",
  "Taiwan",
  "Cambodja",
  "Laos",
  "Myanmar",
  "Mongoliet",
  "Kasakhstan",
  "Usbekistan",
  "Turkmenistan",
  "Kirgisistan",
  "Tadsjikistan",
  "Egypten",
  "Marokko",
  "Algeriet",
  "Tunesien",
  "Libyen",
  "Sudan",
  "Somalia",
  "Somaliland",
  "Etiopien",
  "Eritrea",
  "Djibouti",
  "Kenya",
  "Nigeria",
  "Ghana",
  "Senegal",
  "Cameroun",
  "Elfenbenskysten",
  "Sydafrika",
  "Angola",
  "Mozambique",
  "Zimbabwe",
  "Zambia",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "DR Congo",
  "Mali",
  "Guinea",
  "Gambia",
  "Sierra Leone",
  "Liberia",
  "Togo",
  "Benin",
  "Burkina Faso",
  "Niger",
  "Tchad",
  "Mauritius",
  "Madagaskar",
  "Australien",
  "New Zealand",
  "Fiji",
  "Papua Ny Guinea",
  "Samoa"
];

const FLAG_PRICE = 39;

async function seedFlags() {
  console.log('🌱 Starting Custom Flags seed...');
  console.log(`  Total Flags: ${FLAG_NAMES.length} (Israel excluded)`);
  console.log(`  Price: ${FLAG_PRICE} DKK`);

  // 1. Seed Flag table in Database
  let seededCount = 0;
  const flagDbRecords = [];

  for (let i = 0; i < FLAG_NAMES.length; i++) {
    const name = FLAG_NAMES[i];
    const flag = await prisma.flag.upsert({
      where: { name },
      update: { price: FLAG_PRICE },
      create: { name, price: FLAG_PRICE },
    });
    flagDbRecords.push({ id: flag.id || (i + 1), name: flag.name, price: flag.price });
    seededCount++;
  }
  console.log(`✅ Seeded ${seededCount} flags into Flag database table.`);

  // 2. Update configurator_settings in SystemSetting
  try {
    let settingRecord = await prisma.systemSetting.findUnique({
      where: { key: 'configurator_settings' },
    });

    let currentConfig = {};
    if (settingRecord && settingRecord.value) {
      if (typeof settingRecord.value === 'string') {
        try {
          currentConfig = JSON.parse(settingRecord.value);
        } catch (e) {
          currentConfig = {};
        }
      } else if (typeof settingRecord.value === 'object') {
        currentConfig = settingRecord.value;
      }
    }

    const programFlags = currentConfig.programFlags || {};

    // Populate for ALL programs
    PROGRAM_LIST.forEach((prog) => {
      programFlags[prog] = flagDbRecords.map((f, idx) => ({
        id: f.id || (idx + 1),
        name: f.name,
        price: f.price,
      }));
    });

    currentConfig.programFlags = programFlags;
    const serializedConfig = JSON.stringify(currentConfig);

    await prisma.systemSetting.upsert({
      where: { key: 'configurator_settings' },
      update: { value: serializedConfig },
      create: { key: 'configurator_settings', value: serializedConfig },
    });

    console.log(`✅ Successfully updated configurator_settings for all ${PROGRAM_LIST.length} programs with ${FLAG_NAMES.length} custom flags.`);
  } catch (error) {
    console.error('❌ Error updating configurator_settings SystemSetting:', error);
  }

  console.log('🎉 Custom Flags Seeding completed!');
}

if (require.main === module) {
  seedFlags()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedFlags, FLAG_NAMES, FLAG_PRICE };
