const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

const statusCounts = {};
jsFiles.forEach(file => {
  const c = fs.readFileSync(file, 'utf8');
  ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'planned', 'submitted', 'draft'].forEach(s => {
    const matches = (c.match(new RegExp(`['"]${s}['"]`, 'gi')) || []).length;
    if (matches > 0) statusCounts[s] = (statusCounts[s] || 0) + matches;
  });
});

console.log('=== Workflow Status String Repetitions ===');
console.log(statusCounts);
