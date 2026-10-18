/**
 * Reusable Version Bumper for PharmaCare System
 * Usage:
 *   node scripts/bump_version.js <toVersion>              (auto-detects current version)
 *   node scripts/bump_version.js <fromVersion> <toVersion> (explicit versions)
 * Example:
 *   node scripts/bump_version.js v223
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

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

let fromVer = process.argv[2];
let toVer = process.argv[3];

// Auto-detect if only target version is passed
if (!toVer && fromVer) {
  toVer = fromVer;
  fromVer = null;
  // Detect current version from sw.js
  const swPath = path.join(rootDir, 'sw.js');
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    const match = swContent.match(/CACHE_VERSION\s*=\s*['"](v\d+)['"]/) || swContent.match(/CACHE_NAME\s*=\s*['"]pharmacare-(v\d+)['"]/);
    if (match) {
      fromVer = match[1];
    }
  }
}

if (!fromVer || !toVer) {
  console.error("Usage: node scripts/bump_version.js <toVersion> OR node scripts/bump_version.js <fromVersion> <toVersion>");
  process.exit(1);
}

if (fromVer === toVer) {
  console.log(`Current version is already ${toVer}. No changes needed.`);
  process.exit(0);
}

console.log(`Bumping system version from ${fromVer} to ${toVer}...`);

let totalReplacements = 0;

// 1. Update HTML files
htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const updated = content.replaceAll(fromVer, toVer);
    const count = (content.match(new RegExp(fromVer, 'g')) || []).length;
    if (count > 0) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Updated ${file}: replaced ${count} occurrences`);
      totalReplacements += count;
    }
  }
});

// 2. Update sw.js
const swPath = path.join(rootDir, 'sw.js');
if (fs.existsSync(swPath)) {
  const content = fs.readFileSync(swPath, 'utf8');
  const updated = content.replaceAll(fromVer, toVer);
  const count = (content.match(new RegExp(fromVer, 'g')) || []).length;
  if (count > 0) {
    fs.writeFileSync(swPath, updated, 'utf8');
    console.log(`Updated sw.js: replaced ${count} occurrences`);
    totalReplacements += count;
  }
}

// 3. Update js/profile.js
const profileJs = path.join(rootDir, 'js/profile.js');
if (fs.existsSync(profileJs)) {
  const content = fs.readFileSync(profileJs, 'utf8');
  const updated = content.replaceAll(fromVer, toVer);
  if (content !== updated) {
    fs.writeFileSync(profileJs, updated, 'utf8');
    console.log(`Updated js/profile.js`);
    totalReplacements++;
  }
}

// 4. Update js/app.js
const appJs = path.join(rootDir, 'js/app.js');
if (fs.existsSync(appJs)) {
  const content = fs.readFileSync(appJs, 'utf8');
  const updated = content.replaceAll(fromVer, toVer);
  if (content !== updated) {
    fs.writeFileSync(appJs, updated, 'utf8');
    console.log(`Updated js/app.js`);
    totalReplacements++;
  }
}

// 5. Update js/cache-bust.js
const cacheBustJs = path.join(rootDir, 'js/cache-bust.js');
if (fs.existsSync(cacheBustJs)) {
  const content = fs.readFileSync(cacheBustJs, 'utf8');
  const updated = content.replaceAll(fromVer, toVer);
  if (content !== updated) {
    fs.writeFileSync(cacheBustJs, updated, 'utf8');
    console.log(`Updated js/cache-bust.js`);
    totalReplacements++;
  }
}

console.log(`Successfully bumped version from ${fromVer} to ${toVer} (${totalReplacements} references updated).`);
