const fs = require('fs');

const files = fs.readdirSync('js').filter(f => f.endsWith('.js'));
const keys = ['admin1', 'bu1', 'lm1', 'lm2', 'dm1', 'dm2', 'dm3', 'hr1', 'pm1', 'pm2'];

keys.forEach(key => {
  let count = 0;
  const inFiles = [];
  files.forEach(f => {
    const code = fs.readFileSync('js/' + f, 'utf8');
    const regex = new RegExp(`['"\`]${key}['"\`]`, 'g');
    const matches = (code.match(regex) || []).length;
    if (matches > 0) {
      count += matches;
      inFiles.push(`${f} (${matches})`);
    }
  });
  console.log(`${key}: ${count} occurrences in: ${inFiles.join(', ')}`);
});
