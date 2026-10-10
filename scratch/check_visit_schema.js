const fs = require('fs');

const visitsContent = fs.readFileSync('js/visits.js', 'utf8');
const lines = visitsContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('feedback') || lines[i].includes('notes') || lines[i].includes('targetName')) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    if (i > 300) break;
  }
}
