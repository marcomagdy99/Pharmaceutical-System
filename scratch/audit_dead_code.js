const fs = require('fs');
const path = require('path');

console.log('=== 1. Checking for Large Commented-Out Code Blocks (> 10 lines) ===');
const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

const commentedBlocks = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Multi-line comments /* ... */
  const blockMatches = content.match(/\/\*[\s\S]*?\*\//g) || [];
  blockMatches.forEach(block => {
    const lines = block.split('\n');
    // If block is large and looks like code (contains ;, =, function, var, const, let)
    if (lines.length > 10 && (block.includes('function') || block.includes('const ') || block.includes('let ') || block.includes('return '))) {
      // Exclude JSDoc comments
      if (!block.startsWith('/**') || block.includes('function ') || block.includes('const ')) {
        commentedBlocks.push({ file, linesCount: lines.length, preview: lines.slice(0, 3).join(' ') });
      }
    }
  });
});
console.log('Commented-out code blocks found:', commentedBlocks);

console.log('\n=== 2. Checking for Duplicate Function Declarations inside each JS file ===');
const duplicateFunctions = [];
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const funcMatches = content.matchAll(/function\s+([a-zA-Z0-9_$]+)\s*\(/g);
  const seen = {};
  for (const m of funcMatches) {
    const name = m[1];
    seen[name] = (seen[name] || 0) + 1;
  }
  const dupes = Object.entries(seen).filter(([k, count]) => count > 1);
  if (dupes.length > 0) {
    duplicateFunctions.push({ file, dupes });
  }
});
console.log('Duplicate functions within same file:', duplicateFunctions);

console.log('\n=== 3. Console.log / Debugging Statements Count ===');
const consoleLogCounts = [];
let totalLogs = 0;
jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const count = (content.match(/console\.(log|debug)\(/g) || []).length;
  if (count > 0) {
    consoleLogCounts.push({ file, count });
    totalLogs += count;
  }
});
consoleLogCounts.sort((a,b) => b.count - a.count);
console.log(`Total console.log/debug statements across all files: ${totalLogs}`);
console.log('Top 10 files with console.log:', consoleLogCounts.slice(0, 10));

console.log('\n=== 4. Root HTML Files Usage ===');
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('HTML files in root:', htmlFiles);
