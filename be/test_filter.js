const programs = [
  'STX', 'HHX', 'HTX', 'HF', 'EUD', 'EUX',
  'sosuassistent', 'sosuhjælper', 'frisør', 'kosmetolog', 'pædagog', 'pau', 'ernæringsassisten'
];

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

function isRelevantForProgram(item, activeProgram) {
  const activeUpper = activeProgram.toUpperCase();
  // We check if the item contains ANY program name that is NOT the active program.
  // If it does, it's specific to another program.
  for (const prog of programs) {
    const progUpper = prog.toUpperCase();
    if (progUpper === activeUpper) continue; // It's fine if it contains the active program
    
    // Check if the item contains another program's name
    // We need to be careful with short names like HF or HTX.
    // e.g. "HF" shouldn't match "HALF" but we have exact matches usually.
    // Let's use word boundaries or just exact includes for specific ones.
    const regex = new RegExp(`\\b${progUpper}\\b`, 'i');
    
    // Special cases for colors like SosuSort or EuxRed
    if (progUpper === 'EUX' && item.toLowerCase().includes('eux')) return false;
    if (progUpper === 'SOSUASSISTENT' || progUpper === 'SOSUHJÆLPER') {
        if (item.toLowerCase().includes('sosu')) return false;
    }
    
    if (regex.test(item)) {
      return false; // Found another program's name
    }
  }
  return true;
}

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
