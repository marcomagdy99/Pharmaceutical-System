const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, '..', 'js');

function inspectExport(file, lineNum) {
  const content = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const lines = content.split('\n');
  const start = Math.max(0, lineNum - 10);
  const end = Math.min(lines.length, lineNum + 40);
  console.log(`\n========================================`);
  console.log(`FILE: ${file} (lines ${start + 1} to ${end})`);
  console.log(`========================================`);
  for (let i = start; i < end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

inspectExport('accounts-costing-report.js', 1257);
inspectExport('achievements-report.js', 648);
inspectExport('distributors.js', 505);
inspectExport('gps-tracing-report.js', 694);
inspectExport('missing-days-report.js', 747);
inspectExport('shared-report.js', 1118);
