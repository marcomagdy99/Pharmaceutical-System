const fs = require('fs');

const content = fs.readFileSync('css/activities.css', 'utf8');
const lines = content.split(/\r?\n/);

console.log('--- ACTIVITIES.CSS MAJOR HEADERS ---');
lines.forEach((line, i) => {
  if (line.match(/\/\*.*(=|-).*?\*\//) || line.match(/^[a-zA-Z0-9#._-].*\{/)) {
    if (line.includes('==') || line.includes('-- START') || line.includes('-- END')) {
      console.log(`${i+1}: ${line}`);
    }
  }
});
