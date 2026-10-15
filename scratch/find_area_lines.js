const fs = require('fs');
const path = require('path');

const areas = ['area1', 'area2', 'area3', 'area4'];
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
        for (const a of areas) {
          if (l.includes(`"${a}"`) || l.includes(`'${a}'`) || l.includes(`\`${a}\``)) {
            found.push(`${full} (L${i+1}): ${l.trim().slice(0, 100)}`);
          }
        }
      });
    }
  }
}

scan('.');
console.log('=== AREA OCCURRENCES ===');
found.forEach(x => console.log(x));
