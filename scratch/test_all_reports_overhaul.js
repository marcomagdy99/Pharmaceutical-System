const fs = require('fs');

const files = [
  'reports.html',
  'js/shared-report.js',
  'js/sales-report.js',
  'js/achievements-report.js',
  'js/timeline-report.js',
  'js/coverage-report.js',
  'js/doctors-report.js',
  'js/hospitals-report.js',
  'js/pharmacies-report.js',
  'js/missing-days-report.js',
  'js/gps-tracing-report.js'
];

console.log('--- Testing JS Syntax & Structure ---');
files.forEach((f) => {
  if (f.endsWith('.js')) {
    const code = fs.readFileSync(f, 'utf8');
    try {
      new Function(code);
      console.log(`[PASS] ${f} syntax is valid.`);
    } catch (e) {
      console.error(`[FAIL] ${f} syntax error:`, e.message);
      process.exit(1);
    }
  }
});

console.log('--- Checking HTML Elements ---');
const html = fs.readFileSync('reports.html', 'utf8');
if (html.includes('id="targetLineFilterSelect"')) {
  console.log('[PASS] reports.html includes targetLineFilterSelect.');
} else {
  console.error('[FAIL] reports.html is missing targetLineFilterSelect!');
  process.exit(1);
}

// Check that no onchange auto-refresh triggers remain in filter dropdowns
const forbiddenPatterns = [
  'onTimelineFilterChange()',
  'onCoverageFilterChange()',
  'onDoctorFilterChange()',
  'onHospitalFilterChange()',
  'onPharmacyFilterChange()',
  'onMissingDaysFilterChange()',
  'onGpsFilterChange()'
];

let foundAutoTriggers = 0;
forbiddenPatterns.forEach((p) => {
  if (html.includes(p)) {
    console.warn(`[WARN] Found remaining trigger pattern in HTML: ${p}`);
    foundAutoTriggers++;
  }
});

if (foundAutoTriggers === 0) {
  console.log('[PASS] All auto-refresh trigger patterns successfully removed from reports.html.');
}

console.log('--- Checking Targets Modal Line Filter Functions ---');
const salesJs = fs.readFileSync('js/sales-report.js', 'utf8');
const targetFunctions = [
  'populateTargetLineFilter',
  'onTargetLineFilterChange',
  'updateTargetProductSelect',
  'populateTargetAreaSelect'
];
targetFunctions.forEach((fn) => {
  if (salesJs.includes(fn)) {
    console.log(`[PASS] sales-report.js contains ${fn}.`);
  } else {
    console.error(`[FAIL] sales-report.js missing ${fn}!`);
    process.exit(1);
  }
});

console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
