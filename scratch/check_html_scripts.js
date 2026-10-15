const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const hasApp = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('js/app.js')) {
    hasApp.push(f);
  }
}

console.log('HTML files including js/app.js:', hasApp);
