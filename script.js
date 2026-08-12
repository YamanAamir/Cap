const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/pc/Desktop/Cap/fe/src/Default';
const files = fs.readdirSync(dir);
files.forEach(file => {
    if (file.endsWith('.jsx')) {
        const filepath = path.join(dir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        const lines = content.split('\n');
        const newLines = lines.filter(line => !line.includes('rrelse\": 49.5'));
        fs.writeFileSync(filepath, newLines.join('\n'), 'utf8');
    }
});
