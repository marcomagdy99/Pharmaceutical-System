const fs = require('fs');
const content = fs.readFileSync('js/dashboard.js', 'utf8');
const lines = content.split('\n');

const sectionCounts = {};
let currentFunc = 'top-level';

lines.forEach((l, idx) => {
  const funcMatch = l.match(/function\s+([a-zA-Z0-9_]+)/) || l.match(/([a-zA-Z0-9_]+)\s*=\s*function/);
  if (funcMatch) {
    currentFunc = funcMatch[1];
  }
  if (l.includes('style="') || l.includes("style='")) {
    if (!sectionCounts[currentFunc]) sectionCounts[currentFunc] = 0;
    sectionCounts[currentFunc]++;
  }
});

console.log('Inline style count by function in dashboard.js:');
Object.entries(sectionCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([f, count]) => {
    console.log(`- ${f}: ${count} inline styles`);
  });
