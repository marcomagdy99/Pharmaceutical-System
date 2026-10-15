const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  ['rep1', 'rep2', 'rep3', 'rep4', 'rep5'].forEach(r => {
    if (code.includes(`"${r}"`) || code.includes(`'${r}'`)) {
      console.log(`${f}: contains ${r}`);
    }
  });
});
console.log('HTML scan complete.');
