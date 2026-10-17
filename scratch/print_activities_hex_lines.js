const fs = require('fs');

const content = fs.readFileSync('css/activities.css', 'utf8');
const lines = content.split(/\r?\n/);

console.log('--- ACTIVITIES.CSS RULES WITH HEX (SAMPLE) ---');
let count = 0;
lines.forEach((line, i) => {
  if (line.match(/#[0-9a-fA-F]{3,8}\b/)) {
    count++;
    if (count <= 60 || count >= 350) {
      console.log(`${i+1}: ${line}`);
    } else if (count === 61) {
      console.log(`... [${lines.length} lines total, skipping middle] ...`);
    }
  }
});
console.log('Total lines with hex in activities.css:', count);
