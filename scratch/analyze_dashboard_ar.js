const fs = require('fs');

const lines = fs.readFileSync('js/dashboard.js', 'utf8').split('\n');

const patterns = [];
lines.forEach((line, i) => {
  if (/[\u0600-\u06FF]/.test(line)) {
    patterns.push({
      line: i + 1,
      text: line
    });
  }
});

console.log('Total lines with Arabic:', patterns.length);
// Check if all lines can be cleanly replaced or converted to English
