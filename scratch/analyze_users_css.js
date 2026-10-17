const fs = require('fs');

const content = fs.readFileSync('css/users.css', 'utf8');
const lines = content.split(/\r?\n/);

const occurrences = [];
lines.forEach((line, index) => {
  const matches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
  if (matches) {
    matches.forEach(hex => {
      occurrences.push({ lineNum: index + 1, hex: hex.toLowerCase(), text: line.trim() });
    });
  }
});

console.log('Total hex occurrences in users.css:', occurrences.length);
const counts = {};
occurrences.forEach(o => { counts[o.hex] = (counts[o.hex] || 0) + 1; });
console.log('Unique hex colors:', Object.entries(counts).sort((a,b) => b[1] - a[1]));

fs.writeFileSync('scratch/users_hex_report.json', JSON.stringify(occurrences, null, 2));
console.log('Saved report to scratch/users_hex_report.json');
