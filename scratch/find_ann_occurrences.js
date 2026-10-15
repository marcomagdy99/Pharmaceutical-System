const fs = require('fs');
const path = require('path');

const annList = ['ann1', 'ann2', 'ann3', 'ann4', 'ann5', 'ann6', 'ann7', 'ann8'];
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
      for (const a of annList) {
        if (content.includes(`"${a}"`) || content.includes(`'${a}'`)) {
          found.push(`${full}: ${a}`);
        }
      }
    }
  }
}

scan('.');
console.log('ann1-ann8 found:', found);
