const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

const htmlFiles = fs.readdirSync('.')
  .filter(f => f.endsWith('.html'));

const allFiles = [...jsFiles, ...htmlFiles];
const allCode = allFiles.map(f => ({ file: f, content: fs.readFileSync(f, 'utf8') }));

// Extract all top-level functions defined in js files
const declaredFunctions = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match "function functionName("
  const matches = content.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g);
  for (const m of matches) {
    const fnName = m[1];
    // Skip common handlers
    if (fnName.startsWith('test') || fnName.startsWith('_')) continue;
    declaredFunctions.push({ file, fnName });
  }
});

// Check occurrences of each function across all files
const potentiallyUnused = [];

declaredFunctions.forEach(({ file, fnName }) => {
  let count = 0;
  allCode.forEach(({ content }) => {
    // Look for fnName( or window.fnName or fnName = or onclick="fnName
    const regex = new RegExp(`\\b${fnName}\\b`, 'g');
    const m = content.match(regex);
    if (m) count += m.length;
  });
  // If count is exactly 1 (meaning only its own declaration line!), it's never used anywhere!
  if (count === 1) {
    potentiallyUnused.push({ file, fnName });
  }
});

console.log('Potentially Unused Functions (referenced only once in the entire project):');
console.log(potentiallyUnused);
