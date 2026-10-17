const fs = require('fs');

['css/dashboard.css', 'css/reports.css'].forEach(filePath => {
  const css = fs.readFileSync(filePath, 'utf8');
  const lines = css.split(/\r?\n/);
  const counts = {};

  lines.forEach(line => {
    const matches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (matches) {
      matches.forEach(m => {
        const hex = m.toLowerCase();
        counts[hex] = (counts[hex] || 0) + 1;
      });
    }
  });

  console.log(`\n--- Remaining Hex in ${filePath} ---`);
  console.log(Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 15));
});
