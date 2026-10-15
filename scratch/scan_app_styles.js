const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');
const lines = content.split('\n');

let currentFn = 'GLOBAL';
const clusters = {};

lines.forEach((l, idx) => {
  const lineNum = idx + 1;
  const fnMatch = l.match(/(?:function\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+)\s*=\s*(?:function|\([^)]*\)\s*=>))/);
  if (fnMatch) {
    currentFn = fnMatch[1] || fnMatch[2];
  }
  if (l.includes('style="') || l.includes("style='")) {
    if (!clusters[currentFn]) {
      clusters[currentFn] = { count: 0, lines: [] };
    }
    clusters[currentFn].count++;
    clusters[currentFn].lines.push({ line: lineNum, text: l.trim() });
  }
});

console.log('=== Clusters of inline styles in app.js ===');
Object.entries(clusters).forEach(([fn, data]) => {
  console.log(`\nFunction: ${fn} (${data.count} occurrences):`);
  data.lines.forEach(item => {
    console.log(`  L${item.line}: ${item.text.substring(0, 120)}`);
  });
});
