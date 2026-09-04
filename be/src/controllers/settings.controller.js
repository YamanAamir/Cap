const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROGRAM_LIST = [
  "STX", "HHX", "HTX", "HF", "EUD", "EUX",
  "sosuassistent", "sosuhjælper", "frisør", "kosmetolog", "pædagog", "pau", "ernæringsassisten", "STU", "Landmand"
];

const DEFAULT_CONFIG = {
  "programsVisibility": PROGRAM_LIST.reduce((acc, p) => ({ ...acc, [p]: true }), {}),
  expressDelivery: PROGRAM_LIST.reduce((acc, p) => ({ ...acc, [p]: { active: true, price: 250 } }), {}),
  "deliveryCharges": PROGRAM_LIST.reduce((acc, p) => ({ ...acc, [p]: { "Denmark": 79, "Grønland": 348 } }), {}),
  "basePrices": PROGRAM_LIST.reduce((acc, p) => {
    const hasSurcharge = ["STX", "HF", "HHX", "HTX"].includes(p);
    const hasPremium = ["STX", "HF", "HHX", "HTX", "EUD", "EUX"].includes(p);
    const prices = {
      "basichue": 179,
      "standard": 449,
      "luksus": hasSurcharge ? 1595 : 995
    };
    if (hasPremium) {
      prices["premium"] = hasSurcharge ? 2450 : 1850;
    }
    return {
      ...acc,
      [p]: prices
    };
  }, {}),
  "priceConfig": {
    "standard": {
      "KOKARDE": {
        "Roset farve": {
          "#7F1D1D": 0,
          "#1E3A8A": 39,
          "#DC2626": 39,
          "PSort": 0,
          "SosuSort": 0,
          "EuxRed": 0,
          "Rød": 39
        },
        "Kokarde": {
          "Signature": 0,
          "Prestige": 0,
          "Stjernetegn": 0,
          "Flag": 0
        },
        "Emblem": {
          "Guld": 0,
          "Sølv": 0
        },
        "Type": {
          "Kurdistan": 0,
          "Irak": 0,
          "Iran": 0,
          "Somalia": 0,
          "Somaliland": 0,
          "Palæstina": 0,
          "Libanon": 0,
          "Afghanistan": 0,
          "Albanien": 0,
          "Serbien": 0,
          "Bosnien": 0,
          "Danmark": 0,
          "Grønland": 0,
          "Marokko": 0,
          "Pakistan": 0,
          "Tyrkiet": 0,
          "Ahornblad Guld": 0,
          "Anker Guld": 0,
          "Atom Guld": 0,
          "DNA Guld": 0,
          "Globus Guld": 0,
          "Hjerte Guld": 0,
          "Halvmåne Guld Simli": 69,
          "UDEN_STEN Guld Simli Guld": 69,
          "Halvmåne Guld": 0,
          "UDEN_STEN Guld Guld": 0,
          "IT Guld": 0,
          "Lotus Guld": 0,
          "Merkurstav Guld Simli": 69,
          "Merkurstav Guld": 0,
          "Node Guld": 0,
          "Pi Guld": 0,
          "Sport Guld": 0,
          "Teater Guld": 0,
          "Twin Guld": 0,
          "STX New Guld Simli Guld": 69,
          "STX New Guld Guld": 0,
          "HTX New Guld Simli Guld": 69,
          "HTX New Guld Guld": 0,
          "HHX New Guld Simli Guld": 69,
          "HHX New Guld Guld": 0,
          "HF New Guld Simli Guld": 69,
          "HF New Guld Guld": 0,
          "HHX Guld Simli": 69,
          "HHX Guld": 0,
          "Atom HTX Guld": 0,
          "HTX Guld Simli": 69,
          "HTX Guld": 0,
          "STX Guld Simli": 69,
          "STX Guld": 0,
          "EUD Guld": 0,
          "EUX Guld Simli": 69,
          "EUX Guld": 0,
          "HF Guld Simli": 69,
            "GUX Guld Simli": 69,
          "HF Guld": 0,
            "GUX Guld": 0,
          "STU Guld Simli": 69,
          "STU Guld": 0,
          "Ahornblad Sølv": 0,
          "Anker Sølv": 0,
          "Atom Sølv": 0,
          "DNA Sølv": 0,
          "Globus Sølv": 0,
          "Hjerte Sølv": 0,
          "Halvmåne Sølv Simli": 69,
          "UDEN_STEN Sølv Simli Sølv": 69,
          "Halvmåne Sølv": 0,
          "UDEN_STEN Sølv Sølv": 0,
          "IT Sølv": 0,
          "Lotus Sølv": 0,
          "Merkurstav Sølv Simli": 69,
          "Merkurstav Sølv": 0,
          "Node Sølv": 0,
          "Pi Sølv": 0,
          "Sport Sølv": 0,
          "Teater Sølv": 0,
          "Twin Sølv": 0,
          "STX New Sølv Simli Sølv": 69,
          "STX New Sølv Sølv": 0,
          "HTX New Sølv Simli Sølv": 69,
          "HTX New Sølv Sølv": 0,
          "HHX New Sølv Simli Sølv": 69,
          "HHX New Sølv Sølv": 0,
          "HF New Sølv Simli Sølv": 69,
          "HF New Sølv Sølv": 0,
          "HHX Sølv Simli": 69,
          "HHX Sølv": 0,
          "Atom HTX Sølv": 0,
          "HTX Sølv Simli": 69,
          "HTX Sølv": 0,
          "STX Sølv": 0,
          "STX Sølv Simli": 69,
          "EUD Sølv": 0,
          "EUX Sølv Simli": 69,
          "EUX Sølv": 0,
          "HF Sølv Simli": 69,
            "GUX Sølv Simli": 69,
          "HF Sølv": 0,
            "GUX Sølv": 0,
          "STU Sølv Simli": 69,
          "STU Sølv": 0,
          "traktor Guld": 0,
          "traktor Sølv": 0,
          "Diamant": 89,
          "Onyx": 89,
          "Perle": 89,
          "Nova": 89,
          "Safir": 89,
          "Jupiter Simli": 89,
          "Tyr Guld": 89,
          "IB Guld": 0,
          "F Key Guld": 0,
          "Fisk Guld": 89,
          "Jomfru Guld": 89,
          "Krebs Guld": 89,
          "Løve Guld": 89,
          "Skorpion Guld": 89,
          "Skytte Guld": 89,
          "Vandmand Guld": 89,
          "Vædder Guld": 89,
          "Vægt Guld": 89,
          "Stenbuk Guld": 89,
          "Tvilling Guld": 89,
          "Tyr Sølv": 89,
          "IB Sølv": 0,
          "F Key Sølv": 0,
          "Fisk Sølv": 89,
          "Jomfru Sølv": 89,
          "Krebs Sølv": 89,
          "Løve Sølv": 89,
          "Skorpion Sølv": 89,
          "Skytte Sølv": 89,
          "Vandmand Sølv": 89,
          "Vædder Sølv": 89,
          "Vægt Sølv": 89,
          "Stenbuk Sølv": 89,
          "Tvilling Sølv": 89
        }
      },
      "UDDANNELSESBÅND": {
        "Huebånd": {
          "EUX": 0,
          "STU": 0,
          "Grøn": 0,
          "Sort": 0
        },
        "Materiale": {
          "BOMULD": 0,
          "SATIN": 0,
          "VELOUR": 239,
          "GLIMMER": 239,
          "SHIMMER": 0
        },
        "Hagerem": {
          "Mat": 0,
          "Shiny": 0,
          "Sort med sorteknuder": 69,
          "Guld hagerem med guld knuder": 69,
          "Sort hagerem med guld knuder": 69,
          "Guld hagerem med sort knuder": 69,
          "Sølv hagerem med sølvknuder": 69,
          "Sølv hagerem med sort knuder": 69,
          "Sort hagerem med sølv knuder": 69
        },
        "Broderi farve": {
          "Guld": 0,
          "Sølv": 0,
          "EUX": 0,
          "Hvid": 0,
          "Sort": 0
        },
        "Knap farve": {
          "Guld": 0,
          "Sølv": 0
        },
        "Broderi foran": {
          "base": 99,
          "perChar": 0
        }
      },
      "BRODERI": {
        "Top broderi": {
          "Ingen": 0,
          "Top broderi 1": 149,
          "Top broderi 2": 149,
          "Top broderi 3": 149,
          "Top broderi 4": 149
        },
        "Broderifarve": {
          "Guld": 0,
          "Sølv": 0,
          "STX": 0,
          "WHITE": 0,
          "BLACK": 0
        },
        "Navne broderi": {
          "base": 99,
          "perChar": 0
        },
        "Skolebroderi farve": {
          "Hvid": 0,
          "Sort": 0,
          "Guld": 0,
          "Sølv": 0
        },
        "Skolebroderi": {
          "base": 99,
          "perChar": 0
        }
      },
      "BETRÆK": {
        "Farve": {
          "Hvid": 0,
          "Sort": 0,
          "Hvid med glimmer": 79,
          "Sort med glimmer": 79
        },
        "Kantbånd": {
          "NONE": 0,
          "HTX": 29,
          "STX": 29,
          "HHX": 29,
          "HF": 29,
          "EUD": 29,
          "EUX": 29,
          "Sort": 29,
          "Hvid": 29,
          "Purple": 29,
          "Green": 29,
          "Yellow": 29,
          "Pink": 29,
          "Royal Blue": 29,
          "Bordeaux": 29
        },
        "Topkant": {
          "NONE": 0,
          "Guld": 29,
          "Sølv": 29
        },
        "Flagbånd": {
          "International": 59,
          "Frankrig-Spanien-Tyskland-UK-Danmark": 59,
          "Usa-Kina-Danmark": 59
        },
        "Stjerner": {
          "1": 39,
          "2": 39,
          "3": 39,
          "4": 39,
          "5": 39,
          "6": 39,
          "NONE": 0
        }
      },
      "SKYGGE": {
        "Type": {
          "Mat": 0,
          "Shiny": 39,
          "Glimmer": 39,
          "Shimmer": 39
        },
        "Materiale": {
          "Uden kant": 0,
          "Med kant": 0
        },
        "Skyggebånd": {
          "INGEN": 0,
          "Guld": 29,
          "Glitter": 0,
          "Sølv": 29
        },
        "Skyggegravering Line 1": {
          "base": 99,
          "perChar": 0
        },
        "Skyggegravering Line 2": {
          "base": 0,
          "perChar": 0
        },
        "Skyggegravering Line 3": {
          "base": 0,
          "perChar": 0
        }
      },
      "FOER": {
        "Svederem": {
          "Læder": 0,
          "Kunstlæder": 29,
          "Ruskin": 29,
          "Alcantra": 29
        },
        "Farve": {
          "Hvid": 0,
          "Sort": 0,
          "Cognac": 0,
          "black": 0
        },
        "Sløjfe": {
          "Hvid": 0,
          "Sort": 0,
          "Guld": 29,
          "Sølv": 29
        },
        "Foer": {
          "Viskose": 29,
          "Polyester": 0,
          "Satin": 0,
          "Silke": 0
        },
        "Type": {
          "Hvid": 29,
          "Brown": 29,
          "Bordeaux": 0,
          "Champagne": 29,
          "Rosa": 29
        }
      },
      "EKSTRABETRÆK": {
        "Tilvælg": {
          "Yes": 0,
          "No": 0
        },
        "Farve": {
          "Hvid": 69,
          "Sort": 69,
          "Hvid med glimmer": 79,
          "Sort med glimmer": 79
        },
        "Kantbånd": {
          "NONE": 0,
          "HTX": 29,
          "STX": 29,
          "HHX": 29,
          "HF": 29,
          "EUD": 29,
          "EUX": 29,
          "Sort": 29,
          "Hvid": 29,
          "Purple": 29,
          "Green": 29,
          "Yellow": 29,
          "Pink": 29,
          "Royal Blue": 29,
          "Bordeaux": 29
        },
        "Topkant": {
          "NONE": 0,
          "Guld": 29,
          "Sølv": 29
        },
        "Flagbånd": {
          "International": 59,
          "Frankrig-Spanien-Tyskland-UK-Danmark": 59,
          "Usa-Kina-Danmark": 59
        },
        "Stjerner": {
          "1": 39,
          "2": 39,
          "3": 39,
          "4": 39,
          "5": 39,
          "6": 39,
          "NONE": 0
        },
        "Roset farve": {
          "#7F1D1D": 0,
          "#1E3A8A": 39,
          "#DC2626": 39,
          "PSort": 0,
          "SosuSort": 0,
          "EuxRed": 0
        },
        "Kokarde": {
          "Signature": 0,
          "Prestige": 0,
          "Stjernetegn": 0,
          "Flag": 0
        },
        "Emblem": {
          "Guld": 0,
          "Sølv": 0
        },
        "Type": {
          "HHX Guld Simli": 69,
          "HTX Guld Simli": 69,
          "STX Guld Simli": 69,
          "EUX Guld Simli": 69,
          "HF Guld Simli": 69,
            "GUX Guld Simli": 69,
          "HHX Sølv Simli": 69,
          "HTX Sølv Simli": 69,
          "STX Sølv Simli": 69,
          "EUX Sølv Simli": 69,
          "HF Sølv Simli": 69,
            "GUX Sølv Simli": 69,
          "Halvmåne Guld Simli": 69,
          "UDEN_STEN Guld Simli Guld": 69,
          "Merkurstav Guld Simli": 69,
          "STX New Guld Simli Guld": 69,
          "HTX New Guld Simli Guld": 69,
          "HHX New Guld Simli Guld": 69,
          "HF New Guld Simli Guld": 69,
          "Halvmåne Sølv Simli": 69,
          "UDEN_STEN Sølv Simli Sølv": 69,
          "Merkurstav Sølv Simli": 69,
          "STX New Sølv Simli Sølv": 69,
          "HTX New Sølv Simli Sølv": 69,
          "HHX New Sølv Simli Sølv": 69,
          "HF New Sølv Simli Sølv": 69,
          "Diamant": 89,
          "Onyx": 89,
          "Perle": 89,
          "Nova": 89,
          "Safir": 89,
          "Jupiter Simli": 89,
          "Tyr Guld": 89,
          "Fisk Guld": 89,
          "Jomfru Guld": 89,
          "Krebs Guld": 89,
          "Løve Guld": 89,
          "Skorpion Guld": 89,
          "Skytte Guld": 89,
          "Vandmand Guld": 89,
          "Vædder Guld": 89,
          "Vægt Guld": 89,
          "Stenbuk Guld": 89,
          "Tvilling Guld": 89,
          "Tyr Sølv": 89,
          "Fisk Sølv": 89,
          "Jomfru Sølv": 89,
          "Krebs Sølv": 89,
          "Løve Sølv": 89,
          "Skorpion Sølv": 89,
          "Skytte Sølv": 89,
          "Vandmand Sølv": 89,
          "Vædder Sølv": 89,
          "Vægt Sølv": 89,
          "Stenbuk Sølv": 89,
          "Tvilling Sølv": 89
        }
      },
      "TILBEHØR": {
        "Hueæske": {
          "Standard": 0,
          "Premium æske": 299,
          "Luksus æske": 199
        },
        "Huekuglepen": {
          "Yes": 29,
          "No": 0
        },
        "Silkepude": {
          "Yes": 39,
          "No": 0
        },
        "Ekstra korkarde": {
          "Yes": 99,
          "No": 0
        },
        "Lille Flag": {
          "Yes": 49,
          "No": 0
        },
        "Handsker": {
          "Yes": 39,
          "No": 0
        },
        "Store kuglepen": {
          "Yes": 39,
          "No": 0
        },
        "Smart Tag": {
          "Yes": 99,
          "No": 0
        },
        "Lyskugle": {
          "Yes": 25,
          "No": 0
        },
        "Luksus champagneglas": {
          "Yes": 100,
          "No": 0
        },
        "Fløjte": {
          "Yes": 29,
          "No": 0
        },
        "Trompet": {
          "Yes": 29,
          "No": 0
        },
        "Bucketpins": {
          "Yes": 99,
          "No": 0
        }
      },
      "STØRRELSE": {
        "Vælg størrelse": {
          "base": 0,
          "perMM": 0
        },
        "Millimeter tilpasningssæt": {
          "Yes": 39,
          "No": 0
        }
      }
    },
    "basichue": {
      "KOKARDE": {
        "Roset farve": { "#7F1D1D": 0, "#1E3A8A": 0, "#DC2626": 0, "PSort": 0, "SosuSort": 0, "EuxRed": 0, "Rød": 0 },
        "Kokarde": { "Signature": 0, "Prestige": 0, "Stjernetegn": 0, "Flag": 0 },
        "Emblem": { "Guld": 0, "Sølv": 0 },
        "Type": {
          "Kurdistan": 0,
          "Irak": 0,
          "Iran": 0,
          "Somalia": 0,
          "Somaliland": 0,
          "Palæstina": 0,
          "Libanon": 0,
          "Afghanistan": 0,
          "Albanien": 0,
          "Serbien": 0,
          "Bosnien": 0,
          "Danmark": 0,
          "Grønland": 0,
          "Marokko": 0,
          "Pakistan": 0,
          "Tyrkiet": 0,
          "Ahornblad Guld": 0,
          "Anker Guld": 0,
          "Atom Guld": 0,
          "DNA Guld": 0,
          "Globus Guld": 0,
          "Hjerte Guld": 0,
          "Halvmåne Guld Simli": 69,
          "UDEN_STEN Guld Simli Guld": 69,
          "Halvmåne Guld": 0,
          "UDEN_STEN Guld Guld": 0,
          "IT Guld": 0,
          "Lotus Guld": 0,
          "Merkurstav Guld Simli": 69,
          "Merkurstav Guld": 0,
          "Node Guld": 0,
          "Pi Guld": 0,
          "Sport Guld": 0,
          "Teater Guld": 0,
          "Twin Guld": 0,
          "STX New Guld Simli Guld": 69,
          "STX New Guld Guld": 0,
          "HTX New Guld Simli Guld": 69,
          "HTX New Guld Guld": 0,
          "HHX New Guld Simli Guld": 69,
          "HHX New Guld Guld": 0,
          "HF New Guld Simli Guld": 69,
          "HF New Guld Guld": 0,
          "HHX Guld Simli": 69,
          "HHX Guld": 0,
          "Atom HTX Guld": 0,
          "HTX Guld Simli": 69,
          "HTX Guld": 0,
          "STX Guld Simli": 69,
          "STX Guld": 0,
          "EUD Guld": 0,
          "EUX Guld Simli": 69,
          "EUX Guld": 0,
          "HF Guld Simli": 69,
          "GUX Guld Simli": 69,
          "HF Guld": 0,
          "GUX Guld": 0,
          "STU Guld Simli": 69,
          "STU Guld": 0,
          "Ahornblad Sølv": 0,
          "Anker Sølv": 0,
          "Atom Sølv": 0,
          "DNA Sølv": 0,
          "Globus Sølv": 0,
          "Hjerte Sølv": 0,
          "Halvmåne Sølv Simli": 69,
          "UDEN_STEN Sølv Simli Sølv": 69,
          "Halvmåne Sølv": 0,
          "UDEN_STEN Sølv Sølv": 0,
          "IT Sølv": 0,
          "Lotus Sølv": 0,
          "Merkurstav Sølv Simli": 69,
          "Merkurstav Sølv": 0,
          "Node Sølv": 0,
          "Pi Sølv": 0,
          "Sport Sølv": 0,
          "Teater Sølv": 0,
          "Twin Sølv": 0,
          "STX New Sølv Simli Sølv": 69,
          "STX New Sølv Sølv": 0,
          "HTX New Sølv Simli Sølv": 69,
          "HTX New Sølv Sølv": 0,
          "HHX New Sølv Simli Sølv": 69,
          "HHX New Sølv Sølv": 0,
          "HF New Sølv Simli Sølv": 69,
          "HF New Sølv Sølv": 0,
          "HHX Sølv Simli": 69,
          "HHX Sølv": 0,
          "Atom HTX Sølv": 0,
          "HTX Sølv Simli": 69,
          "HTX Sølv": 0,
          "STX Sølv": 0,
          "STX Sølv Simli": 69,
          "EUD Sølv": 0,
          "EUX Sølv Simli": 69,
          "EUX Sølv": 0,
          "HF Sølv Simli": 69,
          "GUX Sølv Simli": 69,
          "HF Sølv": 0,
          "GUX Sølv": 0,
          "STU Sølv Simli": 69,
          "STU Sølv": 0,
          "traktor Guld": 0,
          "traktor Sølv": 0,
          "Diamant": 89,
          "Onyx": 89,
          "Perle": 89,
          "Nova": 89,
          "Safir": 89,
          "Jupiter Simli": 89,
          "Tyr Guld": 89,
          "IB Guld": 0,
          "F Key Guld": 0,
          "Fisk Guld": 89,
          "Jomfru Guld": 89,
          "Krebs Guld": 89,
          "Løve Guld": 89,
          "Skorpion Guld": 89,
          "Skytte Guld": 89,
          "Vandmand Guld": 89,
          "Vædder Guld": 89,
          "Vægt Guld": 89,
          "Stenbuk Guld": 89,
          "Tvilling Guld": 89,
          "Tyr Sølv": 89,
          "IB Sølv": 0,
          "F Key Sølv": 0,
          "Fisk Sølv": 89,
          "Jomfru Sølv": 89,
          "Krebs Sølv": 89,
          "Løve Sølv": 89,
          "Skorpion Sølv": 89,
          "Skytte Sølv": 89,
          "Vandmand Sølv": 89,
          "Vædder Sølv": 89,
          "Vægt Sølv": 89,
          "Stenbuk Sølv": 89,
          "Tvilling Sølv": 89
        }
      },
      "UDDANNELSESBÅND": {
        "Huebånd": { "EUX": 0, "STU": 0, "Grøn": 0, "Sort": 0 },
        "Materiale": { "BOMULD": 0 },
        "Hagerem": { "Mat": 0 },
        "Broderi farve": { "Guld": 0, "Sølv": 0, "EUX": 0, "Hvid": 0, "Sort": 0 },
        "Knap farve": { "Guld": 0, "Sølv": 0 },
        "Broderi foran": { "base": 99, "perChar": 0 }
      },
      "BRODERI": {
        "Broderifarve": { "Guld": 0, "Sølv": 0, "STX": 0, "WHITE": 0, "BLACK": 0 },
        "Navne broderi": { "base": 99, "perChar": 0 },
        "Skolebroderi farve": { "Hvid": 0, "Sort": 0, "Guld": 0, "Sølv": 0 },
        "Skolebroderi": { "base": 99, "perChar": 0 }
      },
      "BETRÆK": {
        "Farve": { "Hvid": 0 }
      },
      "SKYGGE": {
        "Type": { "Mat": 0 },
        "Materiale": { "Uden kant": 0 },
        "Skyggebånd": { "INGEN": 0 }
      },
      "FOER": {
        "Svederem": { "Kunstlæder": 0 },
        "Farve": { "Hvid": 0, "Sort": 0 },
        "Sløjfe": { "Hvid": 0, "Sort": 0 },
        "Foer": { "Polyester": 0 }
      },
      "EKSTRABETRÆK": {
        "Tilvælg": { "Yes": 0, "No": 0 },
        "Farve": { "Hvid": 0 }
      },
      "TILBEHØR": {
        "Hueæske": { "Standard": 0 },
        "Huekuglepen": { "Yes": 29, "No": 0 },
        "Silkepude": { "Yes": 39, "No": 0 },
        "Ekstra korkarde": { "Yes": 99, "No": 0 },
        "Lille Flag": { "Yes": 49, "No": 0 },
        "Handsker": { "Yes": 39, "No": 0 },
        "Store kuglepen": { "Yes": 39, "No": 0 },
        "Smart Tag": { "Yes": 99, "No": 0 },
        "Lyskugle": { "Yes": 25, "No": 0 },
        "Luksus champagneglas": { "Yes": 100, "No": 0 },
        "Fløjte": { "Yes": 29, "No": 0 },
        "Trompet": { "Yes": 29, "No": 0 },
        "Bucketpins": { "Yes": 99, "No": 0 }
      },
      "STØRRELSE": {
        "Vælg størrelse": { "base": 0, "perMM": 0 },
        "Millimeter tilpasningssæt": { "Yes": 39, "No": 0 }
      }
    },
    "luksus": {
      "KOKARDE": {
        "Roset farve": {
          "#7F1D1D": 0,
          "#7F1D1DD": 39,
          "#7F1D1DX": 39,
          "#1E3A8A": 39,
          "#DC2626": 39,
          "PSort": 0,
          "SosuSort": 0,
          "EuxRed": 0,
          "Rød": 39
        },
        "Kokarde": {
          "Signature": 0,
          "Prestige": 0,
          "Stjernetegn": 0,
          "Flag": 0
        },
        "Emblem": {
          "Guld": 0,
          "Sølv": 0
        },
        "Type": {
          "Kurdistan": 0,
          "Irak": 0,
          "Iran": 0,
          "Somalia": 0,
          "Somaliland": 0,
          "Palæstina": 0,
          "Libanon": 0,
          "Afghanistan": 0,
          "Albanien": 0,
          "Serbien": 0,
          "Bosnien": 0,
          "Danmark": 0,
          "Grønland": 0,
          "Marokko": 0,
          "Pakistan": 0,
          "Tyrkiet": 0,
          "Ahornblad Guld": 0,
          "Anker Guld": 0,
          "Atom Guld": 0,
          "DNA Guld": 0,
          "Globus Guld": 0,
          "Hjerte Guld": 0,
          "Halvmåne Guld Simli": 69,
          "UDEN_STEN Guld Simli Guld": 69,
          "Halvmåne Guld": 0,
          "UDEN_STEN Guld Guld": 0,
          "IT Guld": 0,
          "Lotus Guld": 0,
          "Merkurstav Guld Simli": 69,
          "Merkurstav Guld": 0,
          "Node Guld": 0,
          "Pi Guld": 0,
          "Sport Guld": 0,
          "Teater Guld": 0,
          "Twin Guld": 0,
          "STX New Guld Simli Guld": 69,
          "STX New Guld Guld": 0,
          "HTX New Guld Simli Guld": 69,
          "HTX New Guld Guld": 0,
          "HHX New Guld Simli Guld": 69,
          "HHX New Guld Guld": 0,
          "HF New Guld Simli Guld": 69,
          "HF New Guld Guld": 0,
          "HHX Guld Simli": 69,
          "HHX Guld": 0,
          "Atom HTX Guld": 0,
          "HTX Guld Simli": 69,
          "HTX Guld": 0,
          "STX Guld Simli": 69,
          "STX Guld": 0,
          "EUD Guld": 0,
          "EUX Guld Simli": 69,
          "EUX Guld": 0,
          "HF Guld Simli": 69,
            "GUX Guld Simli": 69,
          "HF Guld": 0,
            "GUX Guld": 0,
          "STU Guld Simli": 69,
          "STU Guld": 0,
          "Ahornblad Sølv": 0,
          "Anker Sølv": 0,
          "Atom Sølv": 0,
          "DNA Sølv": 0,
          "Globus Sølv": 0,
          "Hjerte Sølv": 0,
          "Halvmåne Sølv Simli": 69,
          "UDEN_STEN Sølv Simli Sølv": 69,
          "Halvmåne Sølv": 0,
          "UDEN_STEN Sølv Sølv": 0,
          "IT Sølv": 0,
          "Lotus Sølv": 0,
          "Merkurstav Sølv Simli": 69,
          "Merkurstav Sølv": 0,
          "Node Sølv": 0,
          "Pi Sølv": 0,
          "Sport Sølv": 0,
          "Teater Sølv": 0,
          "Twin Sølv": 0,
          "STX New Sølv Simli Sølv": 69,
          "STX New Sølv Sølv": 0,
          "HTX New Sølv Simli Sølv": 69,
          "HTX New Sølv Sølv": 0,
          "HHX New Sølv Simli Sølv": 69,
          "HHX New Sølv Sølv": 0,
          "HF New Sølv Simli Sølv": 69,
          "HF New Sølv Sølv": 0,
          "HHX Sølv Simli": 69,
          "HHX Sølv": 0,
          "Atom HTX Sølv": 69,
          "HTX Sølv Simli": 69,
          "HTX Sølv": 0,
          "STX Sølv": 0,
          "STX Sølv Simli": 69,
          "EUD Sølv": 0,
          "EUX Sølv Simli": 69,
          "EUX Sølv": 0,
          "HF Sølv Simli": 69,
            "GUX Sølv Simli": 69,
          "HF Sølv": 0,
            "GUX Sølv": 0,
          "STU Sølv Simli": 69,
          "STU Sølv": 0,
          "traktor Guld": 0,
          "traktor Sølv": 0,
          "Diamant": 89,
          "Onyx": 89,
          "Perle": 89,
          "Nova": 89,
          "Safir": 89,
          "Tyr Guld": 89,
          "IB Guld": 0,
          "F Key Guld": 0,
          "Fisk Guld": 89,
          "Jomfru Guld": 89,
          "Krebs Guld": 89,
          "Løve Guld": 89,
          "Skorpion Guld": 89,
          "Skytte Guld": 89,
          "Vandmand Guld": 89,
          "Vædder Guld": 89,
          "Vægt Guld": 89,
          "Stenbuk Guld": 89,
          "Tvilling Guld": 89,
          "Tyr Sølv": 89,
          "IB Sølv": 0,
          "F Key Sølv": 0,
          "Fisk Sølv": 89,
          "Jomfru Sølv": 89,
          "Krebs Sølv": 89,
          "Løve Sølv": 89,
          "Skorpion Sølv": 89,
          "Skytte Sølv": 89,
          "Vandmand Sølv": 89,
          "Vædder Sølv": 89,
          "Vægt Sølv": 89,
          "Stenbuk Sølv": 89,
          "Tvilling Sølv": 89
        }
      },
      "UDDANNELSESBÅND": {
        "Huebånd": {
          "EUX": 0,
          "STU": 0,
          "Grøn": 0,
          "Sort": 0
        },
        "Materiale": {
          "BOMULD": 0,
          "VELOUR": 0,
          "SATIN": 0,
          "GLIMMER": 99,
          "SHIMMER": 99
        },
        "Hagerem": {
          "Mat": 0,
          "Shiny": 0,
          "Sort med sorteknuder": 0,
          "Guld hagerem med guld knuder": 0,
          "Sort hagerem med guld knuder": 0,
          "Sølv hagerem med sølvknuder": 0,
          "Sølv hagerem med sort knuder": 0
        },
        "Broderi farve": {
          "Guld": 0,
          "Sølv": 0,
          "EUX": 0,
          "Hvid": 0,
          "Sort": 0
        },
        "Knap farve": {
          "Guld": 0,
          "Sølv": 0
        },
        "Broderi foran": {
          "base": 0,
          "perChar": 0
        }
      },
      "BRODERI": {
        "Top broderi": {
          "Ingen": 0,
          "Top broderi 1": 0,
          "Top broderi 2": 0,
          "Top broderi 3": 0,
          "Top broderi 4": 0
        },
        "Broderifarve": {
          "Guld": 0,
          "Sølv": 0,
          "STX": 0,
          "WHITE": 0,
          "BLACK": 0
        },
        "Navne broderi": {
          "base": 0,
          "perChar": 0
        },
        "Skolebroderi farve": {
          "Hvid": 0,
          "Sort": 0,
          "Guld": 0,
          "Sølv": 0
        },
        "Skolebroderi": {
          "base": 0,
          "perChar": 0
        }
      },
      "BETRÆK": {
        "Farve": {
          "Hvid": 0,
          "Sort": 0,
          "Hvid med glimmer": 79,
          "Sort med glimmer": 79
        },
        "Kantbånd": {
          "NONE": 0,
          "HTX": 29,
          "STX": 29,
          "HHX": 29,
          "HF": 29,
          "EUD": 29,
          "EUX": 29,
          "Sort": 29,
          "Hvid": 29,
          "Purple": 29,
          "Green": 29,
          "Yellow": 29,
          "Pink": 29,
          "Royal Blue": 29,
          "Bordeaux": 29
        },
        "Topkant": {
          "NONE": 0,
          "Guld": 29,
          "Sølv": 29
        },
        "Flagbånd": {
          "International": 59,
          "Frankrig-Spanien-Tyskland-UK-Danmark": 59,
          "Usa-Kina-Danmark": 59
        },
        "Stjerner": {
          "1": 39,
          "2": 39,
          "3": 39,
          "4": 39,
          "5": 39,
          "6": 39,
          "NONE": 0
        }
      },
      "SKYGGE": {
        "Type": {
          "Mat": 0,
          "Shiny": 0,
          "Glimmer": 0,
          "Shimmer": 0
        },
        "Materiale": {
          "Uden kant": 0,
          "Med kant": 0
        },
        "Skyggebånd": {
          "INGEN": 0,
          "Guld": 0,
          "Glitter": 0,
          "Sølv": 0
        },
        "Skyggegravering Line 1": {
          "base": 99,
          "perChar": 0
        },
        "Skyggegravering Line 2": {
          "base": 0,
          "perChar": 0
        },
        "Skyggegravering Line 3": {
          "base": 0,
          "perChar": 0
        }
      },
      "FOER": {
        "Svederem": {
          "Læder": 0,
          "Kunstlæder": 29,
          "Ruskin": 29,
          "Alcantra": 29
        },
        "Farve": {
          "Hvid": 0,
          "Sort": 0,
          "Cognac": 0,
          "black": 0
        },
        "Sløjfe": {
          "Hvid": 0,
          "Sort": 0,
          "Guld": 0,
          "Sølv": 0
        },
        "Foer": {
          "Viskose": 29,
          "Polyester": 0,
          "Satin": 0,
          "Silke": 0
        },
        "Type": {
          "Hvid": 0,
          "Brown": 0,
          "Bordeaux": 0,
          "Champagne": 0,
          "Rosa": 29
        }
      },
      "EKSTRABETRÆK": {
        "Tilvælg": {
          "Yes": 0,
          "No": 0
        },
        "Farve": {
          "Hvid": 69,
          "Sort": 69,
          "Hvid med glimmer": 79,
          "Sort med glimmer": 79
        },
        "Kantbånd": {
          "NONE": 0,
          "HTX": 29,
          "STX": 29,
          "HHX": 29,
          "HF": 29,
          "EUD": 29,
          "EUX": 29,
          "Sort": 29,
          "Hvid": 29,
          "Purple": 29,
          "Green": 29,
          "Yellow": 29,
          "Pink": 29
        },
        "Topkant": {
          "NONE": 0,
          "Guld": 29,
          "Sølv": 29
        },
        "Flagbånd": {
          "International": 59,
          "Frankrig-Spanien-Tyskland-UK-Danmark": 59,
          "Usa-Kina-Danmark": 59
        },
        "Stjerner": {
          "1": 39,
          "2": 39,
          "3": 39,
          "4": 39,
          "5": 39,
          "6": 39,
          "NONE": 0
        },
        "Roset farve": {
          "#7F1D1D": 0,
          "#1E3A8A": 39,
          "#DC2626": 39,
          "PSort": 0,
          "SosuSort": 0,
          "EuxRed": 0
        },
        "Kokarde": {
          "Signature": 0,
          "Prestige": 0,
          "Stjernetegn": 0,
          "Flag": 0
        },
        "Emblem": {
          "Guld": 0,
          "Sølv": 0
        },
        "Type": {
          "HHX Guld Simli": 69,
          "HTX Guld Simli": 69,
          "STX Guld Simli": 69,
          "EUX Guld Simli": 69,
          "HF Guld Simli": 69,
            "GUX Guld Simli": 69,
          "HHX Sølv Simli": 69,
          "HTX Sølv Simli": 69,
          "STX Sølv Simli": 69,
          "EUX Sølv Simli": 69,
          "HF Sølv Simli": 69,
            "GUX Sølv Simli": 69,
          "Halvmåne Guld Simli": 69,
          "UDEN_STEN Guld Simli Guld": 69,
          "Merkurstav Guld Simli": 69,
          "STX New Guld Simli Guld": 69,
          "HTX New Guld Simli Guld": 69,
          "HHX New Guld Simli Guld": 69,
          "HF New Guld Simli Guld": 69,
          "Halvmåne Sølv Simli": 69,
          "UDEN_STEN Sølv Simli Sølv": 69,
          "Merkurstav Sølv Simli": 69,
          "STX New Sølv Simli Sølv": 69,
          "HTX New Sølv Simli Sølv": 69,
          "HHX New Sølv Simli Sølv": 69,
          "HF New Sølv Simli Sølv": 69,
          "Diamant": 89,
          "Onyx": 89,
          "Perle": 89,
          "Nova": 89,
          "Safir": 89,
          "Jupiter Simli": 89,
          "Tyr Guld": 89,
          "Fisk Guld": 89,
          "Jomfru Guld": 89,
          "Krebs Guld": 89,
          "Løve Guld": 89,
          "Skorpion Guld": 89,
          "Skytte Guld": 89,
          "Vandmand Guld": 89,
          "Vædder Guld": 89,
          "Vægt Guld": 89,
          "Stenbuk Guld": 89,
          "Tvilling Guld": 89,
          "Tyr Sølv": 89,
          "Fisk Sølv": 89,
          "Jomfru Sølv": 89,
          "Krebs Sølv": 89,
          "Løve Sølv": 89,
          "Skorpion Sølv": 89,
          "Skytte Sølv": 89,
          "Vandmand Sølv": 89,
          "Vædder Sølv": 89,
          "Vægt Sølv": 89,
          "Stenbuk Sølv": 89,
          "Tvilling Sølv": 89
        }
      },
      "TILBEHØR": {
        "Hueæske": {
          "Standard": 0,
          "Premium æske": 100,
          "Luksus æske": 0
        },
        "Huekuglepen": {
          "Yes": 0,
          "No": 0
        },
        "Silkepude": {
          "Yes": 0,
          "No": 0
        },
        "Ekstra korkarde": {
          "Yes": 0,
          "No": 0
        },
        "Lille Flag": {
          "Yes": 49,
          "No": 0
        },
        "Handsker": {
          "Yes": 0,
          "No": 0
        },
        "Stor kuglepen": {
          "Yes": 39,
          "No": 0
        },
        "Smart Tag": {
          "Yes": 99,
          "No": 0
        },
        "Lyskugle": {
          "Yes": 25,
          "No": 0
        },
        "Luksus champagneglas": {
          "Yes": 0,
          "No": 0
        },
        "Fløjte": {
          "Yes": 0,
          "No": 0
        },
        "Trrompet": {
          "Yes": 29,
          "No": 0
        },
        "Bucketpins": {
          "Yes": 99,
          "No": 0
        }
      },
      "STØRRELSE": {
        "Vælg størrelse": {
          "base": 0,
          "perMM": 0
        },
        "Millimeter tilpasningssæt": {
          "Yes": 39,
          "No": 0
        }
      }
    },
    "premium": {
      "KOKARDE": {
        "Roset farve": {
          "#7F1D1D": 0,
          "#7F1D1DD": 39,
          "#7F1D1DX": 39,
          "#1E3A8A": 39,
          "#DC2626": 39,
          "PSort": 0,
          "SosuSort": 0,
          "EuxRed": 0
        },
        "Kokarde": {
          "Signature": 0,
          "Prestige": 0,
          "Stjernetegn": 0,
          "Flag": 0
        },
        "Emblem": {
          "Guld": 0,
          "Sølv": 0
        },
        "Type": {
          "Kurdistan": 0,
          "Irak": 0,
          "Iran": 0,
          "Somalia": 0,
          "Somaliland": 0,
          "Palæstina": 0,
          "Libanon": 0,
          "Afghanistan": 0,
          "Albanien": 0,
          "Serbien": 0,
          "Bosnien": 0,
          "Danmark": 0,
          "Grønland": 0,
          "Marokko": 0,
          "Pakistan": 0,
          "Tyrkiet": 0,
          "Ahornblad Guld": 0,
          "Anker Guld": 0,
          "Atom Guld": 0,
          "DNA Guld": 0,
          "Globus Guld": 0,
          "Hjerte Guld": 0,
          "Halvmåne Guld Simli": 69,
          "UDEN_STEN Guld Simli Guld": 69,
          "Halvmåne Guld": 0,
          "UDEN_STEN Guld Guld": 0,
          "IT Guld": 0,
          "Lotus Guld": 0,
          "Merkurstav Guld Simli": 69,
          "Merkurstav Guld": 0,
          "Node Guld": 0,
          "Pi Guld": 0,
          "Sport Guld": 0,
          "Teater Guld": 0,
          "Twin Guld": 0,
          "STX New Guld Simli Guld": 69,
          "STX New Guld Guld": 0,
          "HTX New Guld Simli Guld": 69,
          "HTX New Guld Guld": 0,
          "HHX New Guld Simli Guld": 69,
          "HHX New Guld Guld": 0,
          "HF New Guld Simli Guld": 69,
          "HF New Guld Guld": 0,
          "HHX Guld Simli": 69,
          "HHX Guld": 0,
          "Atom HTX Guld": 0,
          "HTX Guld Simli": 69,
          "HTX Guld": 0,
          "STX Guld Simli": 69,
          "STX Guld": 0,
          "EUD Guld": 0,
          "EUX Guld Simli": 69,
          "EUX Guld": 0,
          "HF Guld Simli": 69,
            "GUX Guld Simli": 69,
          "HF Guld": 0,
            "GUX Guld": 0,
          "Ahornblad Sølv": 0,
          "Anker Sølv": 0,
          "Atom Sølv": 0,
          "DNA Sølv": 0,
          "Globus Sølv": 0,
          "Hjerte Sølv": 0,
          "Halvmåne Sølv Simli": 69,
          "UDEN_STEN Sølv Simli Sølv": 69,
          "Halvmåne Sølv": 0,
          "UDEN_STEN Sølv Sølv": 0,
          "IT Sølv": 0,
          "Lotus Sølv": 0,
          "Merkurstav Sølv Simli": 69,
          "Merkurstav Sølv": 0,
          "Node Sølv": 0,
          "Pi Sølv": 0,
          "Sport Sølv": 0,
          "Teater Sølv": 0,
          "Twin Sølv": 0,
          "STX New Sølv Simli Sølv": 69,
          "STX New Sølv Sølv": 0,
          "HTX New Sølv Simli Sølv": 69,
          "HTX New Sølv Sølv": 0,
          "HHX New Sølv Simli Sølv": 69,
          "HHX New Sølv Sølv": 0,
          "HF New Sølv Simli Sølv": 69,
          "HF New Sølv Sølv": 0,
          "HHX Sølv Simli": 69,
          "HHX Sølv": 0,
          "Atom HTX Sølv": 69,
          "HTX Sølv Simli": 69,
          "HTX Sølv": 0,
          "STX Sølv": 0,
          "STX Sølv Simli": 69,
          "EUD Sølv": 0,
          "EUX Sølv Simli": 69,
          "EUX Sølv": 0,
          "HF Sølv Simli": 69,
            "GUX Sølv Simli": 69,
          "HF Sølv": 0,
            "GUX Sølv": 0,
          "Diamant": 89,
          "Onyx": 89,
          "Perle": 89,
          "Nova": 89,
          "Safir": 89,
          "Tyr Guld": 89,
          "IB Guld": 0,
          "F Key Guld": 0,
          "Fisk Guld": 89,
          "Jomfru Guld": 89,
          "Krebs Guld": 89,
          "Løve Guld": 89,
          "Skorpion Guld": 89,
          "Skytte Guld": 89,
          "Vandmand Guld": 89,
          "Vædder Guld": 89,
          "Vægt Guld": 89,
          "Stenbuk Guld": 89,
          "Tvilling Guld": 89,
          "Tyr Sølv": 89,
          "IB Sølv": 0,
          "F Key Sølv": 0,
          "Fisk Sølv": 89,
          "Jomfru Sølv": 89,
          "Krebs Sølv": 89,
          "Løve Sølv": 89,
          "Skorpion Sølv": 89,
          "Skytte Sølv": 89,
          "Vandmand Sølv": 89,
          "Vædder Sølv": 89,
          "Vægt Sølv": 89,
          "Stenbuk Sølv": 89,
          "Tvilling Sølv": 89
        }
      },
      "UDDANNELSESBÅND": {
        "Huebånd": {
          "EUX": 0,
          "Sort": 0
        },
        "Materiale": {
          "BOMULD": 0,
          "VELOUR": 0,
          "SATIN": 0,
          "GLIMMER": 99,
          "SHIMMER": 99
        },
        "Hagerem": {
          "Mat": 0,
          "Shiny": 0,
          "Sort med sorteknuder": 0,
          "Guld hagerem med guld knuder": 0,
          "Sort hagerem med guld knuder": 0,
          "Sølv hagerem med sølvknuder": 0,
          "Sølv hagerem med sort knuder": 0
        },
        "Broderi farve": {
          "Guld": 0,
          "Sølv": 0,
          "EUX": 0,
          "Hvid": 0,
          "Sort": 0
        },
        "Knap farve": {
          "Guld": 0,
          "Sølv": 0
        },
        "Broderi foran": {
          "base": 0,
          "perChar": 0
        }
      },
      "BRODERI": {
        "Top broderi": {
          "Ingen": 0,
          "Top broderi 1": 0,
          "Top broderi 2": 0,
          "Top broderi 3": 0,
          "Top broderi 4": 0
        },
        "Broderifarve": {
          "Guld": 0,
          "Sølv": 0,
          "STX": 0,
          "WHITE": 0,
          "BLACK": 0
        },
        "Navne broderi": {
          "base": 0,
          "perChar": 0
        },
        "Skolebroderi farve": {
          "Hvid": 0,
          "Sort": 0,
          "Guld": 0,
          "Sølv": 0
        },
        "Skolebroderi": {
          "base": 0,
          "perChar": 0
        }
      },
      "BETRÆK": {
        "Farve": {
          "Hvid": 0,
          "Sort": 0,
          "Hvid med glimmer": 79,
          "Sort med glimmer": 79
        },
        "Kantbånd": {
          "NONE": 0,
          "HTX": 29,
          "STX": 29,
          "HHX": 29,
          "HF": 29,
          "EUD": 29,
          "EUX": 29,
          "Sort": 29,
          "Hvid": 29,
          "Purple": 29,
          "Green": 29,
          "Yellow": 29,
          "Pink": 29,
          "Royal Blue": 29,
          "Bordeaux": 29
        },
        "Topkant": {
          "NONE": 0,
          "Guld": 29,
          "Sølv": 29
        },
        "Flagbånd": {
          "International": 59,
          "Frankrig-Spanien-Tyskland-UK-Danmark": 59,
          "Usa-Kina-Danmark": 59
        },
        "Stjerner": {
          "1": 39,
          "2": 39,
          "3": 39,
          "4": 39,
          "5": 39,
          "6": 39,
          "NONE": 0
        }
      },
      "SKYGGE": {
        "Type": {
          "Mat": 0,
          "Shiny": 0,
          "Glimmer": 0,
          "Shimmer": 0
        },
        "Materiale": {
          "Uden kant": 0,
          "Med kant": 0
        },
        "Skyggebånd": {
          "INGEN": 0,
          "Guld": 0,
          "Glitter": 0,
          "Sølv": 0
        },
        "Skyggegravering Line 1": {
          "base": 99,
          "perChar": 0
        },
        "Skyggegravering Line 2": {
          "base": 0,
          "perChar": 0
        },
        "Skyggegravering Line 3": {
          "base": 0,
          "perChar": 0
        }
      },
      "FOER": {
        "Svederem": {
          "Læder": 0,
          "Kunstlæder": 29,
          "Ruskin": 29,
          "Alcantra": 29
        },
        "Farve": {
          "Hvid": 0,
          "Sort": 0,
          "Cognac": 0,
          "black": 0
        },
        "Sløjfe": {
          "Hvid": 0,
          "Sort": 0,
          "Guld": 0,
          "Sølv": 0
        },
        "Foer": {
          "Viskose": 29,
          "Polyester": 0,
          "Satin": 0,
          "Silke": 0
        },
        "Type": {
          "Hvid": 0,
          "Brown": 0,
          "Bordeaux": 0,
          "Champagne": 0,
          "Rosa": 29
        }
      },
      "EKSTRABETRÆK": {
        "Tilvælg": {
          "Yes": 0,
          "No": 0
        },
        "Farve": {
          "Hvid": 69,
          "Sort": 69,
          "Hvid med glimmer": 79,
          "Sort med glimmer": 79
        },
        "Kantbånd": {
          "NONE": 0,
          "HTX": 29,
          "STX": 29,
          "HHX": 29,
          "HF": 29,
          "EUD": 29,
          "EUX": 29,
          "Sort": 29,
          "Hvid": 29,
          "Purple": 29,
          "Green": 29,
          "Yellow": 29,
          "Pink": 29
        },
        "Topkant": {
          "NONE": 0,
          "Guld": 29,
          "Sølv": 29
        },
        "Flagbånd": {
          "International": 59,
          "Frankrig-Spanien-Tyskland-UK-Danmark": 59,
          "Usa-Kina-Danmark": 59
        },
        "Stjerner": {
          "1": 39,
          "2": 39,
          "3": 39,
          "4": 39,
          "5": 39,
          "6": 39,
          "NONE": 0
        },
        "Roset farve": {
          "#7F1D1D": 0,
          "#1E3A8A": 39,
          "#DC2626": 39,
          "PSort": 0,
          "SosuSort": 0,
          "EuxRed": 0
        },
        "Kokarde": {
          "Signature": 0,
          "Prestige": 0,
          "Stjernetegn": 0,
          "Flag": 0
        },
        "Emblem": {
          "Guld": 0,
          "Sølv": 0
        },
        "Type": {
          "HHX Guld Simli": 69,
          "HTX Guld Simli": 69,
          "STX Guld Simli": 69,
          "EUX Guld Simli": 69,
          "HF Guld Simli": 69,
            "GUX Guld Simli": 69,
          "HHX Sølv Simli": 69,
          "HTX Sølv Simli": 69,
          "STX Sølv Simli": 69,
          "EUX Sølv Simli": 69,
          "HF Sølv Simli": 69,
            "GUX Sølv Simli": 69,
          "Halvmåne Guld Simli": 69,
          "UDEN_STEN Guld Simli Guld": 69,
          "Merkurstav Guld Simli": 69,
          "STX New Guld Simli Guld": 69,
          "HTX New Guld Simli Guld": 69,
          "HHX New Guld Simli Guld": 69,
          "HF New Guld Simli Guld": 69,
          "Halvmåne Sølv Simli": 69,
          "UDEN_STEN Sølv Simli Sølv": 69,
          "Merkurstav Sølv Simli": 69,
          "STX New Sølv Simli Sølv": 69,
          "HTX New Sølv Simli Sølv": 69,
          "HHX New Sølv Simli Sølv": 69,
          "HF New Sølv Simli Sølv": 69,
          "Diamant": 89,
          "Onyx": 89,
          "Perle": 89,
          "Nova": 89,
          "Safir": 89,
          "Jupiter Simli": 89,
          "Tyr Guld": 89,
          "Fisk Guld": 89,
          "Jomfru Guld": 89,
          "Krebs Guld": 89,
          "Løve Guld": 89,
          "Skorpion Guld": 89,
          "Skytte Guld": 89,
          "Vandmand Guld": 89,
          "Vædder Guld": 89,
          "Vægt Guld": 89,
          "Stenbuk Guld": 89,
          "Tvilling Guld": 89,
          "Tyr Sølv": 89,
          "Fisk Sølv": 89,
          "Jomfru Sølv": 89,
          "Krebs Sølv": 89,
          "Løve Sølv": 89,
          "Skorpion Sølv": 89,
          "Skytte Sølv": 89,
          "Vandmand Sølv": 89,
          "Vædder Sølv": 89,
          "Vægt Sølv": 89,
          "Stenbuk Sølv": 89,
          "Tvilling Sølv": 89
        }
      },
      "TILBEHØR": {
        "Hueæske": {
          "Standard": 0,
          "Premium æske": 100,
          "Luksus æske": 0
        },
        "Huekuglepen": {
          "Yes": 0,
          "No": 0
        },
        "Silkepude": {
          "Yes": 0,
          "No": 0
        },
        "Ekstra korkarde": {
          "Yes": 0,
          "No": 0
        },
        "Lille Flag": {
          "Yes": 49,
          "No": 0
        },
        "Handsker": {
          "Yes": 0,
          "No": 0
        },
        "Stor kuglepen": {
          "Yes": 39,
          "No": 0
        },
        "Smart Tag": {
          "Yes": 99,
          "No": 0
        },
        "Lyskugle": {
          "Yes": 25,
          "No": 0
        },
        "Luksus champagneglas": {
          "Yes": 0,
          "No": 0
        },
        "Fløjte": {
          "Yes": 0,
          "No": 0
        },
        "Trrompet": {
          "Yes": 29,
          "No": 0
        },
        "Bucketpins": {
          "Yes": 99,
          "No": 0
        }
      },
      "STØRRELSE": {
        "Vælg størrelse": {
          "base": 0,
          "perMM": 0
        },
        "Millimeter tilpasningssæt": {
          "Yes": 39,
          "No": 0
        }
      }
    }
  }
};;

