const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

let toLocaleCount = 0;
let toFixedCount = 0;

jsFiles.forEach(file => {
  const c = fs.readFileSync(file, 'utf8');
  toLocaleCount += (c.match(/\.toLocaleString\(/g) || []).length;
  toFixedCount += (c.match(/\.toFixed\(/g) || []).length;
});

console.log('toLocaleString occurrences:', toLocaleCount);
console.log('toFixed occurrences:', toFixedCount);
