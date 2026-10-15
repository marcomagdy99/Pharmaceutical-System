const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  for (let i = 1; i <= 7; i++) {
    const id = `p${i}`;
    if (l.includes(`"${id}"`) || l.includes(`'${id}'`)) {
      console.log(`Line ${idx+1}: ${l.trim()}`);
    }
  }
});
