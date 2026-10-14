const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, '..', 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

console.log('=== Deep Sweep 2: Comprehensive Integrity Check ===');

// 1. Inspect DEMO_DATA structure and keys in store.js
const storeContent = fs.readFileSync(path.join(jsDir, 'store.js'), 'utf8');
const demoDataMatch = storeContent.match(/window\.DEMO_DATA\s*=\s*\{([\s\S]*?)\n\s*\};/);
if (demoDataMatch) {
  console.log('Found DEMO_DATA definition in store.js');
}

// 2. Check all collections in firebase-sync.js vs DEMO_DATA
const syncContent = fs.readFileSync(path.join(jsDir, 'firebase-sync.js'), 'utf8');
const arrayCollsMatch = syncContent.match(/const\s+arrayCollections\s*=\s*\[([\s\S]*?)\];/);
if (arrayCollsMatch) {
  const colls = arrayCollsMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  console.log(`\nfirebase-sync arrayCollections count: ${colls.length}`);
  console.log('Collections:', colls.join(', '));
}

// 3. Check for any undefined variables in HTML templates or onclick handlers
console.log('\n--- 3. Checking HTML onclick handlers for undefined functions ---');
const htmlFiles = fs.readdirSync(path.join(__dirname, '..')).filter(f => f.endsWith('.html'));
const declaredWindowFunctions = new Set();
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const winMatches = content.matchAll(/window\.([a-zA-Z0-9_]+)\s*=/g);
  for (const m of winMatches) declaredWindowFunctions.add(m[1]);
  const fnMatches = content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g);
  for (const m of fnMatches) declaredWindowFunctions.add(m[1]);
});

htmlFiles.forEach(hf => {
  const hContent = fs.readFileSync(path.join(__dirname, '..', hf), 'utf8');
  const onclicks = hContent.matchAll(/onclick="([a-zA-Z0-9_]+)\(/g);
  for (const oc of onclicks) {
    const fnName = oc[1];
    if (!declaredWindowFunctions.has(fnName)) {
      console.log(`[${hf}] onclick references possibly undeclared function: ${fnName}`);
    }
  }
});

// 4. Check all reject reasons and status transitions
console.log('\n--- 4. Checking rejection handling in plans-review.js ---');
const plansContent = fs.readFileSync(path.join(jsDir, 'plans-review.js'), 'utf8');
const rejectPlanMatch = plansContent.match(/confirmRejectPlan[\s\S]*?\{([\s\S]*?)\n  \},/);
if (rejectPlanMatch) {
  const body = rejectPlanMatch[1];
  console.log('confirmRejectPlan logic summary:');
  const lines = body.split('\n').filter(l => l.includes('status') || l.includes('v.') || l.includes('reason'));
  lines.forEach(l => console.log('  ', l.trim()));
}

// 5. Check missing keys or inconsistent naming in store.js
console.log('\n--- 5. Checking store modules and storage keys ---');
const storeModules = storeContent.matchAll(/([a-zA-Z0-9_]+):\s*\{\s*\n\s*(?:STORAGE_KEY|getAll)/g);
for (const sm of storeModules) {
  console.log(`  store module: ${sm[1]}`);
}
