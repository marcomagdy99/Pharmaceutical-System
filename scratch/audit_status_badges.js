const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

const results = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      line.includes('getStatusBadge') ||
      line.includes('renderStatusBadge') ||
      line.includes('statusBadge') ||
      line.includes('badge-status') ||
      line.includes('status-badge') ||
      line.includes('formatStatus')
    ) {
      results.push({
        file,
        line: idx + 1,
        text: line.trim()
      });
    }
  });
});

console.log(JSON.stringify(results.slice(0, 30), null, 2));
console.log('Total matches found:', results.length);
