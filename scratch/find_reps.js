const fs = require('fs');

const files = fs.readdirSync('js').filter(f => f.endsWith('.js'));
files.forEach(f => {
  const code = fs.readFileSync('js/' + f, 'utf8');
  const lines = code.split('\n');
  const matches = [];
  lines.forEach((l, i) => {
    if (l.includes('"rep1"') || l.includes("'rep1'") || l.includes('"rep2"') || l.includes("'rep2'")) {
      matches.push({ line: i + 1, text: l.trim().substring(0, 100) });
    }
  });
  if (matches.length > 0) {
    console.log(`=== ${f} (${matches.length} matches) ===`);
    matches.slice(0, 5).forEach(m => console.log(`  L${m.line}: ${m.text}`));
  }
});