exports.getConfiguratorSettings = async (req, res) => {
  try {
    let setting = await prisma.systemSetting.findUnique({
      where: { key: 'configurator_settings' }
    });

    // Parse the JSON string from DB, reset corrupted data
    if (setting && typeof setting.value === 'string') {
      let parsed = null;
      try {
        parsed = JSON.parse(setting.value);
      } catch (e) {
        parsed = null; // corrupted — will reset below
      }
      // If parse failed OR result is not a plain object, treat as corrupted
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        console.warn('[Settings] Corrupted configurator_settings in DB — resetting to DEFAULT_CONFIG');
        await prisma.systemSetting.update({
          where: { key: 'configurator_settings' },
          data: { value: JSON.stringify(DEFAULT_CONFIG) }
        });
        setting = { value: DEFAULT_CONFIG };
      } else {
        setting.value = parsed;
      }
    }

    if (!setting) {
      await prisma.systemSetting.create({
        data: {
          key: 'configurator_settings',
          value: JSON.stringify(DEFAULT_CONFIG)
        }
      });
      setting = { value: DEFAULT_CONFIG };
    }

    // Auto-migrate database values from budgethue/basic to basichue
    if (setting && setting.value) {
      const val = setting.value;
      let migrated = false;
      
      if (val.priceConfig) {
        if (val.priceConfig.budgethue) {
          val.priceConfig.basichue = val.priceConfig.budgethue;
          delete val.priceConfig.budgethue;
          migrated = true;
        }
        if (val.priceConfig.basic) {
          val.priceConfig.basichue = val.priceConfig.basic;
          delete val.priceConfig.basic;
          migrated = true;
        }
      }
      
      if (val.basePrices) {
        for (const prog of Object.keys(val.basePrices)) {
          if (val.basePrices[prog]) {
            if (val.basePrices[prog].budgethue !== undefined) {
              val.basePrices[prog].basichue = val.basePrices[prog].budgethue;
              delete val.basePrices[prog].budgethue;
              migrated = true;
            }
            if (val.basePrices[prog].basic !== undefined) {
              val.basePrices[prog].basichue = val.basePrices[prog].basic;
              delete val.basePrices[prog].basic;
              migrated = true;
            }
          }
        }
      }
      
      if (migrated) {
        await prisma.systemSetting.update({
          where: { key: 'configurator_settings' },
          data: { value: JSON.stringify(val) }
        });
        setting.value = val;
      }
    }

    let finalValue = { ...DEFAULT_CONFIG, ...(setting.value || {}) };
    
    // Deep merge for priceConfig to ensure new keys in DEFAULT_CONFIG (like STU options) are preserved
    if (finalValue.priceConfig && DEFAULT_CONFIG.priceConfig) {
      for (const tier of Object.keys(DEFAULT_CONFIG.priceConfig)) {
        if (!finalValue.priceConfig[tier]) {
          finalValue.priceConfig[tier] = DEFAULT_CONFIG.priceConfig[tier];
        } else {
          for (const category of Object.keys(DEFAULT_CONFIG.priceConfig[tier])) {
            if (!finalValue.priceConfig[tier][category]) {
              finalValue.priceConfig[tier][category] = DEFAULT_CONFIG.priceConfig[tier][category];
            } else {
              for (const itemGroup of Object.keys(DEFAULT_CONFIG.priceConfig[tier][category])) {
                if (!finalValue.priceConfig[tier][category][itemGroup]) {
                  finalValue.priceConfig[tier][category][itemGroup] = DEFAULT_CONFIG.priceConfig[tier][category][itemGroup];
                } else {
                  for (const option of Object.keys(DEFAULT_CONFIG.priceConfig[tier][category][itemGroup])) {
                    if (finalValue.priceConfig[tier][category][itemGroup][option] === undefined) {
                      finalValue.priceConfig[tier][category][itemGroup][option] = DEFAULT_CONFIG.priceConfig[tier][category][itemGroup][option];
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Deep merge for basePrices to ensure basichue or new tiers in basePrices are preserved
    if (finalValue.basePrices && DEFAULT_CONFIG.basePrices) {
      for (const program of Object.keys(DEFAULT_CONFIG.basePrices)) {
        if (!finalValue.basePrices[program]) {
          finalValue.basePrices[program] = DEFAULT_CONFIG.basePrices[program];
        } else {
          for (const tier of Object.keys(DEFAULT_CONFIG.basePrices[program])) {
            if (finalValue.basePrices[program][tier] === undefined) {
              finalValue.basePrices[program][tier] = DEFAULT_CONFIG.basePrices[program][tier];
            }
          }
        }
      }
    }
    
    // Ensure new programs in PROGRAM_LIST are present in visibility and delivery
    PROGRAM_LIST.forEach(p => {
      if (finalValue.programsVisibility[p] === undefined) {
        finalValue.programsVisibility[p] = true;
      }
      if (finalValue.expressDelivery && finalValue.expressDelivery[p] === undefined) {
        finalValue.expressDelivery[p] = { active: true, price: 250 };
      }
      if (finalValue.deliveryCharges && finalValue.deliveryCharges[p] === undefined) {
        finalValue.deliveryCharges[p] = { "Denmark": 79, "Grønland": 348 };
      }
    });
    
    // Migration for legacy global deliveryCharges
    if (finalValue.deliveryCharges && typeof finalValue.deliveryCharges["Denmark"] === "number") {
       const legacyCharges = finalValue.deliveryCharges;
       finalValue.deliveryCharges = PROGRAM_LIST.reduce((acc, p) => ({ ...acc, [p]: legacyCharges }), {});
    }
    
    // Migration for legacy global expressDelivery
    if (finalValue.expressDelivery && finalValue.expressDelivery.active !== undefined) {
       const legacyExpress = finalValue.expressDelivery;
       finalValue.expressDelivery = PROGRAM_LIST.reduce((acc, p) => ({ ...acc, [p]: legacyExpress }), {});
    }

    res.json(finalValue);
  } catch (error) {
    console.error('Error fetching configurator settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

exports.getBasePrices = async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'configurator_settings' }
    });

    let basePrices = null;

    if (setting && typeof setting.value === 'string') {
      try {
        const parsed = JSON.parse(setting.value);
        basePrices = (parsed && typeof parsed === 'object') ? parsed.basePrices : null;
      } catch (e) {
        basePrices = null;
      }
    }

    // Fallback to DEFAULT_CONFIG if nothing in DB
    if (!basePrices) {
      basePrices = DEFAULT_CONFIG.basePrices;
    }

    res.json({ basePrices });
  } catch (error) {
    console.error('Error fetching base prices:', error);
    res.status(500).json({ message: 'Failed to fetch base prices' });
  }
};

exports.updateConfiguratorSettings = async (req, res) => {
  try {
    const newConfig = req.body;
    const serialized = JSON.stringify(newConfig);

    await prisma.systemSetting.upsert({
      where: { key: 'configurator_settings' },
      update: { value: serialized },
      create: { key: 'configurator_settings', value: serialized }
    });

    // Return the original object (not the raw string from DB)
    res.json(newConfig);
  } catch (error) {
    console.error('Error updating configurator settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

