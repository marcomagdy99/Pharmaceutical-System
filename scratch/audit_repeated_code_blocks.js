const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

// 1. Functions defined in more than one file
const functionMap = {};
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g);
  for (const m of matches) {
    const fnName = m[1];
    if (['init', 'render', 'save', 'reset', 'destroy', 'update', 'bindEvents'].includes(fnName)) continue;
    if (!functionMap[fnName]) functionMap[fnName] = [];
    if (!functionMap[fnName].includes(file)) functionMap[fnName].push(file);
  }
});

const crossFileFunctions = Object.entries(functionMap)
  .filter(([_, files]) => files.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

console.log('=== 1. Functions Declared in Multiple Files ===');
console.log(crossFileFunctions.map(([fn, files]) => ({
  functionName: fn,
  filesCount: files.length,
  files
})).slice(0, 15));

// 2. Common boilerplate patterns
console.log('\n=== 2. Common Boilerplate Repetitions ===');
const patterns = {
  'create download link (a.download)': /document\.createElement\(['"]a['"]\)[\s\S]*?\.download\s*=/g,
  'escapeHtml definition': /function\s+escapeHtml\s*\(/g,
  'debounce definition': /function\s+debounce\s*\(/g,
  'getRoleBadgeClass definition': /function\s+getRoleBadgeClass\s*|getRoleBadgeClass\s*[:=]\s*function/g,
  'new bootstrap.Modal': /new\s+bootstrap\.Modal\(/g,
  'bootstrap.Modal.getInstance': /bootstrap\.Modal\.getInstance\(/g,
};

Object.entries(patterns).forEach(([name, regex]) => {
  let count = 0;
  const filesMatched = [];
  jsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const m = content.match(regex);
    if (m) {
      count += m.length;
      filesMatched.push({ file, count: m.length });
    }
  });
  console.log(`${name}: total ${count} times in ${filesMatched.length} files`);
});
