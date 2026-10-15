const fs = require('fs');

console.log('=== Migrating All Legacy Passwords to Pharma@2026 with mustChangePassword ===');

const PHARMA2026_HASH = '9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f';

const oldHashes = [
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
  'd041f6dd2d671f68144bd4d667f96a6146dbf2ed0f71f19b532ce1e2826f8f92', // bu123
  '89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b', // lm123
  'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869', // dm123
  '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', // rep123
  'ae087349bb953601482c9c52169257c0cb0371cbac3d921b5896a9aba8cc8a43', // pm123
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', // pm2 / generic
  '070a3b5e8d4bd5c46acccb91c9c54614c0cd649e78c4c4719e3a64270bae5ddf'  // hr123
];

// 1. Update js/login.js
let login = fs.readFileSync('js/login.js', 'utf8');

// Replace old hashes in defaultAccounts with PHARMA2026_HASH
for (const h of oldHashes) {
  login = login.replaceAll(h, PHARMA2026_HASH);
}

// In defaultAccounts items, add mustChangePassword: true if not present
login = login.replace(/(\{\s*email:[^\n]+id:\s*['"]u[0-9]+['"][^\n]*?)(\s*\})/g, (match, prefix, suffix) => {
  if (!prefix.includes('mustChangePassword')) {
    return `${prefix}, mustChangePassword: true${suffix}`;
  }
  return match;
});

// Also in default resolved fallback hash
login = login.replace(
  "resolvedHash = u.passwordHash || (defaultAcc ? defaultAcc.passwordHash : '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');",
  `resolvedHash = u.passwordHash || (defaultAcc ? defaultAcc.passwordHash : '${PHARMA2026_HASH}');`
);

fs.writeFileSync('js/login.js', login, 'utf8');
console.log('✅ Updated js/login.js: All default accounts now use Pharma@2026 hash and mustChangePassword: true');

// 2. Update js/app.js
let app = fs.readFileSync('js/app.js', 'utf8');

for (const h of oldHashes) {
  app = app.replaceAll(h, PHARMA2026_HASH);
}

// Add auto-migration in loadDataFromStorage to reset any old cached demo hashes to Pharma@2026 with mustChangePassword = true
const autoMigrateUsersTarget = `      if (Array.isArray(data.users)) {
        data.users.forEach((u) => {
          if (legacyIdMap[u.id]) u.id = legacyIdMap[u.id];`;

const autoMigrateUsersEnhanced = `      const legacyOldHashes = [
        "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
        "d041f6dd2d671f68144bd4d667f96a6146dbf2ed0f71f19b532ce1e2826f8f92",
        "89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b",
        "d174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869",
        "9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2",
        "ae087349bb953601482c9c52169257c0cb0371cbac3d921b5896a9aba8cc8a43",
        "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "070a3b5e8d4bd5c46acccb91c9c54614c0cd649e78c4c4719e3a64270bae5ddf"
      ];
      if (Array.isArray(data.users)) {
        data.users.forEach((u) => {
          if (legacyIdMap[u.id]) u.id = legacyIdMap[u.id];
          if (u.passwordHash && legacyOldHashes.includes(u.passwordHash)) {
            u.passwordHash = "${PHARMA2026_HASH}";
            u.mustChangePassword = true;
          }`;

app = app.replace(autoMigrateUsersTarget, autoMigrateUsersEnhanced);
fs.writeFileSync('js/app.js', app, 'utf8');
console.log('✅ Updated js/app.js: Auto-migration resets old demo hashes to Pharma@2026 + mustChangePassword');
