const fs = require('fs');
const content = fs.readFileSync('js/dashboard.js', 'utf8');
const lines = content.split('\n');

const stylePatterns = {};
lines.forEach((l, idx) => {
  const match = l.match(/style="([^"]+)"/);
  if (match) {
    const s = match[1].trim();
    if (!stylePatterns[s]) stylePatterns[s] = [];
    stylePatterns[s].push(idx + 1);
  }
});

const sorted = Object.entries(stylePatterns).map(([style, lineNos]) => ({
  style,
  count: lineNos.length,
  lines: lineNos.slice(0, 5)
})).sort((a, b) => b.count - a.count);

console.log('Top repeated inline styles in dashboard.js:');
sorted.slice(0, 20).forEach(p => {
  console.log(`[x${p.count}] ${p.style} (lines: ${p.lines.join(', ')})`);
});
console.log('\nTotal unique patterns:', sorted.length);
