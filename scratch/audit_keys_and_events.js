const fs = require('fs');
const path = require('path');
const jsDir = path.join(__dirname, '..', 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

console.log('=== Deep Storage Keys & Events Audit ===');

// 1. Audit localStorage keys
const storageKeys = new Map();
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const matches = content.matchAll(/localStorage\.(?:getItem|setItem|removeItem)\(\s*["']([^"']+)["']/g);
  for (const m of matches) {
    const key = m[1];
    if (!storageKeys.has(key)) storageKeys.set(key, []);
    storageKeys.get(key).push(f);
  }
});

console.log('\n--- LocalStorage Keys Used ---');
for (const [key, fileList] of storageKeys.entries()) {
  const uniqueFiles = Array.from(new Set(fileList));
  if (uniqueFiles.length === 1 && !key.startsWith('pharma_') && !key.startsWith('user_photo_')) {
    console.log(`[Single File Key] "${key}" in ${uniqueFiles[0]}`);
  }
}

// 2. Audit CustomEvent dispatch vs addEventListener
console.log('\n--- Custom Events Audit ---');
const dispatched = new Set();
const listened = new Set();
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const dMatches = content.matchAll(/(?:document|window)\.dispatchEvent\(\s*new\s+CustomEvent\(\s*["']([^"']+)["']/g);
  for (const m of dMatches) dispatched.add(m[1]);
  const lMatches = content.matchAll(/(?:document|window)\.addEventListener\(\s*["']([^"']+)["']/g);
  for (const m of lMatches) listened.add(m[1]);
});

console.log('Dispatched events not listened to (or only in HTML):');
for (const e of dispatched) {
  if (!listened.has(e)) console.log(`  Dispatched: "${e}"`);
}

// 3. Search for undefined checks like .length on undefined
console.log('\n--- Suspicious property accesses ---');
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    // Check for v.repId when v could be undefined or null
    if (l.includes('.repId') && !l.includes('?') && !l.includes('if (') && !l.includes('&&') && l.includes('v.repId')) {
      // check if inside filter or forEach
      if (l.includes('return v.repId') || l.includes('v.repId ===')) {
        // usually fine if visits are objects
      }
    }
  });
});

console.log('Done scanning.');
