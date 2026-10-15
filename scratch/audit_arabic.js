const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\DeLL\\OneDrive\\Desktop\\pharma-rep\\Pharmaceutical-System';
const arabicRegex = /[\u0600-\u06FF]/;

const results = {};

function scan(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === 'scratch' || item === '.git') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scan(fullPath);
    } else if (item.endsWith('.html') || item.endsWith('.js') || item.endsWith('.css')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const matches = [];
      lines.forEach((line, idx) => {
        if (arabicRegex.test(line)) {
          matches.push({ line: idx + 1, snippet: line.trim().slice(0, 100) });
        }
      });
      if (matches.length > 0) {
        results[path.relative(root, fullPath).replace(/\\/g, '/')] = matches;
      }
    }
  }
}

scan(root);
console.log('=== Files containing Arabic text ===');
let totalOccurrences = 0;
for (const [file, matches] of Object.entries(results)) {
  totalOccurrences += matches.length;
  console.log(`\n[${file}] - ${matches.length} occurrences:`);
  matches.slice(0, 5).forEach(m => console.log(`   L${m.line}: ${m.snippet}`));
  if (matches.length > 5) {
    console.log(`   ... and ${matches.length - 5} more lines`);
  }
}
console.log(`\nTotal files: ${Object.keys(results).length}, Total lines with Arabic: ${totalOccurrences}`);
