const fs = require('fs');

function checkFile(filename, keywords) {
  const content = fs.readFileSync(filename, 'utf8');
  console.log(`=== ${filename} ===`);
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    for (const kw of keywords) {
      if (line.includes(kw)) {
        console.log(`Line ${i+1}: ${line.trim().slice(0, 90)}`);
      }
    }
  });
}

checkFile('js/pharmacies-report.js', ['Date.now', 'id:', 'pharm']);
checkFile('js/doctors-report.js', ['Date.now', 'id:', 'doc']);
checkFile('js/distributors.js', ['dist', 'Date.now']);
