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

checkFile('js/areas.js', ['id: Date.now()', 'id: "area', 'id: `area', 'Date.now()']);
checkFile('js/products.js', ['id: Date.now()', 'id: "line', 'id: `line', 'id: "p', 'id: `p', 'Date.now()']);
checkFile('js/distributors.js', ['id: Date.now()', 'id: "dist', 'Date.now()']);
checkFile('js/announcements.js', ['id: Date.now()', 'id: "ann', 'Date.now()']);
