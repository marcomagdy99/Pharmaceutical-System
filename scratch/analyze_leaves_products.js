const fs = require('fs');

['css/leaves.css', 'css/products.css'].forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  console.log(`\n--- ${filePath} HEX LINES SAMPLE ---`);
  const hexLines = [];
  lines.forEach((line, i) => {
    if (line.match(/#[0-9a-fA-F]{3,8}\b/)) {
      hexLines.push({ lineNum: i + 1, line: line.trim() });
    }
  });

  console.log(`Total lines with hex in ${filePath}: ${hexLines.length}`);
  console.log('Sample first 20:');
  hexLines.slice(0, 20).forEach(h => console.log(`${h.lineNum}: ${h.line}`));
  console.log('Sample last 15:');
  hexLines.slice(-15).forEach(h => console.log(`${h.lineNum}: ${h.line}`));
});
