const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const nodemailer = require("nodemailer");
const Stripe = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);



const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// const createEmailTransporter = () => {
//   return nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false, // use TLS later
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS, // must be an App Password
//     },
//   });
// };

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.simply.com",
    port: 587,
    secure: false, // use TLS later
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // must be an App Password
    },
  });
};







const workflowStatusChange = async (req, res) => {


  res.status(200).json({ message: 'aight', error: error.message });

}

const translateValue = (value) => {
  if (!value || value === '' || value === 'Ingen' || value === 'INGEN' || value === 'Nej' || value === 'NONE') {
    return 'Not Chosen';
  }

  const map = {
    // Materials
    'BOMULD': 'Cotton',
    'SATIN': 'Satin',
    'VELOUR': 'Velvet',
    'GLIMMER': 'Glitter',
    'SHIMMER': 'Shimmer',

    // Chin Strap
    'Mat': 'Matte',
    'Shiny': 'Shiny',
    'Sort/Sort': 'Black/Black',
    'Sort/Guld': 'Black/Gold',
    'Sølv/Sort': 'Silver/Black',
    'Guld': 'Gold',
    'Sølv': 'Silver',

    // Chin Strap Materials
    'Mat hagerem': 'Matte Leather Strap',
    'Blank hagerem': 'Shiny Leather Strap',
    'Blank kunstlæder hagerem': 'Shiny Faux Leather Strap',
    'Sort med sorteknuder': 'Black with black knots',
    'Sort hagerem med sorte knuder': 'Black Strap with Black Knots',
    'Sort hagerem med guld knuder': 'Black Strap with Gold Knots',
    'Sølv hagerem med sølvknuder': 'Silver Strap with Silver Knots',
    'Sølv hagerem med sort knuder': 'Silver Strap with Black Knots',
    'Guld hagerem med guld knuder': 'Gold Strap with Gold Knots',

    // Colors
    'Hvid': 'White',
    'Sort': 'Black',
    'Hvid med glimmer': 'White Glitter',
    'Sort med glimmer': 'Black Glitter',

    // Brim
    'Mat': 'Mat',
    'Shiny': 'Shiny',
    'Glimmer': 'Glimmer',
    'Shimmer': 'Shimmer',
    'Uden kant': 'Without Edge',
    'Med kant': 'With Edge',

    // Lining
    'Læder': 'Leather',
    'Kunstlæder': 'Artificial leather',
    'Ruskin': 'Ruskin Leather',
    'Alcantra': 'Alcantara',
    'Vegansk': 'Vegan',
    'Cognac': 'Cognac',
    'Viskose': 'Viscose',
    'Polyester': 'Polyester',
    'Satin': 'Satin',
    'Silk': 'Silk',
    'Brun': 'Brown',
    'Champagne': 'Champagne',
    'Rosa': 'Pink',

    // Flag Bands
    'International': 'International',
    'Frankrig-Spanien-Tyskland-UK-Danmark': 'France-Spain-Germany-UK-Denmark',
    'Usa-Kina-Danmark': 'USA-China-Denmark',

    // Extra
    'Ja': 'Yes',
    'Nej': 'No',
    'Standard': 'Standard'
  };

  return map[value] || value;
};

