const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const jsDir = path.join(rootDir, 'js');

console.log('=== Ultra Deep Sweep 3 ===');

// Check 1: sw.js cached assets vs real files on disk
const swContent = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
const cacheMatch = swContent.match(/const\s+ASSETS_TO_CACHE\s*=\s*\[([\s\S]*?)\];/);
if (cacheMatch) {
  const assets = cacheMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  console.log(`\n--- 1. Service Worker Assets Check (Total: ${assets.length}) ---`);
  let missingCount = 0;
  assets.forEach(asset => {
    // Strip leading slash or query params
    const cleanAsset = asset.split('?')[0].replace(/^\//, '');
    if (!cleanAsset) return;
    const fullPath = path.join(rootDir, cleanAsset);
    if (!fs.existsSync(fullPath)) {
      console.log(`[sw.js] MISSING CACHE ASSET ON DISK: "${cleanAsset}"`);
      missingCount++;
    }
  });
  if (missingCount === 0) {
    console.log('All cached assets in sw.js exist on disk!');
  }
}

// Check 2: Check all HTML files for missing script dependencies
console.log('\n--- 2. Checking HTML files script references ---');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
htmlFiles.forEach(hf => {
  const content = fs.readFileSync(path.join(rootDir, hf), 'utf8');
  const scripts = content.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
  for (const s of scripts) {
    const src = s[1].split('?')[0];
    if (src.startsWith('http') || src.startsWith('//')) continue;
    const fullPath = path.join(rootDir, src.replace(/^\//, ''));
    if (!fs.existsSync(fullPath)) {
      console.log(`[${hf}] Broken script tag src: "${src}"`);
    }
  }
});

// Check 3: Inspect handlePinClinicLocation in visits.js
console.log('\n--- 3. Checking handlePinClinicLocation in visits.js ---');
const visitsContent = fs.readFileSync(path.join(jsDir, 'visits.js'), 'utf8');
const pinMatch = visitsContent.match(/function\s+handlePinClinicLocation[\s\S]*?\{([\s\S]*?)\n\}/);
if (pinMatch) {
  const pinBody = pinMatch[1];
  console.log('Found handlePinClinicLocation. Checking references:');
  ['allDocs', 'allHosps', 'accountLocationRequests', 'submit'].forEach(term => {
    console.log(`  Contains "${term}": ${pinBody.includes(term)}`);
  });
}

// Check 4: Check if bump_version.js targetVersion is set
console.log('\n--- 4. Checking bump_version.js ---');
const bumpContent = fs.readFileSync(path.join(rootDir, 'scratch', 'bump_version.js'), 'utf8');
const targetVerMatch = bumpContent.match(/targetVersion\s*=\s*["']([^"']+)["']/);
if (targetVerMatch) {
  console.log(`bump_version.js targetVersion: "${targetVerMatch[1]}"`);
}
const appContent = fs.readFileSync(path.join(jsDir, 'app.js'), 'utf8');
const expectedSwMatch = appContent.match(/EXPECTED_SW\s*=\s*["']([^"']+)["']/);
if (expectedSwMatch) {
  console.log(`app.js EXPECTED_SW: "${expectedSwMatch[1]}"`);
}
