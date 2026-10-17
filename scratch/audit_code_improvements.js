const fs = require('fs');
const path = require('path');

const jsFiles = fs.readdirSync('js')
  .filter(f => f.endsWith('.js') && !f.includes('min') && f !== 'chart.umd.min.js')
  .map(f => path.join('js', f));

const roleCounts = {};
const storageKeyCounts = {};
const datePatternCounts = {};
const currencyPatterns = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // 1. Role matches
  const roleMatches = content.match(/['"](gm|bu|pm|lm|dm|rep|hr|admin)['"]/gi) || [];
  roleMatches.forEach(r => {
    const clean = r.replace(/['"]/g, '').toLowerCase();
    roleCounts[clean] = (roleCounts[clean] || 0) + 1;
  });

  // 2. LocalStorage matches
  const storageMatches = content.match(/localStorage\.(getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]/g) || [];
  storageMatches.forEach(s => {
    const m = s.match(/['"]([^'"]+)['"]/);
    if (m) {
      const key = m[1];
      storageKeyCounts[key] = (storageKeyCounts[key] || 0) + 1;
    }
  });

  // 3. Date repetitions
  const dateSplits = (content.match(/toISOString\(\)\.split\(['"]T['"]\)\[0\]/g) || []).length;
  if (dateSplits > 0) datePatternCounts['toISOString().split("T")[0]'] = (datePatternCounts['toISOString().split("T")[0]'] || 0) + dateSplits;

  const toLocale = (content.match(/toLocaleDateString/g) || []).length;
  if (toLocale > 0) datePatternCounts['toLocaleDateString'] = (datePatternCounts['toLocaleDateString'] || 0) + toLocale;

  // 4. Currency / EGP repetitions
  const egpMatches = (content.match(/['"]\s*EGP['"]|EGP\s*['"]/gi) || []).length;
  if (egpMatches > 0) currencyPatterns.push({ file, count: egpMatches });
});

console.log('=== 1. Role String Repetitions ===');
console.log(roleCounts);

console.log('\n=== 2. LocalStorage Hardcoded Keys ===');
const sortedStorage = Object.entries(storageKeyCounts).sort((a,b) => b[1] - a[1]);
console.log(sortedStorage.slice(0, 15));

console.log('\n=== 3. Date Formatting Repetitions ===');
console.log(datePatternCounts);

console.log('\n=== 4. Currency / EGP Repetitions ===');
console.log(currencyPatterns.slice(0, 10));
