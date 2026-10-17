const fs = require('fs');

const content = fs.readFileSync('css/activities.css', 'utf8');
const lines = content.split(/\r?\n/);

const colorMap = {};
lines.forEach((line, i) => {
  const matches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
  if (matches) {
    matches.forEach(hex => {
      const h = hex.toLowerCase();
      if (!colorMap[h]) colorMap[h] = [];
      colorMap[h].push({ lineNum: i + 1, line: line.trim() });
    });
  }
});

console.log('--- TOP HEX COLORS IN ACTIVITIES.CSS ---');
const sorted = Object.entries(colorMap).sort((a,b) => b[1].length - a[1].length);
sorted.slice(0, 15).forEach(([hex, items]) => {
  console.log(`\nColor ${hex} (used ${items.length} times):`);
  console.log('Sample usages:');
  items.slice(0, 4).forEach(it => console.log(`  Line ${it.lineNum}: ${it.line}`));
});
