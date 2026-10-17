const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

const htmlFiles = fs.readdirSync('.')
  .filter(f => f.endsWith('.html'));

const allFiles = [...jsFiles, ...htmlFiles];

const storageKeyMap = {};

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Match localStorage.getItem('...'), setItem('...', ...), removeItem('...')
  const regex = /(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const type = match[1];
    const op = match[2];
    const key = match[3];
    if (!storageKeyMap[key]) {
      storageKeyMap[key] = {
        total: 0,
        type: new Set(),
        files: new Set(),
        operations: new Set()
      };
    }
    storageKeyMap[key].total++;
    storageKeyMap[key].type.add(type);
    storageKeyMap[key].files.add(file);
    storageKeyMap[key].operations.add(op);
  }
});

const report = Object.entries(storageKeyMap)
  .sort((a, b) => b[1].total - a[1].total)
  .map(([key, data]) => ({
    key,
    totalOccurrences: data.total,
    storageTypes: Array.from(data.type),
    filesCount: data.files.size,
    sampleFiles: Array.from(data.files).slice(0, 5),
    operations: Array.from(data.operations)
  }));

console.log(JSON.stringify(report, null, 2));
