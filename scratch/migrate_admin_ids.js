const fs = require('fs');
const path = require('path');

const ADMIN_ID_MAP = {
  'admin1': 'u1790626000010',
  'bu1':    'u1790626000011',
  'lm1':    'u1790626000012',
  'lm2':    'u1790626000013',
  'dm1':    'u1790626000014',
  'dm2':    'u1790626000015',
  'dm3':    'u1790626000016',
  'hr1':    'u1790626000017',
  'pm1':    'u1790626000018',
  'pm2':    'u1790626000019'
};

console.log('=== Starting Safe Migration for Admin/Manager IDs to u1790... ===');

// All JS files
const jsFiles = fs.readdirSync('js').filter(f => f.endsWith('.js'));

jsFiles.forEach(f => {
  const fullPath = path.join('js', f);
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  Object.entries(ADMIN_ID_MAP).forEach(([oldId, newId]) => {
    // Replace in double quotes
    content = content.replaceAll(`"${oldId}"`, `"${newId}"`);
    // Replace in single quotes
    content = content.replaceAll(`'${oldId}'`, `'${newId}'`);
    // Replace in backticks
    content = content.replaceAll(`\`${oldId}\``, `\`${newId}\``);
  });

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated JS: ${f}`);
  }
});

// HTML files
const htmlFiles = ['approval-test-suite.html', 'costing-test-suite.html'];
htmlFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  Object.entries(ADMIN_ID_MAP).forEach(([oldId, newId]) => {
    content = content.replaceAll(`"${oldId}"`, `"${newId}"`);
    content = content.replaceAll(`'${oldId}'`, `'${newId}'`);
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated HTML: ${f}`);
  }
});

console.log('Admin IDs migration complete.');
