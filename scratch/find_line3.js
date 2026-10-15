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
      if (content.includes('line3')) {
        found.push(full);
      }
    }
  }
}
scan('.');
console.log('line3 found in:', found);
