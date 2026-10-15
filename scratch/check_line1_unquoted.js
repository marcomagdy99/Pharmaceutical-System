const fs = require('fs');
const path = require('path');

const found = [];
function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'scratch' && f !== 'dist') scan(full);
    } else if (full.endsWith('.js') || full.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, i) => {
        // match line1 without quotes
        const withoutQuotes = l.replace(/(['"`])line1\1/g, '');
        if (withoutQuotes.includes('line1')) {
          found.push(`${full}:${i+1}: ${l.trim()}`);
        }
      });
    }
  }
}
scan('.');
console.log('line1 without quotes:', found);
