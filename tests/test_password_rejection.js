const crypto = require('crypto');
const fs = require('fs');

function hash(p) {
  return crypto.createHash('sha256').update(p).digest('hex');
}

// Read login.js
const loginCode = fs.readFileSync('js/login.js', 'utf8');

// Extract defaultAccounts
const match = loginCode.match(/const defaultAccounts = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Could not find defaultAccounts');
  process.exit(1);
}

const accounts = eval(match[1]);

console.log('=== Testing Password Validity on All Accounts ===');
const adminAcc = accounts.find(a => a.email === 'admin@pharmacare.com');
const repAcc = accounts.find(a => a.email === 'rep@pharmacare.com');

console.log('1. Testing admin123 on admin account:');
const admin123Hash = hash('admin123');
console.log('   Hash matches admin123?', adminAcc.passwordHash === admin123Hash ? '❌ STILL MATCHES' : '✅ REJECTED (DOES NOT MATCH)');

console.log('2. Testing rep123 on rep account:');
const rep123Hash = hash('rep123');
console.log('   Hash matches rep123?', repAcc.passwordHash === rep123Hash ? '❌ STILL MATCHES' : '✅ REJECTED (DOES NOT MATCH)');

console.log('3. Testing Pharma@2026 on all accounts:');
const pharmaHash = hash('Pharma@2026');
let allMatchPharma = true;
let allValidFlags = true;

accounts.forEach(a => {
  if (a.passwordHash !== pharmaHash) {
    allMatchPharma = false;
    console.warn(`Account ${a.email} does not match Pharma@2026 hash`);
  }
  if (typeof a.mustChangePassword !== 'boolean') {
    allValidFlags = false;
    console.warn(`Account ${a.email} mustChangePassword flag is invalid`);
  }
});

if (allMatchPharma && allValidFlags) {
  console.log(`🎉 SUCCESS: All ${accounts.length} default accounts strictly accept Pharma@2026 and have valid mustChangePassword configuration!`);
} else {
  console.error('❌ FAILED: Accounts configuration error');
  process.exit(1);
}
