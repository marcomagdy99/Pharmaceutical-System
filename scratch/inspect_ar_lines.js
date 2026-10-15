const fs = require('fs');
const path = require('path');

const targetFiles = [
  'calendar.js',
  'areas.js',
  'app.js',
  'announcements.js',
  'activities-decisions.js',
  'activities-tab-budget.js',
  'achievements-report.js',
  'coverage-report.js',
  'shared-report.js',
  'store.js'
];

const report = {};

for (const file of targetFiles) {
  const filePath = path.join('js', file);
  if (!fs.existsSync(filePath)) continue;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const arLines = [];
  lines.forEach((line, idx) => {
    if (/[\u0600-\u06FF]/.test(line)) {
      arLines.push({ lineNum: idx + 1, text: line.trim() });
    }
  });
  report[file] = arLines;
}

fs.writeFileSync('scratch/ar_lines_audit.json', JSON.stringify(report, null, 2), 'utf8');
console.log('Report written to scratch/ar_lines_audit.json');
for (const [file, lines] of Object.entries(report)) {
  console.log(`${file}: ${lines.length} lines`);
}
