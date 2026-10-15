const fs = require('fs');
const path = require('path');

const lines = ['line1', 'line2'];
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
      const fileLines = content.split('\n');
      fileLines.forEach((l, i) => {
        for (const line of lines) {
          if (l.includes(`"${line}"`) || l.includes(`'${line}'`) || l.includes(`\`${line}\``)) {
            found.push(`${full} (L${i+1}): ${l.trim().slice(0, 100)}`);
          }
        }
      });
    }
  }
}

scan('.');
console.log('=== LINE OCCURRENCES ===');
found.forEach(x => console.log(x));
