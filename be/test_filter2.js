const programs = [
  'STX', 'HHX', 'HTX', 'HF', 'EUD', 'EUX',
  'sosuassistent', 'sosuhjælper', 'frisør', 'kosmetolog', 'pædagog', 'pau', 'ernæringsassisten'
];

const PROGRAM_KEYWORDS = {
  'STX': ['stx'],
  'HHX': ['hhx'],
  'HTX': ['htx'],
  'HF': ['hf '], // space to avoid matching half etc if they existed
  'EUD': ['eud'],
  'EUX': ['eux'],
  'sosuassistent': ['sosu'],
  'sosuhjælper': ['sosu'],
  'frisør': ['frisør'],
  'kosmetolog': ['kosmetolog'],
  'pædagog': ['pædagog'],
  'pau': ['pau'],
  'ernæringsassisten': ['ernæring']
};

function isRelevantForProgram(item, activeProgram) {
  const itemLower = item.toLowerCase();
  
  // 1. Gather all keywords that belong ONLY to other programs
  let otherKeywords = [];
  
  const activeKeywords = PROGRAM_KEYWORDS[activeProgram] || [];
  
  for (const [prog, keywords] of Object.entries(PROGRAM_KEYWORDS)) {
    if (prog !== activeProgram) {
      for (const kw of keywords) {
        // If the active program doesn't also use this keyword
        if (!activeKeywords.includes(kw)) {
          otherKeywords.push(kw);
        }
      }
    }
  }
  
  // 2. Check if the item contains any of the other programs' exclusive keywords
  for (const kw of otherKeywords) {
    if (itemLower.includes(kw)) {
      // Exception for HF because it's short, let's use word boundary for all actually
      const regex = new RegExp(`\\b${kw.trim()}\\b`, 'i');
      // For some cases like euxred or sosusort, word boundary might fail if they are combined.
      // So if it's eux or sosu, we can just do includes.
      if (kw === 'eux' || kw === 'sosu' || kw === 'hhx' || kw === 'htx' || kw === 'stx') {
         if (itemLower.includes(kw)) return false;
      } else {
         if (regex.test(itemLower)) return false;
      }
    }
  }
  
  return true;
}

const itemNames = [
  '#7F1D1D',
  '#DC2626',
  'HHX Guld Simli',
  'STX Guld Simli',
  'Atom HTX Guld',
  'EUX Guld',
  'HF Sølv',
  'Ahornblad Guld',
  'SosuSort',
  'EuxRed',
  'HHX',
  'Sort'
];

for (const active of ['STX', 'HHX', 'EUX', 'sosuassistent']) {
  console.log(`\n--- Active: ${active} ---`);
  for (const item of itemNames) {
    if (isRelevantForProgram(item, active)) {
      console.log(`  [x] ${item}`);
    } else {
      console.log(`  [ ] ${item}`);
    }
  }
}
