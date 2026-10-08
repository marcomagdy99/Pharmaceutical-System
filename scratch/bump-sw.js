const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes('var EXPECTED_SW =')) {
    content = content.replace(/var EXPECTED_SW = "[^"]+";/g, 'var EXPECTED_SW = "v157";');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Bumped SW to v157 in ' + f);
  }
});
console.log('SW check completed.');
