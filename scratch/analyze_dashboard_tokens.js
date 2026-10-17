const fs = require('fs');

const content = fs.readFileSync('css/dashboard.css', 'utf8');
const lines = content.split(/\r?\n/);

console.log('--- DASHBOARD.CSS HEX LINES SAMPLE ---');
const hexLines = [];
lines.forEach((line, i) => {
  if (line.match(/#[0-9a-fA-F]{3,8}\b/)) {
    hexLines.push({ lineNum: i + 1, line: line.trim() });
  }
});

console.log(`Total lines with hex in dashboard.css: ${hexLines.length}`);
console.log('Sample first 30:');
hexLines.slice(0, 30).forEach(h => console.log(`${h.lineNum}: ${h.line}`));
console.log('\nSample last 30:');
hexLines.slice(-30).forEach(h => console.log(`${h.lineNum}: ${h.line}`));
