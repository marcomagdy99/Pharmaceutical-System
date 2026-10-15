const fs = require('fs');

const files = [
  'activities-decisions.js',
  'activities-tab-budget.js',
  'achievements-report.js',
  'coverage-report.js'
];

for (const f of files) {
  console.log('=================== ' + f + ' ===================');
  const lines = fs.readFileSync('js/' + f, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (/[\u0600-\u06FF]/.test(line)) {
      console.log(`L${idx + 1}: ${line.trim()}`);
    }
  });
}
