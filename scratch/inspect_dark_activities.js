const fs = require('fs');

const content = fs.readFileSync('css/activities.css', 'utf8');
const lines = content.split(/\r?\n/);

const darkLines = [];
let inDark = false;
lines.forEach((line, i) => {
  if (line.includes('[data-theme="dark"]')) {
    darkLines.push({ lineNum: i + 1, text: line.trim() });
  }
});

console.log('Sample of dark-theme selectors in activities.css:');
console.log(darkLines.slice(0, 20));
