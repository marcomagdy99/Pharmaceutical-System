const fs = require('fs');
const path = require('path');

const pList = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
const found = [];

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'scratch' && f !== 'dist') scan(full);
    } else if (full.endsWith('.js') || full.endsWith('.html')) {
      if (full.includes('app.js')) continue;
      const content = fs.readFileSync(full, 'utf8');
      for (const p of pList) {
        if (content.includes(`"${p}"`) || content.includes(`'${p}'`)) {
          found.push(`${full}: ${p}`);
        }
      }
    }
  }
}

scan('.');
console.log('p1-p7 found outside app.js:', found);
