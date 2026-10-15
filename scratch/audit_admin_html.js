const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const keys = ['admin1', 'bu1', 'lm1', 'lm2', 'dm1', 'dm2', 'dm3', 'hr1', 'pm1', 'pm2'];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  keys.forEach(k => {
    if (code.includes(`"${k}"`) || code.includes(`'${k}'`)) {
      console.log(`${f}: contains ${k}`);
    }
  });
});
console.log('HTML audit complete.');
