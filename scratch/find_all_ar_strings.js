const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\DeLL\\OneDrive\\Desktop\\pharma-rep\\Pharmaceutical-System';
const arabicRegex = /[\u0600-\u06FF]/;

const files = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'));

files.forEach(f => {
  if (f === 'egypt-bricks-data.js') return; // ignore geo dataset
  const full = path.join(root, 'js', f);
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n');
  const arLines = [];
  lines.forEach((l, i) => {
    if (arabicRegex.test(l)) {
      arLines.push({ line: i + 1, text: l.trim() });
    }
  });
  if (arLines.length > 0) {
    console.log(`\n=== File: js/${f} (${arLines.length} Arabic lines) ===`);
    arLines.forEach(item => {
      console.log(`  L${item.line}: ${item.text.slice(0, 100)}`);
    });
  }
});
