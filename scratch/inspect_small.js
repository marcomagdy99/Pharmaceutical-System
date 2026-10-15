const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\DeLL\\OneDrive\\Desktop\\pharma-rep\\Pharmaceutical-System';

function testRegexOnFile(file) {
  const full = path.join(root, file);
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split(/\r?\n/);
  console.log(`=== Inspecting ${file} ===`);
  lines.forEach((line, idx) => {
    if (/[\u0600-\u06FF]/.test(line)) {
      console.log(`L${idx + 1}: ${line.trim()}`);
    }
  });
}

testRegexOnFile('js/users.js');
testRegexOnFile('js/missing-days-report.js');
testRegexOnFile('js/timeline-report.js');
testRegexOnFile('js/interactive-charts.js');
