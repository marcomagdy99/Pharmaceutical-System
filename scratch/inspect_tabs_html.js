const fs = require('fs');
const html = fs.readFileSync('reports.html', 'utf8');
const regex = /id="([^"]*(?:Lm|Dm|Rep)Select)"/g;
let m;
const found = [];
while ((m = regex.exec(html)) !== null) {
  found.push(m[1]);
}
console.log('Total hierarchy selects found:', found.length);
console.log(found.join('\n'));
