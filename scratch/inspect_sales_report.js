const fs = require('fs');
const c = fs.readFileSync('js/sales-report.js', 'utf8');
c.split(/\r?\n/).forEach((l, idx) => {
  if (/[\u0600-\u06FF]/.test(l)) {
    console.log(`L${idx + 1}: ${l.trim()}`);
  }
});
