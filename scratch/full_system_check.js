const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('================================================================================');
console.log('                 PHARMACARE COMPREHENSIVE SYSTEM HEALTH CHECK                  ');
console.log('================================================================================\n');

// 1. JavaScript Syntax Check
console.log('--- 1. JAVASCRIPT SYNTAX INTEGRITY ---');
const jsFiles = [];
function getJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'scratch', 'brain'].includes(entry.name)) continue;
      getJsFiles(full);
    } else if (entry.name.endsWith('.js')) {
      jsFiles.push(full);
    }
  }
}
getJsFiles('.');

let syntaxErrors = 0;
jsFiles.forEach(file => {
  try {
    execSync(`node -c "${file}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error(`  [X] Syntax Error in: ${file}`);
    syntaxErrors++;
  }
});
if (syntaxErrors === 0) {
  console.log(`  [OK] All ${jsFiles.length} JavaScript files passed syntax verification (0 errors).\n`);
} else {
  console.error(`  [FAIL] Found ${syntaxErrors} syntax errors in JavaScript files!\n`);
}

// 2. HTML Asset References & Broken Links Check
console.log('--- 2. HTML ASSET REFERENCES & BROKEN LINKS ---');
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let missingRefs = 0;
let checkedAssets = 0;

htmlFiles.forEach(htmlFile => {
  const content = fs.readFileSync(htmlFile, 'utf8');

  // Script tags
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1].split('?')[0];
    checkedAssets++;
    if (!src.startsWith('http') && !src.startsWith('//')) {
      if (!fs.existsSync(src)) {
        console.error(`  [X] Missing Script in ${htmlFile}: ${src}`);
        missingRefs++;
      }
    }
  }

  // Link stylesheet tags
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["']/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1].split('?')[0];
    if (href.endsWith('.css') && !href.startsWith('http') && !href.startsWith('//')) {
      checkedAssets++;
      if (!fs.existsSync(href)) {
        console.error(`  [X] Missing Stylesheet in ${htmlFile}: ${href}`);
        missingRefs++;
      }
    }
  }
});

if (missingRefs === 0) {
  console.log(`  [OK] Scanned ${htmlFiles.length} HTML files and verified ${checkedAssets} asset references (0 broken links).\n`);
} else {
  console.error(`  [FAIL] Found ${missingRefs} broken asset references in HTML files!\n`);
}

// 3. Cache Version Consistency Check
console.log('--- 3. CACHE VERSION CONSISTENCY ---');
let swContent = fs.readFileSync('sw.js', 'utf8');
const swVersionMatch = swContent.match(/CACHE_VERSION\s*=\s*['"]([^'"]+)['"]/);
const activeSwVersion = swVersionMatch ? swVersionMatch[1] : 'unknown';
console.log(`  Current Service Worker Cache Version: ${activeSwVersion}`);

let versionDiscrepancies = 0;
htmlFiles.forEach(htmlFile => {
  const content = fs.readFileSync(htmlFile, 'utf8');
  const expMatch = content.match(/EXPECTED_SW\s*=\s*['"]([^'"]+)['"]/);
  if (expMatch && expMatch[1] !== activeSwVersion) {
    console.warn(`  [!] Version mismatch in ${htmlFile}: expected ${expMatch[1]} vs SW ${activeSwVersion}`);
    versionDiscrepancies++;
  }
});
if (versionDiscrepancies === 0) {
  console.log(`  [OK] All HTML files and Service Worker are aligned on version ${activeSwVersion}.\n`);
} else {
  console.warn(`  [WARN] Found ${versionDiscrepancies} files with outdated EXPECTED_SW tags.\n`);
}

// 4. Critical Core File Existence
console.log('--- 4. CRITICAL CORE SYSTEM MODULES ---');
const criticalFiles = [
  'index.html',
  'activities.html',
  'visits.html',
  'plans-review.html',
  'reports.html',
  'users.html',
  'profile.html',
  'leaves.html',
  'products.html',
  'areas.html',
  'calendar.html',
  'announcements.html',
  'quizzes.html',
  'distributors.html',
  'js/store.js',
  'js/firebase-sync.js',
  'js/workflow-engine.js',
  'js/activities-core.js',
  'js/activities-decisions.js',
  'js/activities-tab-services.js',
  'js/activities-tab-expenses.js',
  'js/activities-tab-budget.js',
  'js/activities-tab-daily.js',
  'js/visits.js',
  'js/dashboard.js',
  'js/sales-report.js',
  'js/achievements-report.js',
  'js/doctors-report.js',
  'js/pharmacies-report.js',
  'js/hospitals-report.js',
  'js/leaves.js',
  'js/plans-review.js',
  'js/products.js',
  'js/areas.js',
  'js/users.js',
  'firebase.json',
  'sw.js'
];

let missingCritical = 0;
criticalFiles.forEach(f => {
  if (!fs.existsSync(f)) {
    console.error(`  [X] Missing critical module: ${f}`);
    missingCritical++;
  }
});
if (missingCritical === 0) {
  console.log(`  [OK] All ${criticalFiles.length} critical modules are present on disk.\n`);
} else {
  console.error(`  [FAIL] Missing ${missingCritical} critical modules!\n`);
}

// 5. Run Core Engine Unit Tests
console.log('--- 5. CORE ENGINES AUTOMATED REGRESSION TESTS ---');
try {
  const approvalTestOutput = execSync('node scratch/test-approval-workflows.js', { encoding: 'utf8' });
  const passedMatch = approvalTestOutput.match(/(\d+)\s+PASSED/);
  console.log(`  [OK] Approval Sequence Test Suite: ${passedMatch ? passedMatch[1] : 'All'} passed successfully.`);
} catch (err) {
  console.error(`  [FAIL] Approval Workflow Tests Failed:\n${err.message}`);
}

try {
  const costingTestOutput = execSync('node scratch/test-costing-budget-split.js', { encoding: 'utf8' });
  const passedMatch = costingTestOutput.match(/(\d+)\s+PASSED|passed/i);
  console.log(`  [OK] Costing & Budget Splitting Engine: verified successfully.`);
} catch (err) {
  console.error(`  [FAIL] Costing Budget Tests Failed:\n${err.message}`);
}

console.log('\n================================================================================');
console.log('                           HEALTH CHECK COMPLETED                              ');
console.log('================================================================================');
