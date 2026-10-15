const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, '..', 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.includes('min') && !f.includes('chart'));

const summary = [];

files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const lines = content.split('\n');

  let inlineStyleCount = 0;
  let domStyleCount = 0;

  lines.forEach(l => {
    if (l.includes('style="') || l.includes("style='")) {
      inlineStyleCount++;
    }
    if (/\.style\.[a-zA-Z]+/.test(l)) {
      domStyleCount++;
    }
  });

  const total = inlineStyleCount + domStyleCount;
  if (total > 0) {
    summary.push({
      file: f,
      total,
      inline: inlineStyleCount,
      dom: domStyleCount
    });
  }
});

summary.sort((a, b) => b.total - a.total);

console.log('| File Name | Total CSS Mentions | Inline HTML (style="...") | DOM Actions (.style.x) |');
console.log('|---|---|---|---|');
summary.forEach(s => {
  console.log(`| \`${s.file}\` | **${s.total}** | ${s.inline} | ${s.dom} |`);
});
