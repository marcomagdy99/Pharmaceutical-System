const fs = require('fs');
const c = fs.readFileSync('js/dashboard.js', 'utf8');
const lines = c.split(/\r?\n/);
let output = '';
lines.forEach((l, idx) => {
  if (/[\u0600-\u06FF]/.test(l)) {
    output += `L${idx + 1}: ${l}\n`;
  }
});
fs.writeFileSync('scratch/all_dashboard_ar.txt', output, 'utf8');
console.log('Dumped all dashboard ar lines to scratch/all_dashboard_ar.txt');
