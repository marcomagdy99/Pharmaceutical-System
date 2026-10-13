const fs = require('fs');
const app = fs.readFileSync('js/app.js', 'utf8');

// Find all occurrences of Hassan, Karim, or other potential old demo names
const names = ['Hassan Ali', 'Karim Nasser', 'Ahmed Mostafa', 'Demo'];
names.forEach(n => {
  const matches = [...app.matchAll(new RegExp(n, 'g'))];
  console.log(`${n}: ${matches.length} matches in js/app.js`);
});
