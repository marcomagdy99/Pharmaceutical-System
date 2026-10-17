const fs = require('fs');
const files = fs.readdirSync('js').filter(f => f.endsWith('.js'));
files.forEach(f => {
  const content = fs.readFileSync('js/' + f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    const lower = l.toLowerCase();
    if (lower.includes('password') && (lower.includes('@') || lower.includes('123') || lower.includes('"') || lower.includes("'"))) {
      console.log(`${f}:${idx+1} ${l.trim().slice(0, 100)}`);
    }
  });
});
