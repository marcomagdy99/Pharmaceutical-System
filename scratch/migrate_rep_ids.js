const fs = require('fs');
const path = require('path');

const ID_MAP = {
  'rep1': 'u1790626000001',
  'rep2': 'u1790626000002',
  'rep3': 'u1790626000003',
  'rep4': 'u1790626000004',
  'rep5': 'u1790626000005'
};

console.log('=== Starting Safe Migration from rep1-5 to u1790626000001-5 ===');

// 1. Files to update in js/
const jsFiles = [
  'accounts-costing-report.js',
  'activities-core.js',
  'activities-tab-daily.js',
  'announcements.js',
  'app.js',
  'calendar.js',
  'dashboard.js',
  'doctors-report.js',
  'hospitals-report.js',
  'leaves.js',
  'login.js',
  'pharmacies-report.js',
  'quizzes.js',
  'shared-report.js',
  'store.js',
  'timeline-report.js',
  'users.js',
  'visits.js'
];

jsFiles.forEach(f => {
  const fullPath = path.join('js', f);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  Object.entries(ID_MAP).forEach(([oldId, newId]) => {
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

// 2. HTML test files
const htmlFiles = [
  'approval-test-suite.html',
  'costing-test-suite.html'
];

htmlFiles.forEach(f => {
  if (!fs.existsSync(f)) return;
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  Object.entries(ID_MAP).forEach(([oldId, newId]) => {
    content = content.replaceAll(`"${oldId}"`, `"${newId}"`);
    content = content.replaceAll(`'${oldId}'`, `'${newId}'`);
  });

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Updated HTML: ${f}`);
  }
});

console.log('Migration script complete.');
