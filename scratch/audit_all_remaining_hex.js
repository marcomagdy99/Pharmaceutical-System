const fs = require('fs');
const path = require('path');

const cssDir = 'css';
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

const stats = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
  const matches = content.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  stats.push({ file, count: matches.length });
});

stats.sort((a,b) => b.count - a.count);

console.log('=== CURRENT STATUS OF ALL CSS FILES ===\n');
stats.forEach(s => {
  console.log(`${s.file.padEnd(20)}: ${s.count} hex colors remaining`);
});

const total = stats.reduce((acc, curr) => acc + curr.count, 0);
console.log(`\nTotal hex occurrences across entire repo: ${total}`);
