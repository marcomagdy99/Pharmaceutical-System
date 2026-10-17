const fs = require('fs');

const content = fs.readFileSync('css/calendar.css', 'utf8');
const lines = content.split(/\r?\n/);

console.log('--- CALENDAR.CSS HEX LINES SAMPLE ---');
const hexLines = [];
lines.forEach((line, i) => {
  if (line.match(/#[0-9a-fA-F]{3,8}\b/)) {
    hexLines.push({ lineNum: i + 1, line: line.trim() });
  }
});

console.log(`Total lines with hex in calendar.css: ${hexLines.length}`);
console.log('Sample first 25:');
hexLines.slice(0, 25).forEach(h => console.log(`${h.lineNum}: ${h.line}`));
console.log('\nSample last 25:');
hexLines.slice(-25).forEach(h => console.log(`${h.lineNum}: ${h.line}`));
