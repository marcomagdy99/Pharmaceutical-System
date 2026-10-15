const fs = require('fs');
const path = require('path');

const oldHashes = [
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'd041f6dd2d671f68144bd4d667f96a6146dbf2ed0f71f19b532ce1e2826f8f92',
  '89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b',
  'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869',
  '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2',
  'ae087349bb953601482c9c52169257c0cb0371cbac3d921b5896a9aba8cc8a43',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  '070a3b5e8d4bd5c46acccb91c9c54614c0cd649e78c4c4719e3a64270bae5ddf'
];

const results = {};
for (const h of oldHashes) results[h] = [];

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'scratch' && f !== 'dist') scan(full);
    } else if (full.endsWith('.js') || full.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      for (const h of oldHashes) {
        if (content.includes(h)) {
          results[h].push(full);
        }
      }
    }
  }
}

scan('.');
console.log('=== OLD HASH OCCURRENCES ===');
for (const h of oldHashes) {
  console.log(`${h.slice(0, 10)}...: ${results[h].join(', ')}`);
}
