const fs = require('fs');

console.log('--- Step 1: Checking for getAreaLineBadge in all files ---');
const files = [
  'js/visits.js',
  'js/doctors-report.js',
  'js/hospitals-report.js',
  'js/pharmacies-report.js',
  'js/shared-report.js',
  'reports.html',
  'visits.html'
];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('getAreaLineBadge')) {
    console.error('FAIL: Found getAreaLineBadge in ' + f);
    process.exit(1);
  }
});
console.log('PASS: No getAreaLineBadge found in any file.');

console.log('--- Step 2: Checking Arabic comments ---');
const arabicRegex = /[\u0600-\u06FF]/;
files.filter(f => f.endsWith('.js')).forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach((line, idx) => {
    const single = line.indexOf('//');
    if (single !== -1 && arabicRegex.test(line.substring(single))) {
      console.error('FAIL: Arabic comment in ' + f + ':' + (idx+1));
      process.exit(1);
    }
  });
});
console.log('PASS: Zero Arabic comments in JS files.');

console.log('--- Step 3: Checking cache version ---');
const swContent = fs.readFileSync('sw.js', 'utf8');
const distContent = fs.readFileSync('distributors.html', 'utf8');
if (!swContent.includes("CACHE_VERSION = 'v41'") || !distContent.includes('EXPECTED_SW = "v41"')) {
  console.error('FAIL: Cache version not bumped to v41');
  process.exit(1);
}
console.log('PASS: Cache version bumped to v41.');
console.log('ALL FINAL VERIFICATIONS PASSED 100%!');
