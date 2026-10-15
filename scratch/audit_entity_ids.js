const fs = require('fs');
const path = require('path');

const entities = {
  areas: ['area1', 'area2', 'area3', 'area4'],
  lines: ['line1', 'line2'],
  pharmacies: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
  distributors: ['dist1', 'dist2', 'dist3'],
  announcements: ['ann1', 'ann2', 'ann3', 'ann4', 'ann5', 'ann6', 'ann7', 'ann8']
};

const counts = {};
const occurrences = {};

for (const cat in entities) {
  counts[cat] = {};
  occurrences[cat] = {};
  for (const id of entities[cat]) {
    counts[cat][id] = 0;
    occurrences[cat][id] = [];
  }
}

function scanFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('scratch') || filePath.includes('dist')) return;
  if (!filePath.endsWith('.js') && !filePath.endsWith('.html')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  for (const cat in entities) {
    for (const id of entities[cat]) {
      // Regex for exact quoted token: 'id', "id", `id`
      const r = new RegExp(`(['"\`])${id}\\1`, 'g');
      const matches = content.match(r);
      if (matches) {
        counts[cat][id] += matches.length;
        occurrences[cat][id].push(`${filePath} (${matches.length})`);
      }
    }
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (dir === '.') {
        if (f === 'js') scanDir(full);
      }
    } else {
      scanFile(full);
    }
  }
}

scanDir('.');
scanDir('js');

console.log('=== AUDIT OF DEMO ENTITY IDs ===');
for (const cat in entities) {
  console.log(`\n--- Category: ${cat} ---`);
  for (const id of entities[cat]) {
    console.log(`${id} [${counts[cat][id]} times]: ${occurrences[cat][id].join(', ')}`);
  }
}
