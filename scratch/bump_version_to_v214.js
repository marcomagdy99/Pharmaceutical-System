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
    const updated = content.replaceAll('v213', 'v214');
    const count = (content.match(/v213/g) || []).length;
    if (count > 0) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`Updated ${file}: replaced ${count} occurrences of v213 with v214`);
      totalReplacements += count;
    }
  }
});

// 2. Update sw.js
if (fs.existsSync('sw.js')) {
  const content = fs.readFileSync('sw.js', 'utf8');
  const updated = content.replaceAll('v213', 'v214');
  const count = (content.match(/v213/g) || []).length;
  if (count > 0) {
    fs.writeFileSync('sw.js', updated, 'utf8');
    console.log(`Updated sw.js: replaced ${count} occurrences of v213 with v214`);
    totalReplacements += count;
  }
}

// 3. Update js/profile.js
if (fs.existsSync('js/profile.js')) {
  const content = fs.readFileSync('js/profile.js', 'utf8');
  const updated = content.replaceAll('v213', 'v214');
  if (content !== updated) {
    fs.writeFileSync('js/profile.js', updated, 'utf8');
    console.log('Updated js/profile.js with v214');
    totalReplacements++;
  }
}

// 4. Update js/app.js
if (fs.existsSync('js/app.js')) {
  const content = fs.readFileSync('js/app.js', 'utf8');
  const updated = content.replaceAll('v213', 'v214');
  if (content !== updated) {
    fs.writeFileSync('js/app.js', updated, 'utf8');
    console.log('Updated js/app.js with v214');
    totalReplacements++;
  }
}

console.log(`Bumped version from v213 to v214 across ${totalReplacements} references.`);
