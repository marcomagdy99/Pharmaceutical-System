const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, '..', 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.includes('min') && !f.includes('chart'));

const colorTrapRegex = /style=["'][^"']*(?:background|color)[^"']*(?:#[0-9a-fA-F]{3,6}|rgb|white|black)[^"']*["']/gi;

const results = [];
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  let match;
  let count = 0;
  const samples = [];
  while ((match = colorTrapRegex.exec(content)) !== null) {
    count++;
    if (samples.length < 5) samples.push(match[0]);
  }
  if (count > 0) results.push({ file: f, count, samples });
});

results.sort((a,b) => b.count - a.count);
console.log('=== JS Files with hardcoded colors/backgrounds ===');
results.forEach(r => {
  console.log(`\n[${r.file}] -> ${r.count} instances`);
  r.samples.slice(0, 3).forEach(s => console.log('   - ' + s));
});
