const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('firebase-sync.js')) {
    content = content.replace(/firebase-sync\.js(\?v=[a-zA-Z0-9_\.-]+)?/g, 'firebase-sync.js?v=v157');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  }
});
console.log('All files updated to v157 for firebase-sync.js');
