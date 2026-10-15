const fs = require('fs');
const path = require('path');

const userIdsToCheck = [
  'rep1', 'rep2', 'rep3', 'rep4', 'rep5',
  'admin1', 'bu1', 'lm1', 'lm2',
  'dm1', 'dm2', 'dm3', 'hr1', 'pm1', 'pm2'
];

const dirs = ['js', '.'];
const results = {};
for (const id of userIdsToCheck) results[id] = [];

function scanFile(filePath) {
  if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('scratch') || filePath.includes('dist')) return;
  if (!filePath.endsWith('.js') && !filePath.endsWith('.html')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  for (const id of userIdsToCheck) {
    // Look for exact id usages like 'rep1', "rep1", `rep1`, id: 'rep1', repId === 'rep1', etc.
    const regex = new RegExp(`['"\`:]\\s*${id}\\b|\\b${id}\\b\\s*===|===\\s*\\b${id}\\b`, 'g');
    // More targeted: match exact token bounded by quotes or word boundary where applicable
    const tokenRegex = new RegExp(`(['"\`])${id}\\1`, 'g');
    if (tokenRegex.test(content)) {
      results[id].push(filePath);
    }
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (dir === '.') {
        if (f === 'js') scanDir(full);
      }
    } else {
      scanFile(full);
    }
  }
}

scanDir('.');
scanDir('js');

console.log('=== AUDIT RESULTS FOR ALL LEGACY USER IDs ===');
let foundAny = false;
for (const id of userIdsToCheck) {
  const unique = Array.from(new Set(results[id]));
  if (unique.length > 0) {
    foundAny = true;
    console.log(`❌ ${id}: found in ${unique.join(', ')}`);
  } else {
    console.log(`✅ ${id}: 0 occurrences`);
  }
}

if (!foundAny) {
  console.log('\n🎉 ZERO legacy user IDs found across all active JS and HTML files!');
}
