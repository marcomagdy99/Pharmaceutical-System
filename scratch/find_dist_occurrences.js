const fs = require('fs');
const path = require('path');

const distList = ['dist1', 'dist2', 'dist3'];
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
      for (const d of distList) {
        if (content.includes(`"${d}"`) || content.includes(`'${d}'`)) {
          found.push(`${full}: ${d}`);
        }
      }
    }
  }
}

scan('.');
console.log('dist1-dist3 found:', found);
