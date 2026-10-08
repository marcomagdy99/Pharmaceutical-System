const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"rep2"') || lines[i].includes("'rep2'")) {
    console.log(`Line ${i+1}: ${lines.slice(Math.max(0, i-2), i+15).join('\n')}`);
    break;
  }
}