const factoryOrderEmail = (orderData) => {
  let kokardeValue = '';
  let colorOfCapSection = '';
  let broderiSection = '';
  let betraekSection = '';
  let skyggeSection = '';
  let foerSection = '';
  let ekstraSection = '';
  let tilbehorSection = '';
  let storrelseSection = '';
  const {
    customerDetails,
    selectedOptions,
    totalPrice,
    currency,
    orderNumber,
    orderDate,
    packageName,
    program,
    email
  } = orderData;


  const hideSelectorsPrograms = [
    'sosuassistent',
    'sosuhjælper',
    'frisør',
    'kosmetolog',
    'pædagog',
    'pau',
    'ernæringsassisten'
  ];

  const shouldHideSelectors = hideSelectorsPrograms.includes(program?.toLowerCase());

  const formatLabel = (label) => {
    const labelMap = {
      // General Cap Options
      // 'Farve': 'Color',
      // 'Materiale': 'Material',
      // 'Hagerem': 'Chinstrap',
      // 'Hagerem Materiale': 'Chinstrap Material',
      // 'Broderi farve': 'Embroidery color',
      // 'Knap farve': 'Button color',
      // 'år': 'Year',
      // 'Huebånd': 'Flag ribbon',
      // 'Topkant': 'Top edging',
      // 'Kantbånd': 'Edge band',
      // 'Stjerner': 'Stars',
      // 'Skyggebånd': 'Shadow band',
      // 'Svederem': 'Sweatband',
      // 'Foer': 'Inside color',
      // 'Sløjfe': 'Bow',
      // 'Ekstrabetræk': 'Extra cover',
      // 'Hueæske': 'Cap box',
      // 'Silkepude': 'Silk cushion',
      // 'Lyskugle': 'Light ball',
      // 'Smart Tag': 'Smart Tag',
      // 'Handsker': 'Gloves',
      // 'Skolebroderi farve': 'School embroidery color',
      // 'Broderi': 'Embroidery',
      // 'BETRÆK': 'Cover',
      // 'SKYGGE': 'Brim',
      // 'FOER': 'Inside of the cap',
      // 'EKSTRABETRÆK': 'Extra cover',
      // 'TILBEHØR': 'Accessories',
      // 'STØRRELSE': 'Size',

      // // HHX - KOKARDE Section
      // 'KOKARDE': 'KOKARDE',
      // 'Emblem': 'Emblem',
      // 'Kokarde': 'Kokarde type',
      // 'Roset farve': 'Rosette color',
      // 'Type': 'Type',

      // // HHX - UDDANNELSESBÅND Section
      // 'UDDANNELSESBÅND': 'UDDANNELSESBÅND',
      // 'Broderi foran': 'Front embroidery',
      // 'Broderi farve foran': 'Front embroidery color',
      // 'Hagerem Materiale': 'Chinstrap Material',
      // 'Hagerem Type': 'Chinstrap Type',
      // 'Broderi farve bagpå': 'Back embroidery color',


      // // HHX - BRODERI Section
      // 'Broderifarve': 'Embroidery color',
      // 'Ingen': 'None',
      // 'Navne broderi': 'Name embroidery',
      // 'Skolebroderi': 'School embroidery',

      // // HHX - BETRÆK Section
      // 'BETRÆK Farve': 'Cover color',

      // // HHX - SKYGGE Section
      // 'Skygge': 'Brim',
      // 'Skyggegravering Line 1': 'Brim engraving line 1',
      // 'Skyggegravering Line 2': 'Brim engraving line 2',
      // 'Skyggegravering Line 3': 'Brim engraving line 3',
      // 'Skyggegravering': 'Brim engraving',
      // 'Linje 1': 'Line 1',
      // 'Linje 2': 'Line 2',
      // 'Linje 3': 'Line 3',

      // // HHX - FOER Section
      // 'SatinType': 'Satin type',
      // 'SilkeType': 'Silk type',

      // // HHX - EKSTRABETRÆK Section
      // 'Tilvælg': 'Optional',

      // // HHX - TILBEHØR Section
      // 'Bucketpins': 'Bucket pins',
      // 'Ekstra korkarde': 'Extra korkarde  ',
      // 'Ekstra korkarde Text': 'Extra korkarde text',
      // 'Fløjte': 'Whistle',
      // 'Huekuglepen': 'Cap pen',
      // 'Luksus champagneglas': 'Luxury champagne glass',
      // 'Premium æske': 'Premium box',
      // 'Store kuglepen': 'Large pen',
      // 'Trompet': 'Trumpet',

      // // HHX - STØRRELSE Section
      // 'Millimeter tilpasningssæt': 'Millimeter adjustment set',
      // 'Vælg størrelse': 'Foam to adjust the size'
      KOKARDE: "KOKARDE",
      Emblem: "Emblem",
      Kokarde: "Kokarde",
      "Roset farve": "Rosette color",
      Type: "Type",

      UDDANNELSESBÅND: "Education band",
      "Broderi farve": "Embroidery color",
      "Broderi foran": "Front embroidery",
      Hagerem: "Chin strap",
      "Hagerem Materiale": "Chin strap material",
      Huebånd: "Cap band",
      "Knap farve": "Button color",
      Materiale: "Material",
      år: "Year",

      BRODERI: "Embroidery",
      Broderifarve: "Embroidery color",
      Ingen: "None",
      "Navne broderi": "Name embroidery",
      Skolebroderi: "School embroidery",
      "Skolebroderi farve": "School embroidery color",

      BETRÆK: "Cover",
      Farve: "Color",
      Kantbånd: "Edge band",
      Stjerner: "Stars",
      Topkant: "Top edge",

      SKYGGE: "Brim",
      Materiale: "Material",
      Skyggebånd: "Brim band",
      "Skyggegravering Line 1": "Brim engraving line 1",
      "Skyggegravering Line 2": "Brim engraving line 2",
      "Skyggegravering Line 3": "Brim engraving line 3",
      Type: "Type",

      FOER: "Inside of the cap",
      Farve: "Color",
      Foer: "Inner band",
      Sløjfe: "Bow",
      Svederem: "Sweatband",

      EKSTRABETRÆK: "Extra cover",
      Tilvælg: "Optional",

      TILBEHØR: "Accessories",
      Bucketpins: "Bucket pins",
      "Ekstra korkarde": "Extra Kokarde",
      "Ekstra korkarde Text": "Extra Kokarde text",
      Fløjte: "Whistle",
      Handsker: "Gloves",
      Huekuglepen: "Cap pen",
      Hueæske: "Cap box",
      "Luksus champagneglas": "Luxury champagne glass",
      Lyskugle: "Light ball",
      "Premium æske": "Premium box",
      Silkepude: "Silk pillow",
      "Smart Tag": "Smart tag",
      "Store kuglepen": "Large pen",
      Trompet: "Trumpet",

      STØRRELSE: "Size",
      "Millimeter tilpasningssæt": "Millimeter fitting set",
      "Vælg størrelse": "Choosen size ",

      STX: 'bordaux',
      HTX: 'Navy Blue',
      HHX: ' Royal Blue',
      HF: 'Light Blue',
      EUX: 'Grey',
      EUD: 'Purple',
      Sosuassistent: 'Purple',
      Sosuhjælper: 'Light purple',
      Frisør: 'Light pink',
      Kosmetolog: 'Pink',
      Pædagog: 'Dark purple',
      PAU: 'Orange',
      Ernæringsassisten: 'Yellow',


    }

    return labelMap[label] || label;
  };

  const programColorMap = {
    STX: 'Bordeaux',
    HTX: 'Navy Blue',
    HHX: 'Royal Blue',
    HF: 'Light Blue',
    EUX: 'Grey',
    EUD: 'Purple',
    sosuassistent: 'Purple',
    sosuhjælper: 'Light Purple',
    frisør: 'Light Pink',
    kosmetolog: 'Pink',
    pædagog: 'Dark Purple',
    pau: 'Orange',
    ernæringsassistent: 'Yellow',
    Sort: 'Black'
  };
  const programColor = programColorMap[selectedOptions.UDDANNELSESBÅND?.Huebånd] || program;
  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.name) return value.name;
      if (value.value) return value.value;
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === '') return 'Ikke angivet / Ikke valgt';
    return value;
  };

  const formatOptions = (options) => {
    return Object.entries(options)
      .map(([key, value]) => {
        if (!value || value === '' || value === null || value === false) return '';

        if (typeof value === 'object' && value !== null) {
          if (value.name) {
            return `<tr><td style="padding: 4px 8px;">${formatLabel(key)}:</td><td style="font-weight: bold;">${formatValue(value.name)}</td></tr>`;
          }
          return Object.entries(value)
            .map(([subKey, subValue]) => {
              if (subValue && subValue !== '' && subValue !== null && subValue !== false) {
                return `<tr><td style="padding: 4px 8px;">${formatLabel(subKey)}:</td><td style="font-weight: bold;">${formatValue(subValue)}</td></tr>`;
              }
              return '';
            })
            .join('');
        }

        return `<tr><td style="padding: 4px 8px;">${formatLabel(key)}:</td><td style="font-weight: bold;">${formatValue(value)}</td></tr>`;
      })
      .join('');
  };

  const t = (value) => translateValue(value);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factory Order - Studentlife</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      table[class="container"] { width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, sans-serif; color:#333333; line-height:1.4;">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center">
        <table width="700" border="0" cellpadding="0" cellspacing="0" class="container" style="max-width:700px; width:100%;">
          <tr>
            <td style="padding:0 20px;">

              <!-- Customer Order Information -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Customer Order Information:</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Order Created: ${orderDate.toLocaleDateString()}</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Order No: ${orderNumber}</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Customer Name: ${customerDetails.firstName} ${customerDetails.lastName}</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Email: ${email || customerDetails.email || 'Not Provided'}</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Phone: ${customerDetails.phone || 'Not Provided'}</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">School Name: ${customerDetails.Skolenavn}</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Deliver to school: ${customerDetails.deliverToSchool ? "Yes" : "No"}</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#d97706;">Delivery Type: ${customerDetails.deliveryType === 'express' ? "EKSPRES (3 UGER)" : "Normal (6 Uger)"}</td></tr>
              </table>

              <!-- Order Details Header -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ffffff; padding:30px 20px 10px 20px; font-weight:bold; font-size:18px;">Order Details</td>
                </tr>
              </table>

              <!-- Package Summary -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#fbfbfb;">
                <tr>
                  <td style="padding:30px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:18px; padding-bottom:10px;">${packageName}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Main Content Area -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:40px 30px; margin-bottom:30px;">

                <!-- The Cap -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">The Cap</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Color of the Cap</div>
                                <div style="font-size:16px;">${programColor}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Buttons Color</div>
                                <div style="font-size:16px;">${t(selectedOptions.UDDANNELSESBÅND?.['Knap farve'])}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Material</div>
                                <div style="font-size:16px;">${t(selectedOptions.UDDANNELSESBÅND?.Materiale)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Chinstrap</div>
                                <div style="font-size:16px;">${t(selectedOptions.UDDANNELSESBÅND?.Hagerem)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Embroidery on Frontside -->
                ${!selectedOptions.UDDANNELSESBÅND["Broderi foran"] ? `` : `
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Embroidery on Frontside</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Text Max. 20 Characters</div>
                                <div style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND["Broderi foran"]}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Embroidery Color</div>
                                <div style="font-size:16px;">${t(selectedOptions.UDDANNELSESBÅND?.["Broderi farve"])}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`}

                <!-- Embroidery on the Backside of the Cap -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Embroidery on the Backside of the Cap</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI["Navne broderi"] ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Name Embroidery (Text) Max. 26</div>
                                <div style="font-size:16px;">${selectedOptions.BRODERI["Navne broderi"]}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Embroidery Color </div>
                                <div style="font-size:16px;">${t(selectedOptions.BRODERI?.Broderifarve) || 'Not Chosen'}</div>
                              </td>
                            </tr>`}
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI.Skolebroderi ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">School Embroidery (Text) Max. 35</div>
                                <div style="font-size:16px;">${selectedOptions.BRODERI.Skolebroderi}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Embroidery Color </div>
                                <div style="font-size:16px;">${t(selectedOptions.BRODERI?.['Skolebroderi farve']) || 'Not Chosen'}</div>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Year</div>
                                <div style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.år}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Brim -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Brim</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Type</div>
                                <div style="font-size:16px;">${t(selectedOptions.SKYGGE?.Type)}</div>
                              </td>
                            </tr>
                            ${selectedOptions.SKYGGE.Type === 'Glimmer' ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Material </div>
                                <div style="font-size:16px;">${t(selectedOptions.SKYGGE?.Materiale)}</div>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Shadow Band</div>
                                <div style="font-size:16px;">${t(selectedOptions.SKYGGE?.Skyggebånd)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Line 1</div>
                                <div style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 1"] ? 'Not Selected' : selectedOptions.SKYGGE["Skyggegravering Line 1"]}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Line 2</div>
                                <div style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 2"] ? 'Not Selected' : selectedOptions.SKYGGE["Skyggegravering Line 2"]}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Line 3</div>
                                <div style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 3"] ? 'Not Selected' : selectedOptions.SKYGGE["Skyggegravering Line 3"]}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>


                <!-- Size -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Size</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Chosen Size (Size)</div>
                                <div style="font-size:16px;">${selectedOptions.STØRRELSE["Vælg størrelse"]}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Foam to Adjust the Size</div>
                                <div style="font-size:16px;">${selectedOptions.STØRRELSE["Millimeter tilpasningssæt"] === 'Ja' ? 'Yes' : 'Not Chosen'}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Cover -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Cover </td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Color</div>
                                <div style="font-size:16px;">${t(selectedOptions.BETRÆK?.Farve)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Top Edging</div>
                                <div style="font-size:16px;">${selectedOptions.BETRÆK?.Topkant === 'INGEN' ? 'None' : t(selectedOptions.BETRÆK?.Topkant)}</div>
                              </td>
                            </tr>
                            ${!shouldHideSelectors ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Edge Ribbon</div>
                                <div style="font-size:16px;">${selectedOptions.BETRÆK?.Kantbånd === 'INGEN' ? 'None' : t(selectedOptions.BETRÆK?.Kantbånd)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Stars</div>
                                <div style="font-size:16px;">${selectedOptions.BETRÆK.Stjerner === 'INGEN' ? 'None' : selectedOptions.BETRÆK.Stjerner}</div>
                              </td>
                            </tr>
                            ${selectedOptions.BETRÆK.Stjerner === 'INGEN' ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Stars Color</div>
                                <div style="font-size:16px;">${t(selectedOptions.KOKARDE?.Emblem?.name)}</div>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Flag Ribbon</div>
                                <div style="font-size:16px;">${!selectedOptions.BETRÆK.Flagbånd ? 'Not Chosen' : selectedOptions.BETRÆK.Flagbånd == 'Nej' ? 'Not Chosen' : t(selectedOptions.BETRÆK.Flagbånd)}</div>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Inside of the Cap -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Inside of the Cap </td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Sweatband </div>
                                <div style="font-size:16px;">${t(selectedOptions.FOER?.Svederem)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Color</div>
                                <div style="font-size:16px;">${t(selectedOptions.FOER?.Farve)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Bow</div>
                                <div style="font-size:16px;">${t(selectedOptions.FOER?.Sløjfe)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Inner Band</div>
                                <div style="font-size:16px;">${t(selectedOptions.FOER?.Foer)}</div>
                              </td>
                            </tr>
                            ${!selectedOptions.FOER || !selectedOptions.FOER['Satin Type'] ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Satin Color</div>
                                <div style="font-size:16px;">${!selectedOptions.FOER['Satin Type'] ? 'Not Selected' : t(selectedOptions.FOER['Satin Type'])}</div>
                              </td>
                            </tr>`}
                            ${!selectedOptions.FOER || !selectedOptions.FOER['Silk Type'] ? '' : `
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Silk Color</div>
                                <div style="font-size:16px;">${!selectedOptions.FOER['Silk Type'] ? 'Not Selected' : t(selectedOptions.FOER['Silk Type'])}</div>
                              </td>
                            </tr>`}
                            ${!(selectedOptions.FOER?.['Indvendigt foer billede'] || selectedOptions['Indvendigt foer billede']) ? '' : `
                            <tr>
                              <td style="padding-top:20px; border-top: 1px dashed #cdcdcd; margin-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:10px; font-weight:bold; color: #4338ca;">Custom Inside Lining Photo:</div>
                                <div style="border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; background-color: #ffffff; padding: 5px;">
                                  <img src="${selectedOptions.FOER?.['Indvendigt foer billede'] || selectedOptions['Indvendigt foer billede']}" style="width: 100%; max-width: 400px; height: auto; display: block; border-radius: 8px;" alt="Lining Design" />
                                </div>
                              </td>
                            </tr>`}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Extra Cover -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Extra Cover</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Option</div>
                                <div style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Tilvælg === 'Ja' ? 'Yes' : 'Not Chosen'}</div>
                              </td>
                            </tr>
                            ${selectedOptions.EKSTRABETRÆK.Tilvælg === 'Ja' ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Color</div>
                                <div style="font-size:16px;">${t(selectedOptions.EKSTRABETRÆK?.Farve)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Top Edging</div>
                                <div style="font-size:16px;">${t(selectedOptions.EKSTRABETRÆK?.Topkant)}</div>
                              </td>
                            </tr>
                            ${!shouldHideSelectors ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Edge Ribbon</div>
                                <div style="font-size:16px;">${t(selectedOptions.EKSTRABETRÆK?.Kantbånd)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Flag Ribbon</div>
                                <div style="font-size:16px;">${!selectedOptions.EKSTRABETRÆK.Flagbånd ? 'Not Chosen' : selectedOptions.EKSTRABETRÆK.Flagbånd == 'Nej' ? 'Not Chosen' : t(selectedOptions.EKSTRABETRÆK.Flagbånd)}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Stars</div>
                                <div style="font-size:16px;">${selectedOptions.BETRÆK.Stjerner === 'INGEN' ? 'None' : selectedOptions.BETRÆK.Stjerner}</div>
                              </td>
                            </tr>
                            ${selectedOptions.EKSTRABETRÆK.Stjerner === 'INGEN' ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Stars (Color Matches the Emblem)</div>
                                <div style="font-size:16px;">${t(selectedOptions.KOKARDE?.Emblem?.name)}</div>
                              </td>
                            </tr>`}
                            ` : ''}
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI.Skolebroderi ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">School Embroidery  </div>
                                <div style="font-size:16px;">${selectedOptions.BRODERI.Skolebroderi}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">School Embroidery Color</div>
                                <div style="font-size:16px;">${t(selectedOptions.BRODERI?.['Skolebroderi farve'])}</div>
                              </td>
                            </tr>`}
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Accessories -->
                <tr>
                  <td style="padding-top:20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; color:#333333; padding-bottom:15px;">Accessories</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding-bottom:10px;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Silk Cushion</div>
                                <div style="font-size:16px;">${selectedOptions.TILBEHØR.Silkepude === 'Ja' ? 'Yes' : 'Not Chosen'}</div>
                              </td>
                            </tr>
                            ${selectedOptions.TILBEHØR['Flag 1'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Flag 1</div>
                                <div style="font-size:16px;">${selectedOptions.TILBEHØR['Flag 1']}</div>
                              </td>
                            </tr>` : ''}
                            ${selectedOptions.TILBEHØR['Flag 2'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Flag 2</div>
                                <div style="font-size:16px;">${selectedOptions.TILBEHØR['Flag 2']}</div>
                              </td>
                            </tr>` : ''}
                            ${selectedOptions.TILBEHØR['Flag 3'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Flag 3</div>
                                <div style="font-size:16px;">${selectedOptions.TILBEHØR['Flag 3']}</div>
                              </td>
                            </tr>` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;


  const text = `
Customer Order Information
====================================================

Order Created: ${orderDate}
Order #${orderNumber} — ${customerDetails.firstName} ${customerDetails.lastName}
School Name: ${customerDetails.Skolenavn || 'Not Specified / Not Selected'}
Deliver To school: ${customerDetails.deliverToSchool ? "Yes" : "No"}

Order Details
------------------------------
Package: ${packageName || 'Cap Package'}
Total Price: ${totalPrice} ${currency}

Information about the Cap
-----------------------------------------------
${Object.entries(selectedOptions)
      .map(([category, options]) => {
        const hasOptions = Object.values(options).some(val =>
          val && val !== '' && val !== null && val !== false &&
          !(typeof val === 'object' && Object.keys(val).length === 0)
        );
        if (!hasOptions) return '';

        const optionsText = Object.entries(options)
          .map(([key, value]) => {
            if (!value || value === '' || value === null || value === false) return '';

            if (typeof value === 'object' && value !== null) {
              if (value.name) {
                return `${formatLabel(key)}: ${formatValue(value.name)}`;
              }
              return Object.entries(value)
                .map(([subKey, subValue]) => `${formatLabel(subKey)}: ${formatValue(subValue)}`)
                .join('\n');
            }
            return `${formatLabel(key)}: ${formatValue(value)}`;
          })
          .join('\n');

        return `${formatLabel(category).toUpperCase()}\n${optionsText}\n`;
      })
      .join('\n')}

NOTE TO FACTORY
---------------------------------
- Verify embroidery text length and colors.
- Check color consistency with emblem.
- Confirm size, material, and chinstrap type.
`;

  return {
    subject: `FACTORY ORDER – #${orderNumber} (${customerDetails.firstName} ${customerDetails.lastName})`,
    html,
    text
  };
};


const capOrderEmail = (orderData) => {
  const {
    customerDetails,
    selectedOptions,
    totalPrice,
    currency,
    orderNumber,
    orderDate,
    packageName,
    program,
    email
  } = orderData;

  const shippingPrices = {
    "Denmark": 79,
    "Grønland": 348,
  };
  const country = customerDetails?.country || "Denmark";
  const handlingFee = customerDetails?.country === 'Grønland' ? 348 : shippingPrices[country] || 79;
  const orderSum = (parseFloat(totalPrice) + handlingFee).toFixed(2);

  const hideSelectorsPrograms = [
    'sosuassistent',
    'sosuhjælper',
    'frisør',
    'kosmetolog',
    'pædagog',
    'pau',
    'ernæringsassisten'
  ];

  const shouldHideSelectors = hideSelectorsPrograms.includes(program?.toLowerCase());

  const leveringstid = new Date(orderDate);
  leveringstid.setMonth(leveringstid.getMonth() + 3);

  const dayNumber = leveringstid.getDate();
  const monthNumber = leveringstid.getMonth() + 1;
  const year = leveringstid.getFullYear();


  const currentOrderDate = new Date(orderDate);

  const currentDayNumber = currentOrderDate.getDate();
  const currentMonthNumber = currentOrderDate.getMonth() + 1;
  const currentYear = currentOrderDate.getFullYear();

  // Enhanced formatOptions to handle different value structures
  const formatOptions = (options) => {
    return Object.entries(options)
      .map(([key, value]) => {
        // Skip if value is empty, null, or false
        if (!value || value === '' || value === null || value === false) {
          return '';
        }

        // Handle nested objects with name/value properties
        if (typeof value === 'object' && value !== null) {
          // If it's an object with name property (like Roset farve)
          if (value.name) {
            return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${formatLabel(key)}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(value.name)}</td></tr>`;
          }
          // If it's an object with multiple properties, format each one
          return Object.entries(value)
            .map(([subKey, subValue]) => {
              if (subValue && subValue !== '' && subValue !== null && subValue !== false) {
                return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${formatLabel(subKey)}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(subValue)}</td></tr>`;
              }
              return '';
            })
            .join('');
        }

        // Handle simple values
        return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${formatLabel(key)}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(value)}</td></tr>`;
      })
      .join('');
  };

  const formatLabel = (label) => {
    const labelMap = {
      'firstName': 'Fornavn',
      'lastName': 'Efternavn',
      'email': 'E-mail',
      'phone': 'Telefon',
      'Skolenavn': 'Skolenavn',
      'address': 'Adresse',
      'city': 'By',
      'postalCode': 'Postnummer',
      'country': 'Land',
      'notes': 'Bemærkninger',
      'deliverToSchool': 'Leveres til skole',
      'KOKARDE': 'KOKARDE',
      'Roset farve': 'Roset farve',
      'Kokarde': 'Kokarde',
      'Emblem': 'Emblem',
      'Type': 'Type',
      'TILBEHØR': 'TILBEHØR',
      'Hueæske': 'Hueæske',
      'Premium æske': 'Premium æske',
      'Huekuglepen': 'Huekuglepen',
      'Silkepude': 'Silkepude',
      'Ekstra korkarde': 'Ekstra korkarde',
      'Ekstra korkarde Text': 'Ekstra korkarde tekst',
      'Handsker': 'Handsker',
      'Stor kuglepen': 'Stor kuglepen',
      'Store kuglepen': 'Store kuglepen',
      'Smart Tag': 'Smart Tag',
      'Lyskugle': 'Lyskugle',
      'Luksus champagneglas': 'Luksus champagneglas',
      'Fløjte': 'Fløjte',
      'Trompet': 'Trompet',
      'Bucketpins': 'Bucketpins',
      'STØRRELSE': 'STØRRELSE',
      'Vælg størrelse': 'Vælg størrelse',
      'Millimeter tilpasningssæt': 'Millimeter tilpasningssæt',
      'UDDANNELSESBÅND': 'UDDANNELSESBÅND',
      'Huebånd': 'Huebånd',
      'Materiale': 'Materiale',
      'Hagerem': 'Hagerem',
      'Hagerem Materiale': 'Hagerem Materiale',
      'Broderi farve': 'Broderi farve',
      'Knap farve': 'Knap farve',
      'år': 'år',
      'BRODERI': 'BRODERI',
      'Broderifarve': 'Broderifarve',
      'Skolebroderi farve': 'Skolebroderi farve',
      'Ingen': 'Ingen',
      'BETRÆK': 'BETRÆK',
      'Farve': 'Farve',
      'Topkant': 'Topkant',
      'Kantbånd': 'Kantbånd',
      'Stjerner': 'Stjerner',
      'SKYGGE': 'SKYGGE',
      'Skyggebånd': 'Skyggebånd',
      'FOER': 'FOER',
      'Svederem': 'Svederem',
      'Sløjfe': 'Sløjfe',
      'Foer': 'Foer',
      'SatinType': 'Satin Type',
      'SilkeType': 'Silke Type',
      'EKSTRABETRÆK': 'EKSTRABETRÆK',
      'Tilvælg': 'Tilvælg'
    };
    return labelMap[label] || label;
  };

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      // Prefer showing "name" if it exists
      if (value.name) return value.name;
      if (value.value) return value.value;
      return JSON.stringify(value); // fallback
    }
    if (typeof value === 'boolean') {
      return value ? 'Ja' : 'Nej';
    }
    if (value === '') {
      return 'Ikke angivet';
    }
    if (value === 'No') return 'Nej';
    if (value === 'Yes') return 'Ja';
    if (value === 'Standard') return 'Standard';
    if (value === 'NONE') return 'NONE';
    if (value === 'INGEN') return 'INGEN';
    if (value === false) return 'Nej';
    if (value === true) return 'Ja';
    return value;
  };

  const programColorMap = {
    STX: 'Bordeaux',
    HTX: 'Navy Blue',
    HHX: 'Royal Blue',
    HF: 'Light Blue',
    EUX: 'Grey',
    EUD: 'Purple',
    sosuassistent: 'Purple',
    sosuhjælper: 'Light Purple',
    frisør: 'Light Pink',
    kosmetolog: 'Pink',
    pædagog: 'Dark Purple',
    pau: 'Orange',
    ernæringsassistent: 'Yellow'
  };
  const programColor = programColorMap[program] || program;

  const html = `

<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ordrebekræftelse - Studentlife</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      table[class="container"] { width: 100% !important; }
      td[class="mobile-padding"] { padding: 20px 15px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, sans-serif; color:#333333; line-height:1.4;">

    <div style="text-align: center; padding: 20px 5px;">
        <img src="https://elipsestudio.com/student/01.png" alt="Studentlife" style="max-width: 100%; height: auto;">
    </div>

    <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
            <td style="height:10px; font-size:0; line-height:0;">&nbsp;</td>
        </tr>
    </table>

  <!-- Full-width wrapper -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center">
        <!-- Fixed-width container (700px) -->
        <table width="700" border="0" cellpadding="0" cellspacing="0" class="container" style="max-width:700px; width:100%;">
          <tr>
            <td style="padding:0 20px;">

              <!-- Premium Quality Banner -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border-top:1px solid #e5e7eb;">
                <tr>
                  <td align="center" style="padding:15px 0;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:16px; font-weight:bold; color:#111827; padding:0 15px;">✓ Premium kvalitet</td>
                        <td style="font-size:16px; font-weight:bold; color:#111827; padding:0 15px;">✓ Personligt design</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting Section -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Kære: ${customerDetails.firstName} ${customerDetails.lastName},</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Tak for din bestilling hos Studentlife.</td></tr>
                <tr><td style="font-size:18px; font-weight:bold; padding-bottom:15px;">Din bestilling med ordre nummer: ${orderNumber} er nu betalt.</td></tr>
                <tr><td style="font-size:16px; padding-bottom:15px;">Husk at tjekke alle detaljer er korrekte, herunder også leveringstid ${dayNumber}/${monthNumber}/${year}, skolens logo samt skolebroderi.</td></tr>
                <tr><td style="font-size:16px; padding-bottom:15px;">Vi håber at du kommer til at elske din studenterhue.</td></tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Order Information -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:21px; font-weight:bold; padding-bottom:15px; color:#333333;">Din ordre oplysninger:</td>
                </tr>
                <tr>
                  <td style="font-size:16px; padding-bottom:15px;">Ordren er oprettet: ${currentDayNumber}/${currentMonthNumber}/${currentYear}</td>
                </tr>
                <tr>
                  <td style="background-color:#f2f3f2; padding:15px; font-weight:bold; font-size:15px; text-align:center;">Order nr: ${orderNumber}</td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Payment Information -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:30px 25px;">
                <tr>
                  <td style="font-size:19px; font-weight:bold; padding-bottom:15px;">Betalingsoplysninger</td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Oplysninger om betaleren</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Navn:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.firstName} ${customerDetails.lastName}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">E-mail:</td></tr>
                      <tr><td style="font-size:16px;">${email || customerDetails.email || 'Not Provided'}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Telefon:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.phone || 'Not Provided'}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Adresse:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.address}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Postnummer og by:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.postalCode} ${customerDetails.city}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Delivery Information -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:30px 25px; margin-bottom:20px;">
                <tr>
                  <td style="font-size:19px; font-weight:bold; padding-bottom:15px;">Leveringsoplysninger</td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Navn:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.firstName} ${customerDetails.lastName}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Adresse:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.address}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Postnummer og by:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.postalCode} ${customerDetails.city}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Skole navn:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.Skolenavn}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">levering til skolen:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.deliverToSchool ? "Ja" : "Nej"}</td></tr>
                    </table>
                  </td>
                </tr>
                ${customerDetails.notes ? `
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Levering:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.notes}</td></tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Order Details Header -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff; padding:30px 20px 10px 20px;">
                <tr>
                  <td style="font-weight:bold; font-size:18px;">Ordre detaljer</td>
                </tr>
              </table>

              <!-- Package Summary -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#fbfbfb;">
                <tr>
                  <td style="padding:30px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:18px; padding-bottom:10px;">${packageName}</td></tr>
                      <tr>
                        <td style="font-size:16px;">
                          <span style="font-weight:bold; margin-right:5px;">Pris:</span>
                          <span>${totalPrice} DKK</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Product Details Area -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:40px 30px;">

                <!-- Kokarde -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Kokarde</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Roset farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE['Roset farve'].name}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Kokarde type</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Kokarde}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Emblem</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Emblem.name}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Emblem type</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Type}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Uddannelsesbånd -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Uddannelsesbånd</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Huebånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.Huebånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Materiale</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.Materiale}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Hagerem</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.Hagerem}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Broderi foran (Conditional) -->
                ${!selectedOptions.UDDANNELSESBÅND["Broderi foran"] ? `` : `
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Broderi foran</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Tekst maks. 20 tegn</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND["Broderi foran"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Broderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND["Broderi farve"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`}

                <!-- Broderi Bagpå -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Broderi Bagpå</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI["Navne broderi"] ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Navnebroderi (Tekst) maks. 26</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI["Navne broderi"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Broderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI?.Broderifarve || 'Ikke valgt'}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI.Skolebroderi ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skolebroderi (Tekst) maks. 35</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI.Skolebroderi}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Broderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI?.['Skolebroderi farve'] || 'Ikke valgt'}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Knap Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND['Knap farve']}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">År</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.år}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Skygge -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Skygge</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Type</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.SKYGGE.Type}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.SKYGGE.Type === 'Glimmer' ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Materiale</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.SKYGGE.Materiale}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skyggebånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.SKYGGE.Skyggebånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Linje 1</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 1"] ? 'Ikke valgt' : selectedOptions.SKYGGE["Skyggegravering Line 1"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Linje 2</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 2"] ? 'Ikke valgt' : selectedOptions.SKYGGE["Skyggegravering Line 2"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Linje 3</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 3"] ? 'Ikke valgt' : selectedOptions.SKYGGE["Skyggegravering Line 3"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>


                <!-- Størrelse -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Størrelse</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Vælg størrelse (Size)</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.STØRRELSE["Vælg størrelse"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Millimeter tilpasningssæt</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.STØRRELSE["Millimeter tilpasningssæt"] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Betræk -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Betræk</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Farve}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Topkant</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Topkant === 'NONE' || selectedOptions.BETRÆK.Topkant === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Topkant}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${!shouldHideSelectors ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Kantbånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Kantbånd === 'NONE' || selectedOptions.BETRÆK.Kantbånd === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Kantbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Stjerner === 'NONE' || selectedOptions.BETRÆK.Stjerner === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Stjerner}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.BETRÆK.Stjerner === "INGEN" ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Emblem.name}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Flagbånd</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.BETRÆK.Flagbånd ? 'Fravalgt' : selectedOptions.BETRÆK.Flagbånd == 'Nej' ? 'Fravalgt' : selectedOptions.BETRÆK.Flagbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Foer -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Foer</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Svederem</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Svederem}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Farve}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Sløjfe</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Sløjfe}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Forring</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Foer}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${!selectedOptions.FOER || !selectedOptions.FOER['Satin Type'] ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Satin Color</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.FOER['Satin Type'] ? 'Ikke valgt' : selectedOptions.FOER['Satin Type']}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ${!selectedOptions.FOER || !selectedOptions.FOER['Silk Type'] ? '' : `
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Silk Color</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.FOER['Silk Type'] ? 'Ikke valgt' : selectedOptions.FOER['Silk Type']}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Extra Cover -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Ekstra betræk</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Tilvælg</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Tilvælg === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.EKSTRABETRÆK.Tilvælg === 'Ja' ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Farve}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Topkant</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Topkant === 'NONE' || selectedOptions.EKSTRABETRÆK.Topkant === 'None' ? 'Ingen' : selectedOptions.EKSTRABETRÆK.Topkant}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${!shouldHideSelectors ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Kantbånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Kantbånd === 'NONE' || selectedOptions.EKSTRABETRÆK.Kantbånd === 'None' ? 'Ingen' : selectedOptions.EKSTRABETRÆK.Kantbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Flagbånd</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.EKSTRABETRÆK.Flagbånd ? 'Fravalgt' : selectedOptions.EKSTRABETRÆK.Flagbånd == 'Nej' ? 'Fravalgt' : selectedOptions.EKSTRABETRÆK.Flagbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Stjerner === 'NONE' || selectedOptions.BETRÆK.Stjerner === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Stjerner}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.BETRÆK.Stjerner === "INGEN" ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Emblem.name}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ` : ''}
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI.Skolebroderi ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skolebroderi</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI.Skolebroderi}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skolebroderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI['Skolebroderi farve']}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Tilbehør -->
                <tr>
                  <td style="padding-top:20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Tilbehør</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Hueæske</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Hueæske}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.TILBEHØR['Premium æske'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Premium æske</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Premium æske']}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Huekuglepen</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Huekuglepen === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Silkepude</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Silkepude === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Ekstra Kokarde</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Ekstra korkarde'] === 'Fravalgt' ? 'Fravalgt' : selectedOptions.TILBEHØR['Ekstra korkarde Text']}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Handsker</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Handsker === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stor kuglepen</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR["Store kuglepen"] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Smarttag</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR["Smart Tag"] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.TILBEHØR['Flag 1'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Flag 1</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Flag 1']}</td></tr>
                                </table>
                              </td>
                            </tr>` : ''}
                            ${selectedOptions.TILBEHØR['Flag 2'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Flag 2</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Flag 2']}</td></tr>
                                </table>
                              </td>
                            </tr>` : ''}
                            ${selectedOptions.TILBEHØR['Flag 3'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Flag 3</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Flag 3']}</td></tr>
                                </table>
                              </td>
                            </tr>` : ''}
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Fløjte</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Fløjte === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Lyskugle</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Lyskugle === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Luksus champagneglas</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Luksus champagneglas'] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Trompet</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Trompet === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Bucketpins</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Bucketpins === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

             <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Footer Total -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:20px;">
                <tr>
                  <td>
                    <div style="font-size:18px; font-weight:bold; margin-bottom:5px;">Total: ${totalPrice} DKK</div>
                    <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">Inklusiv moms</div>
                    <hr style="border:none; border-top:1px solid #cdcdcd; margin:15px 0;">
                    <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">SUM: ${orderSum} DKK</div>
                    <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">LEVERING: ${handlingFee} DKK</div>
                    <div style="font-size:14px; text-transform:uppercase; margin-bottom:5px;">MOMS: ${(totalPrice * 0.20).toFixed(2)} DKK</div>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Signature -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid #cdcdcd;">
                <tr>
                  <td style="font-size:14px; padding-top:15px;">
                    <p style="margin:0 0 10px 0;">Er du i tvivl om noget? Kundeservice altid klar, hvis du har brug for hjælp.</p>
                    <p style="margin:0 0 10px 0;">Vi ønsker dig en dejlig dag,</p>
                    <p style="margin:0;">Studentlife 😊</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

  // Enhanced text version formatting
  const text = `
PREMIUM KVALITET & PERSONLIGT DESIGN
=====================================

Kære ${customerDetails.firstName} ${customerDetails.lastName},

Tak for din bestilling hos Studentlife.

Din bestilling med ordrenummer: ${orderNumber} er nu betalt.
Husk at tjekke, at alle detaljer er korrekte, herunder leveringstid (3 måneder fra bestilling, medmindre det er ekspres), skolens logo samt skolebroderi.

Vi håber, at du kommer til at elske din studenterhue.


ORDREOPLYSNINGER
-----------------
Ordren er oprettet: ${new Date(orderDate).toLocaleString('da-DK')}
Ordrenummer: ${orderNumber}


BETALINGSINFORMATION
---------------------
Navn: ${customerDetails.firstName} ${customerDetails.lastName}
Adresse: ${customerDetails.address}
Post & By: ${customerDetails.postalCode} ${customerDetails.city}


LEVERINGSINFORMATION
---------------------
Navn: ${customerDetails.firstName} ${customerDetails.lastName}
Adresse: ${customerDetails.address}
Post & By: ${customerDetails.postalCode} ${customerDetails.city}
Skole navn:: ${customerDetails.Skolenavn}
levering til skolen: ${customerDetails.deliverToSchool ? "Ja" : "Nej"}
${customerDetails.notes ? `Leveringsnote: ${customerDetails.notes}` : ''}


ORDRE DETALJER
---------------
${selectedOptions?.pakke?.name ? `Valgt pakke: ${selectedOptions.pakke.name}` : ''}
${selectedOptions?.pakke?.price ? `Pris: ${selectedOptions.pakke.price} DKK` : ''}

Information om huen:
--------------------
${Object.entries(selectedOptions)
      .map(([category, options]) => {
        const hasOptions = Object.values(options).some(val =>
          val && val !== '' && val !== null && val !== false &&
          !(typeof val === 'object' && Object.keys(val).length === 0)
        );
        if (!hasOptions) return '';

        const optionsText = Object.entries(options)
          .map(([key, value]) => {
            if (!value || value === '' || value === null || value === false) return '';

            if (typeof value === 'object' && value !== null) {
              if (value.name) {
                return `${formatLabel(key)}: ${formatValue(value.name)}`;
              }
              return Object.entries(value)
                .map(([subKey, subValue]) => {
                  if (subValue && subValue !== '' && subValue !== null && subValue !== false) {
                    return `${formatLabel(subKey)}: ${formatValue(subValue)}`;
                  }
                  return '';
                })
                .filter(Boolean)
                .join('\n');
            }
            return `${formatLabel(key)}: ${formatValue(value)}`;
          })
          .filter(Boolean)
          .join('\n');

        return `${formatLabel(category).toUpperCase()}\n${optionsText}\n`;
      })
      .filter(Boolean)
      .join('\n')}


TOTAL
------
Total: ${totalPrice} ${currency}
Inklusiv moms
SUM: ${orderSum} DKK
LEVERING: ${handlingFee} DKK
MOMS: 20% af totalbeløbet


Tak for din ordre ❤️
Vi behandler den snarest og kontakter dig, hvis vi har brug for yderligere oplysninger.
`;


  return {
    subject: `Tak for din bestilling hos Studentlife`,
    html,
    text
  };
};
const capOrderAdminEmail = (orderData) => {
  const {
    customerDetails,
    selectedOptions,
    totalPrice,
    currency,
    orderNumber,
    orderDate,
    packageName,
    program,
    email
  } = orderData;

  const shippingPrices = {
    "Denmark": 79,
    "Grønland": 348,
  };
  const country = customerDetails?.country || "Denmark";
  const handlingFee = customerDetails?.country === 'Grønland' ? 348 : shippingPrices[country] || 79;
  const orderSum = (parseFloat(totalPrice) + handlingFee).toFixed(2);

  const hideSelectorsPrograms = [
    'sosuassistent',
    'sosuhjælper',
    'frisør',
    'kosmetolog',
    'pædagog',
    'pau',
    'ernæringsassisten'
  ];

  const shouldHideSelectors = hideSelectorsPrograms.includes(program?.toLowerCase());

  // Enhanced formatOptions to handle different value structures
  const formatOptions = (options) => {
    return Object.entries(options)
      .map(([key, value]) => {
        // Skip if value is empty, null, or false
        if (!value || value === '' || value === null || value === false) {
          return '';
        }

        // Handle nested objects with name/value properties
        if (typeof value === 'object' && value !== null) {
          // If it's an object with name property (like Roset farve)
          if (value.name) {
            return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${formatLabel(key)}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(value.name)}</td></tr>`;
          }
          // If it's an object with multiple properties, format each one
          return Object.entries(value)
            .map(([subKey, subValue]) => {
              if (subValue && subValue !== '' && subValue !== null && subValue !== false) {
                return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${formatLabel(subKey)}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(subValue)}</td></tr>`;
              }
              return '';
            })
            .join('');
        }

        // Handle simple values
        return `<tr><td style="padding: 4px 8px; border-bottom: 1px solid #eee;">${formatLabel(key)}:</td><td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: bold;">${formatValue(value)}</td></tr>`;
      })
      .join('');
  };

  const formatLabel = (label) => {
    const labelMap = {
      'firstName': 'Fornavn',
      'lastName': 'Efternavn',
      'email': 'E-mail',
      'phone': 'Telefon',
      'Skolenavn': 'Skolenavn',
      'address': 'Adresse',
      'city': 'By',
      'postalCode': 'Postnummer',
      'country': 'Land',
      'notes': 'Bemærkninger',
      'deliverToSchool': 'Leveres til skole',
      'KOKARDE': 'KOKARDE',
      'Roset farve': 'Roset farve',
      'Kokarde': 'Kokarde',
      'Emblem': 'Emblem',
      'Type': 'Type',
      'TILBEHØR': 'TILBEHØR',
      'Hueæske': 'Hueæske',
      'Premium æske': 'Premium æske',
      'Huekuglepen': 'Huekuglepen',
      'Silkepude': 'Silkepude',
      'Ekstra korkarde': 'Ekstra korkarde',
      'Ekstra korkarde Text': 'Ekstra korkarde tekst',
      'Handsker': 'Handsker',
      'Stor kuglepen': 'Stor kuglepen',
      'Store kuglepen': 'Store kuglepen',
      'Smart Tag': 'Smart Tag',
      'Lyskugle': 'Lyskugle',
      'Luksus champagneglas': 'Luksus champagneglas',
      'Fløjte': 'Fløjte',
      'Trompet': 'Trompet',
      'Bucketpins': 'Bucketpins',
      'STØRRELSE': 'STØRRELSE',
      'Vælg størrelse': 'Vælg størrelse',
      'Millimeter tilpasningssæt': 'Millimeter tilpasningssæt',
      'UDDANNELSESBÅND': 'UDDANNELSESBÅND',
      'Huebånd': 'Huebånd',
      'Materiale': 'Materiale',
      'Hagerem': 'Hagerem',
      'Hagerem Materiale': 'Hagerem Materiale',
      'Broderi farve': 'Broderi farve',
      'Knap farve': 'Knap farve',
      'år': 'år',
      'BRODERI': 'BRODERI',
      'Broderifarve': 'Broderifarve',
      'Skolebroderi farve': 'Skolebroderi farve',
      'Ingen': 'Ingen',
      'BETRÆK': 'BETRÆK',
      'Farve': 'Farve',
      'Topkant': 'Topkant',
      'Kantbånd': 'Kantbånd',
      'Stjerner': 'Stjerner',
      'SKYGGE': 'SKYGGE',
      'Skyggebånd': 'Skyggebånd',
      'FOER': 'FOER',
      'Svederem': 'Svederem',
      'Sløjfe': 'Sløjfe',
      'Foer': 'Foer',
      'SatinType': 'Satin Type',
      'SilkeType': 'Silke Type',
      'EKSTRABETRÆK': 'EKSTRABETRÆK',
      'Tilvælg': 'Tilvælg'
    };
    return labelMap[label] || label;
  };

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      // Prefer showing "name" if it exists
      if (value.name) return value.name;
      if (value.value) return value.value;
      return JSON.stringify(value); // fallback
    }
    if (typeof value === 'boolean') {
      return value ? 'Ja' : 'Nej';
    }
    if (value === '') {
      return 'Ikke angivet';
    }
    if (value === 'No') return 'Nej';
    if (value === 'Yes') return 'Ja';
    if (value === 'Standard') return 'Standard';
    if (value === 'NONE') return 'NONE';
    if (value === 'INGEN') return 'INGEN';
    if (value === false) return 'Nej';
    if (value === true) return 'Ja';
    return value;
  };

  const html = `
<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ordrebekræftelse - Studentlife</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      table[class="container"] { width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, sans-serif; color:#333333; line-height:1.4;">

  <!-- Full-width wrapper -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center">
        <!-- Fixed-width container (700px) -->
        <table width="700" border="0" cellpadding="0" cellspacing="0" class="container" style="max-width:700px; width:100%;">
          <tr>
            <td style="padding:0 20px;">

              <!-- Order Information -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Kunde ordre oplysninger:</td>
                </tr>
                <tr>
                  <td style="font-size:16px; padding-bottom:15px;">Ordren er oprettet: ${orderDate.toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="background-color:#f2f3f2; padding:15px; font-weight:bold; font-size:15px; text-align:center;">Order nr: ${orderNumber}</td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Payment Information -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:30px 25px;">
                <tr>
                  <td style="font-size:19px; font-weight:bold; padding-bottom:15px;">Betalingsoplysninger</td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Oplysninger om betaleren</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Navn:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.firstName} ${customerDetails.lastName}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">E-mail:</td></tr>
                      <tr><td style="font-size:16px;">${email || customerDetails.email || 'Not Provided'}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Telefon:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.phone || 'Not Provided'}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Adresse:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.address}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Postnummer og by:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.postalCode} ${customerDetails.city}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Delivery Information -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:30px 25px; margin-bottom:20px;">
                <tr>
                  <td style="font-size:19px; font-weight:bold; padding-bottom:15px;">Leveringsoplysninger</td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Navn:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.firstName} ${customerDetails.lastName}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Adresse:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.address}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Postnummer og by:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.postalCode} ${customerDetails.city}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Skole navn:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.Skolenavn}</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">levering til skolen:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.deliverToSchool ? "Ja" : "Nej"}</td></tr>
                    </table>
                  </td>
                </tr>
                ${customerDetails.notes ? `
                <tr>
                  <td style="padding-bottom:10px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:15px; padding-bottom:5px;">Levering:</td></tr>
                      <tr><td style="font-size:16px;">${customerDetails.notes}</td></tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Order Details Header -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#ffffff; padding:30px 20px 10px 20px; font-weight:bold; font-size:18px;">Ordre detaljer</td>
                </tr>
              </table>

              <!-- Package Summary -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#fbfbfb;">
                <tr>
                  <td style="padding:30px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr><td style="font-weight:bold; font-size:18px; padding-bottom:10px;">${packageName}</td></tr>
                      <tr>
                        <td style="font-size:16px;">
                          <span style="font-weight:bold; margin-right:5px;">Pris:</span>
                          <span>${totalPrice} DKK</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Product Details Area -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:40px 30px;">

                <!-- Kokarde -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Kokarde</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Roset farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE['Roset farve'].name}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Kokarde type</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Kokarde}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Emblem</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Emblem.name}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Emblem type</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Type}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Uddannelsesbånd -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Uddannelsesbånd</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Huebånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.Huebånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Materiale</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.Materiale}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Hagerem</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.Hagerem}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Broderi foran (Conditional) -->
                ${!selectedOptions.UDDANNELSESBÅND["Broderi foran"] ? `` : `
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Broderi foran</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Tekst maks. 20 tegn</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND["Broderi foran"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Broderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND["Broderi farve"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`}

                <!-- Broderi Bagpå -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Broderi Bagpå</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI["Navne broderi"] ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Navnebroderi (Tekst) maks. 26</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI["Navne broderi"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Broderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI?.Broderifarve || 'Ikke valgt'}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI.Skolebroderi ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skolebroderi (Tekst) maks. 35</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI.Skolebroderi}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Broderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI?.['Skolebroderi farve'] || 'Ikke valgt'}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Knap Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND['Knap farve']}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">År</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.UDDANNELSESBÅND.år}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Skygge -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Skygge</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Type</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.SKYGGE.Type}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.SKYGGE.Type === 'Glimmer' ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Materiale</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.SKYGGE.Materiale}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skyggebånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.SKYGGE.Skyggebånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Linje 1</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 1"] ? 'Ikke valgt' : selectedOptions.SKYGGE["Skyggegravering Line 1"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Linje 2</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 2"] ? 'Ikke valgt' : selectedOptions.SKYGGE["Skyggegravering Line 2"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Linje 3</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.SKYGGE["Skyggegravering Line 3"] ? 'Ikke valgt' : selectedOptions.SKYGGE["Skyggegravering Line 3"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>


                <!-- Størrelse -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Størrelse</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Vælg størrelse (Size)</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.STØRRELSE["Vælg størrelse"]}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Millimeter tilpasningssæt</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.STØRRELSE["Millimeter tilpasningssæt"] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Betræk -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Betræk</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Farve}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Topkant</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Topkant === 'NONE' || selectedOptions.BETRÆK.Topkant === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Topkant}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${!shouldHideSelectors ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Kantbånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Kantbånd === 'NONE' || selectedOptions.BETRÆK.Kantbånd === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Kantbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Stjerner === 'NONE' || selectedOptions.BETRÆK.Stjerner === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Stjerner}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.BETRÆK.Stjerner === "INGEN" ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Emblem.name}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Flagbånd</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.BETRÆK.Flagbånd ? 'Fravalgt' : selectedOptions.BETRÆK.Flagbånd == 'Nej' ? 'Fravalgt' : selectedOptions.BETRÆK.Flagbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Foer -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Foer</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Svederem</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Svederem}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Farve}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Sløjfe</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Sløjfe}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Forring</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.FOER.Foer}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${!selectedOptions.FOER || !selectedOptions.FOER['Satin Type'] ? '' : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Satin Color</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.FOER['Satin Type'] ? 'Ikke valgt' : selectedOptions.FOER['Satin Type']}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ${!selectedOptions.FOER || !selectedOptions.FOER['Silk Type'] ? '' : `
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Silk Color</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.FOER['Silk Type'] ? 'Ikke valgt' : selectedOptions.FOER['Silk Type']}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Extra Cover -->
                <tr>
                  <td style="padding-bottom:25px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Ekstra betræk</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Tilvælg</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Tilvælg === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.EKSTRABETRÆK.Tilvælg === 'Ja' ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Farve}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Topkant</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Topkant === 'NONE' || selectedOptions.EKSTRABETRÆK.Topkant === 'None' ? 'Ingen' : selectedOptions.EKSTRABETRÆK.Topkant}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${!shouldHideSelectors ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Kantbånd</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.EKSTRABETRÆK.Kantbånd === 'NONE' || selectedOptions.EKSTRABETRÆK.Kantbånd === 'None' ? 'Ingen' : selectedOptions.EKSTRABETRÆK.Kantbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Flagbånd</td></tr>
                                  <tr><td style="font-size:16px;">${!selectedOptions.EKSTRABETRÆK.Flagbånd ? 'Fravalgt' : selectedOptions.EKSTRABETRÆK.Flagbånd == 'Nej' ? 'Fravalgt' : selectedOptions.EKSTRABETRÆK.Flagbånd}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BETRÆK.Stjerner === 'NONE' || selectedOptions.BETRÆK.Stjerner === 'None' ? 'Ingen' : selectedOptions.BETRÆK.Stjerner}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.BETRÆK.Stjerner === "INGEN" ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stjerner farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.KOKARDE.Emblem.name}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ` : ''}
                            ${!selectedOptions.BRODERI || !selectedOptions.BRODERI.Skolebroderi ? `` : `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skolebroderi</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI.Skolebroderi}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Skolebroderi farve</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.BRODERI['Skolebroderi farve']}</td></tr>
                                </table>
                              </td>
                            </tr>`}
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Tilbehør -->
                <tr>
                  <td style="padding-top:20px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#333333;">Tilbehør</td>
                      </tr>
                      <tr>
                        <td style="background-color:#f7f8f7; padding:20px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Hueæske</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Hueæske}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ${selectedOptions.TILBEHØR['Premium æske'] ? `
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Premium æske</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Premium æske']}</td></tr>
                                </table>
                              </td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Huekuglepen</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Huekuglepen === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Silkepude</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Silkepude === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Ekstra Kokarde</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Ekstra korkarde'] === 'Fravalgt' ? 'Fravalgt' : selectedOptions.TILBEHØR['Ekstra korkarde Text']}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Handsker</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Handsker === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Stor kuglepen</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR["Store kuglepen"] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Smarttag</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR["Smart Tag"] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Lille flag</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Lille Flag'] === 'Fravalgt' ? 'Fravalgt' : selectedOptions.TILBEHØR['Lille Flag Text']}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Fløjte</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Fløjte === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Lyskugle</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Lyskugle === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Luksus champagneglas</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR['Luksus champagneglas'] === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-bottom:1px solid #cdcdcd; padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Trompet</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Trompet === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                  <tr><td style="font-size:14px; text-transform:uppercase; padding-bottom:5px;">Bucketpins</td></tr>
                                  <tr><td style="font-size:16px;">${selectedOptions.TILBEHØR.Bucketpins === 'Ja' ? 'Ja' : 'Fravalgt'}</td></tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Footer Total -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="footer-total" style="background-color: #f2f3f2; padding: 20px; margin-top: 30px; margin-bottom: 30px;">
                            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">Total: ${totalPrice} DKK</div>
                            <div style="font-size: 14px; text-transform: uppercase;">Inklusiv moms</div>
                            <hr style="border: none; border-top: 1px solid #cdcdcd; margin: 15px 0;">
                            <div style="margin-bottom: 5px; font-size: 14px; text-transform: uppercase;">SUM: ${orderSum} DKK</div>
                            <div style="margin-bottom: 5px; font-size: 14px; text-transform: uppercase;">LEVERING: ${handlingFee} DKK</div>
                            <div style="margin-bottom: 5px; font-size: 14px; text-transform: uppercase;">MOMS: ${(totalPrice * 0.20).toFixed(2)} DKK</div>
                        </td>
                    </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;



  // Enhanced text version formatting
  const text = `
PREMIUM KVALITET & PERSONLIGT DESIGN
=====================================

Kære ${customerDetails.firstName} ${customerDetails.lastName},

Tak for din bestilling hos Studentlife.

Din bestilling med ordrenummer: ${orderNumber} er nu betalt.
Husk at tjekke, at alle detaljer er korrekte, herunder leveringstid (3 måneder fra bestilling, medmindre det er ekspres), skolens logo samt skolebroderi.

Vi håber, at du kommer til at elske din studenterhue.


ORDREOPLYSNINGER
-----------------
Ordren er oprettet: ${new Date(orderDate).toLocaleString('da-DK')}
Ordrenummer: ${orderNumber}


BETALINGSINFORMATION
---------------------
Navn: ${customerDetails.firstName} ${customerDetails.lastName}
Adresse: ${customerDetails.address}
Post & By: ${customerDetails.postalCode} ${customerDetails.city}


LEVERINGSINFORMATION
---------------------
Navn: ${customerDetails.firstName} ${customerDetails.lastName}
Adresse: ${customerDetails.address}
Post & By: ${customerDetails.postalCode} ${customerDetails.city}
Skole navn:: ${customerDetails.Skolenavn}
levering til skolen: ${customerDetails.deliverToSchool ? "Ja" : "Nej"}
${customerDetails.notes ? `Leveringsnote: ${customerDetails.notes}` : ''}


ORDRE DETALJER
---------------
${selectedOptions?.pakke?.name ? `Valgt pakke: ${selectedOptions.pakke.name}` : ''}
${selectedOptions?.pakke?.price ? `Pris: ${selectedOptions.pakke.price} DKK` : ''}

Information om huen:
--------------------
${Object.entries(selectedOptions)
      .map(([category, options]) => {
        const hasOptions = Object.values(options).some(val =>
          val && val !== '' && val !== null && val !== false &&
          !(typeof val === 'object' && Object.keys(val).length === 0)
        );
        if (!hasOptions) return '';

        const optionsText = Object.entries(options)
          .map(([key, value]) => {
            if (!value || value === '' || value === null || value === false) return '';

            if (typeof value === 'object' && value !== null) {
              if (value.name) {
                return `${formatLabel(key)}: ${formatValue(value.name)}`;
              }
              return Object.entries(value)
                .map(([subKey, subValue]) => {
                  if (subValue && subValue !== '' && subValue !== null && subValue !== false) {
                    return `${formatLabel(subKey)}: ${formatValue(subValue)}`;
                  }
                  return '';
                })
                .filter(Boolean)
                .join('\n');
            }
            return `${formatLabel(key)}: ${formatValue(value)}`;
          })
          .filter(Boolean)
          .join('\n');

        return `${formatLabel(category).toUpperCase()}\n${optionsText}\n`;
      })
      .filter(Boolean)
      .join('\n')}


TOTAL
------
Total: ${totalPrice} ${currency}
Inklusiv moms
------
SUM: ${orderSum} ${currency}
LEVERING: ${handlingFee} ${currency}
Inklusiv moms
MOMS: 20% of the total price DKK (vat)



`;


  return {
    subject: `Tak for din bestilling hos Studentlife`,
    html,
    text
  };
};

