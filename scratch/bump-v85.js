const fs = require('fs');

// 1. sw.js
let sw = fs.readFileSync('sw.js', 'utf8');
sw = sw.replace(/const CACHE_VERSION = 'v84';/, "const CACHE_VERSION = 'v85';");
fs.writeFileSync('sw.js', sw, 'utf8');
console.log('sw.js updated to v85');

// 2. app.js
let app = fs.readFileSync('js/app.js', 'utf8');
app = app.replace(/const EXPECTED_SW = "v79";/, 'const EXPECTED_SW = "v85";');
app = app.replace(/const EXPECTED_SW = "v84";/, 'const EXPECTED_SW = "v85";');
fs.writeFileSync('js/app.js', app, 'utf8');
console.log('app.js updated to v85');

// 3. HTML files
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
htmlFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  if (content.includes('v84')) {
    content = content.replace(/v84/g, 'v85');
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`${f} bumped to v85`);
  }
});
