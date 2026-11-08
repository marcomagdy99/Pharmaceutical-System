/**
 * @file bump-version.js
 * @description Centralized Version Synchronization Script.
 * Synchronizes version across sw.js, cache-bust.js, and all HTML files.
 *
 * Usage:
 *   node scripts/bump-version.js [newVersion]
 * Example:
 *   node scripts/bump-version.js v281
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const swPath = path.join(rootDir, 'sw.js');
const cbPath = path.join(rootDir, 'js/cache-bust.js');

let targetVersion = process.argv[2];

if (!targetVersion) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  const m = swContent.match(/const CACHE_VERSION = ['"]v(\d+)['"];/);
  if (m) {
    const nextNum = parseInt(m[1], 10) + 1;
    targetVersion = 'v' + nextNum;
  } else {
    targetVersion = 'v' + Date.now();
  }
}

console.log('Target Version:', targetVersion);

// 1. Update sw.js
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/const CACHE_VERSION = ['"][^'"]+['"];/, `const CACHE_VERSION = '${targetVersion}';`);
fs.writeFileSync(swPath, sw, 'utf8');
console.log('Updated sw.js CACHE_VERSION ->', targetVersion);

// 2. Update cache-bust.js
let cb = fs.readFileSync(cbPath, 'utf8');
cb = cb.replace(/var EXPECTED_SW = ['"][^'"]+['"];/, `var EXPECTED_SW = "${targetVersion}";`);
fs.writeFileSync(cbPath, cb, 'utf8');
console.log('Updated cache-bust.js EXPECTED_SW ->', targetVersion);

// 3. Update all HTML files
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
htmlFiles.forEach(f => {
  const fp = path.join(rootDir, f);
  let c = fs.readFileSync(fp, 'utf8');
  c = c.replace(/\?v=v\d+/g, `?v=${targetVersion}`);
  fs.writeFileSync(fp, c, 'utf8');
});
console.log(`Updated ${htmlFiles.length} HTML files with ?v=${targetVersion}`);
console.log('Version synchronization complete!');
