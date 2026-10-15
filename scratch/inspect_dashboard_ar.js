const fs = require('fs');
const c = fs.readFileSync('js/dashboard.js', 'utf8');
const lines = c.split(/\r?\n/);
const matches = [];
lines.forEach((l, idx) => {
  if (/[\u0600-\u06FF]/.test(l)) {
    matches.push({ line: idx + 1, text: l.trim() });
  }
});

console.log(`Total Arabic lines in dashboard.js: ${matches.length}`);
matches.slice(0, 30).forEach(m => console.log(`L${m.line}: ${m.text}`));
