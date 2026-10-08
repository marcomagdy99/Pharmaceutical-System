const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes('css/style.css')) {
    content = content.replace(/css\/style\.css(\?v=[a-zA-Z0-9_\.-]+)?/g, 'css/style.css?v=v159');
    changed = true;
  }
  if (content.includes('js/app.js')) {
    content = content.replace(/js\/app\.js(\?v=[a-zA-Z0-9_\.-]+)?/g, 'js/app.js?v=v159');
    changed = true;
  }
  if (content.includes('var EXPECTED_SW =')) {
    content = content.replace(/var EXPECTED_SW = "[^"]+";/g, 'var EXPECTED_SW = "v159";');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Bumped v159 in ' + f);
  }
});
console.log('All files updated to v159.');
