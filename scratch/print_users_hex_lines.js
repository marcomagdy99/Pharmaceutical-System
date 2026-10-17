const fs = require('fs');

const content = fs.readFileSync('css/users.css', 'utf8');
const lines = content.split(/\r?\n/);

console.log('--- USERS.CSS RULES WITH HEX ---');
lines.forEach((line, i) => {
  if (line.match(/#[0-9a-fA-F]{3,8}\b/)) {
    console.log(`${i+1}: ${line}`);
  }
});
