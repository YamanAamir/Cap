const { extractOrderField } = require('./src/utils/helpers.js');

const order = {
  orderNumber: "29-6",
  customerEmail: "test@example.com",
  orderDate: new Date(),
  selectedOptions: {
    "KOKARDE": {
      "Emblem": "Sølv",
      "Kokarde": "Prestige",
      "Roset farve": "Sort",
      "Type": "Nova"
    },
    "UDDANNELSESBÅND": {
      "Broderi farve": "Sølv",
      "Broderi foran": "Ahad 1",
      "Hagerem": "Shiny",
      "Huebånd": "STX",
      "Knap farve": "Sølv",
      "Materiale": "SATIN",
      "år": "2026"
    },
    "BRODERI": {
      "Broderifarve": "Sølv",
      "Navne broderi": "Ahad 2",
      "Skolebroderi": "Ahad 3",
      "Skolebroderi farve": "Guld",
      "Top broderi": "Top broderi 4"
    },
    "BETRÆK": {
      "Farve": "Sort",
      "Kantbånd": "Sort",
      "Stjerner": "3",
      "Topkant": "Sølv",
      "Flagbånd": "Usa-Kina-Danmark"
    },
    "SKYGGE": {
      "Materiale": "Med kant",
      "Skyggebånd": "Guld",
      "Skyggegravering Line 1": "Ahad 4",
      "Skyggegravering Line 2": "Ahad 5",
      "Skyggegravering Line 3": "Ahad 6",
      "Type": "Shiny"
    },
    "FOER": {
      "Farve": "Vegansk",
      "Foer": "Polyester",
      "Sløjfe": "Sort",
      "Svederem": "Kunstlæder"
    },
    "EKSTRABETRÆK": {
      "Tilvælg": "Fravalgt"
    },
    "TILBEHØR": {
      "Bucketpins": "Ja",
      "Ekstra korkarde": "Fravalgt",
      "Flag 1": "Danmark",
      "Fløjte": "Ja"
    },
    "STØRRELSE": {
      "Vælg størrelse": "56"
    }
  }
};

const fields = [
  'options.STØRRELSE.Vælg størrelse',
  'options.KOKARDE.Roset farve',
  'options.KOKARDE.Type',
  'options.BRODERI.Navne broderi',
  'options.SKYGGE.Skyggebånd'
];

fields.forEach(f => {
  console.log(f, '=>', extractOrderField(order, f));
});
