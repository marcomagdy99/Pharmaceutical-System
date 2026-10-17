const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

const currencyMatches = [];
const dateMatches = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('EGP') || line.includes('formatCurrency') || line.includes('formatMoney')) {
      currencyMatches.push({ file, line: idx + 1, text: line.trim() });
    }
    if (line.includes('formatDate') || line.includes('toLocaleDateString') || line.includes('toISOString().slice(0, 10)')) {
      dateMatches.push({ file, line: idx + 1, text: line.trim() });
    }
  });
});

console.log('--- Sample Currency Matches ---');
console.log(JSON.stringify(currencyMatches.slice(0, 15), null, 2));

console.log('--- Sample Date Matches ---');
console.log(JSON.stringify(dateMatches.slice(0, 15), null, 2));