const sendCapEmail = async (req, res) => {
  try {
    const {
      customerDetails,
      selectedOptions,
      totalPrice,
      currency,
      orderNumber,
      orderDate,
      email,
      packageName,
      program
    } = req.body;




    // Validate required fields
    if (!customerDetails || !selectedOptions || !email) {
      return res.status(400).json({
        message: 'Missing required fields: customerDetails, selectedOptions, and email are required'
      });
    }

    const transporter = createEmailTransporter();
    const emailContent = capOrderEmail({
      customerDetails,
      selectedOptions,
      totalPrice: totalPrice || '299.00',
      currency: currency || 'DKK',
      orderNumber: orderNumber || `CAP-${Date.now()}`,
      orderDate: orderDate || new Date().toISOString(),
      packageName: packageName,
      program: program,
      email: email
    });
    const emailContentAdmin = capOrderAdminEmail({
      customerDetails,
      selectedOptions,
      totalPrice: totalPrice || '299.00',
      currency: currency || 'DKK',
      orderNumber: orderNumber || `CAP-${Date.now()}`,
      orderDate: orderDate || new Date().toISOString(),
      packageName: packageName,
      program: program,
      email: email
    });
    const emailContentFactory = factoryOrderEmail({
      customerDetails,
      selectedOptions,
      totalPrice: totalPrice || '299.00',
      currency: currency || 'DKK',
      orderNumber: orderNumber || `CAP-${Date.now()}`,
      orderDate: orderDate || new Date().toISOString(),
      packageName: packageName,
      program: program,
      email: email
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const mailOptionsAdmin = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'salg@studentlife.dk',
      subject: emailContentAdmin.subject,
      html: emailContentAdmin.html,
      text: emailContentAdmin.text
    };

    const mailOptionsFactory = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: 'salg@studentlife.dk',
      subject: emailContentFactory.subject,
      html: emailContentFactory.html,
      text: emailContentFactory.text
    };
    // Send email
    const emailResult = await transporter.sendMail(mailOptions);
    const emailResultAdmin = await transporter.sendMail(mailOptionsAdmin);
    const emailResultFactory = await transporter.sendMail(mailOptionsFactory);

    // Optionally save to database using Prisma
    try {
      const orderData = {
        customerDetails,
        selectedOptions,
        totalPrice: parseFloat(totalPrice) || 299.00,
        currency: currency || 'DKK',
        orderNumber: orderNumber || `CAP-${Date.now()}`,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        customerEmail: email,
        status: 'PENDING'
      };

      // const result = await prisma.order.create({
      //   data: orderData
      // });

      res.status(200).json({
        message: 'Order created and email sent successfully',
        // orderId: result.id,
        // orderNumber: result.orderNumber,
        emailResult: {
          messageId: emailResult.messageId,
          accepted: emailResult.accepted
        }
      });
    } catch (dbError) {
      console.error('Database Error:', dbError);
      // Still return success for email even if DB fails
      res.status(200).json({
        message: 'Email sent successfully but database save failed',
        emailResult: {
          messageId: emailResult.messageId,
          accepted: emailResult.accepted
        },
        warning: 'Order not saved to database'
      });
    }

  } catch (error) {
    console.error('Send Cap Email Error:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

const stripePayment = async (req, res) => {
  const {
    customerDetails,
    selectedOptions,
    totalPrice,
    currency,
    orderNumber,
    orderDate,
    email,
    packageName,
    program } = req.body;

  try {
    const order = await prisma.order.create({
      data: {
        customerDetails,
        selectedOptions,
        totalPrice: parseFloat(totalPrice),
        currency,
        orderNumber,
        orderDate,
        customerEmail: email,
        status: 'PENDING',
        packageName: packageName,
        program: program
      }
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "dkk",
            product_data: {
              name: `Cap Order : ${order.orderNumber}`,
            },
            unit_amount: totalPrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      locale: "da",
      success_url: `https://shop.studentlife.dk/thankyou/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "https://elipsestudio.com/devstudentlife/cancel",
      metadata: {
        orderId: order.id,   // 👈 only store a small reference here
      },
    });
    res.json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const getSessionDetails = async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // ✅ RAW BODY use ho rahi hai
    event = stripe.webhooks.constructEvent(
      req.body, // ⚠️ RAW buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Webhook verified");

  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ handle event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const orderId = session.metadata.orderId;

    try {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) }
      });

      if (!order) {
        console.log("❌ Order not found");
        return res.json({ received: true });
      }

      await sendCapEmail(
        {
          body: {
            customerDetails: order.customerDetails,
            selectedOptions: order.selectedOptions,
            totalPrice: order.totalPrice,
            currency: order.currency,
            orderNumber: order.orderNumber,
            orderDate: order.orderDate,
            email: order.customerEmail,
            packageName: order.packageName,
            program: order.program
          }
        },
        { status: () => ({ json: () => { } }) }
      );

      console.log("✅ Email sent");

    } catch (err) {
      console.error("❌ Email error:", err.message);
    }
  }

  res.json({ received: true });
};

const emailTester = async (req, res) => {
  const {
    customerDetails,
    selectedOptions,
    totalPrice,
    currency,
    orderNumber,
    orderDate,
    email,
    packageName,
    program
  } = req.body;



  try {
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);





    // Send emails


    await sendCapEmail(
      {
        body: {
          customerDetails: customerDetails,
          selectedOptions: selectedOptions,
          totalPrice: totalPrice,
          currency: currency,
          orderNumber: orderNumber,
          orderDate: orderDate,
          email: email,
          packageName: packageName,
          program: program
        }
      },
      { status: () => ({ json: () => { } }) }
    );



    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};


module.exports = {
  workflowStatusChange, sendCapEmail, stripePayment, getSessionDetails, stripeWebhook, emailTester
};
