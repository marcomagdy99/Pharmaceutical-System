const fs = require('fs');

const files = fs.readdirSync('js').filter(f => f.endsWith('.js'));
const repKeys = ['rep1', 'rep2', 'rep3', 'rep4', 'rep5'];

files.forEach(f => {
  const code = fs.readFileSync('js/' + f, 'utf8');
  const lines = code.split('\n');
  const found = [];
  lines.forEach((l, i) => {
    repKeys.forEach(k => {
      if (l.includes(`"${k}"`) || l.includes(`'${k}'`) || l.includes(`\`${k}\``)) {
        found.push({ line: i + 1, text: l.trim(), key: k });
      }
    });
  });
  if (found.length > 0) {
    console.log(`\n================ ${f} (${found.length}) ================`);
    found.forEach(item => console.log(`  L${item.line} [${item.key}]: ${item.text}`));
  }
});
