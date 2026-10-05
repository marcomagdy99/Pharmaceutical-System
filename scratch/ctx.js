const fs = require('fs');
const path = require('path');
const items = process.argv.slice(2);
items.forEach((it) => {
  const [f, l] = it.split(':');
  const lines = fs.readFileSync(path.resolve(__dirname, '..', 'js', f), 'utf8').split(/\r?\n/);
  const n = Number(l);
  console.log('---- ' + it + ' ----');
  for (let i = Math.max(1, n - 2); i <= Math.min(lines.length, n + 4); i++) console.log(String(i).padStart(5) + (i === n ? '>' : ':') + ' ' + lines[i - 1]);
});
