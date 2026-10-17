const fs = require('fs');
const files = [
  'js/sales-report.js',
  'js/achievements-report.js',
  'js/timeline-report.js',
  'js/coverage-report.js',
  'js/doctors-report.js',
  'js/hospitals-report.js',
  'js/pharmacies-report.js',
  'js/missing-days-report.js',
  'js/gps-tracing-report.js',
  'js/accounts-costing-report.js'
];
files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  const matches = code.match(/getElementById\([^)]*(?:Rep|Dm|Lm)Select[^)]*\)/g) || [];
  console.log(f + ' : ' + [...new Set(matches)].join(', '));
});
