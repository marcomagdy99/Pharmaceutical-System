const fs = require('fs');

const lines = fs.readFileSync('js/dashboard.js', 'utf8').split('\n');
const arLines = [];
lines.forEach((l, i) => {
  if (/[\u0600-\u06FF]/.test(l)) {
    arLines.push({ lineNum: i + 1, text: l });
  }
});

fs.writeFileSync('scratch/all_dashboard_ar.json', JSON.stringify(arLines, null, 2), 'utf8');
console.log('Saved', arLines.length, 'lines to scratch/all_dashboard_ar.json');
