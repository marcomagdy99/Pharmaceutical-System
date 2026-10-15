const fs = require('fs');
const path = require('path');

const prods = ['prod1', 'prod2', 'prod3', 'prod4', 'prod5', 'prod6'];
const results = {};
for (const p of prods) results[p] = [];

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'scratch' && f !== 'dist') scan(full);
    } else if (full.endsWith('.js') || full.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const p of prods) {
        if (content.includes(`"${p}"`) || content.includes(`'${p}'`) || content.includes(`\`${p}\``)) {
          results[p].push(full);
        }
      }
    }
  }
}

scan('.');
console.log('=== PRODUCT USAGES ===');
for (const p of prods) {
  console.log(`${p}: ${results[p].join(', ')}`);
}
