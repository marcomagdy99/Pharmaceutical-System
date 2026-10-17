const fs = require('fs');

const htmlFiles = [
  'activities.html',
  'announcements.html',
  'approval-test-suite.html',
  'areas.html',
  'calendar.html',
  'costing-test-suite.html',
  'distributors.html',
  'index.html',
  'leaves.html',
  'login.html',
  'plans-review.html',
  'products.html',
  'profile.html',
  'quizzes.html',
  'reports.html',
  'users.html',
  'visits.html'
];

let totalReplacements = 0;

// 1. Update HTML files
htmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const updated = content.replaceAll('v200', 'v201');
    const count = (content.match(/v200/g) || []).length;
    if (count > 0) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`Updated ${file}: replaced ${count} occurrences of v200 with v201`);
      totalReplacements += count;
    }
  }
});

// 2. Update sw.js
if (fs.existsSync('sw.js')) {
  const content = fs.readFileSync('sw.js', 'utf8');
  const updated = content.replaceAll('v200', 'v201');
  const count = (content.match(/v200/g) || []).length;
  if (count > 0) {
    fs.writeFileSync(file = 'sw.js', updated, 'utf8');
    console.log(`Updated sw.js: replaced ${count} occurrences of v200 with v201`);
    totalReplacements += count;
  }
}

// 3. Update js/profile.js
if (fs.existsSync('js/profile.js')) {
  const content = fs.readFileSync('js/profile.js', 'utf8');
  const updated = content.replaceAll('pharmaCareVersion: "v200"', 'pharmaCareVersion: "v201"');
  if (content !== updated) {
    fs.writeFileSync('js/profile.js', updated, 'utf8');
    console.log('Updated js/profile.js with v201');
    totalReplacements++;
  }
}

// 4. Update js/app.js EXPECTED_SW
if (fs.existsSync('js/app.js')) {
  const content = fs.readFileSync('js/app.js', 'utf8');
  const updated = content.replace('const EXPECTED_SW = "v196";', 'const EXPECTED_SW = "v201";');
  if (content !== updated) {
    fs.writeFileSync('js/app.js', updated, 'utf8');
    console.log('Updated js/app.js EXPECTED_SW to v201');
    totalReplacements++;
  }
}

console.log(`Total version replacements completed: ${totalReplacements}`);
