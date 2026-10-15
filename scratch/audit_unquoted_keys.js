const fs = require('fs');
const path = require('path');

const userIds = [
  'rep1', 'rep2', 'rep3', 'rep4', 'rep5',
  'admin1', 'bu1', 'lm1', 'lm2',
  'dm1', 'dm2', 'dm3', 'hr1', 'pm1', 'pm2'
];

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
        for (const id of userIds) {
          // Check for word boundary \b${id}\b
          const r = new RegExp(`\\b${id}\\b`, 'g');
          if (r.test(l)) {
            found.push(`${full}:${i+1} [${id}]: ${l.trim()}`);
          }
        }
      });
    }
  }
}

scan('.');
console.log('=== UNQUOTED / WORD-BOUNDARY USER ID OCCURRENCES ===');
found.forEach(x => console.log(x));
