const fs = require('fs');

const store = fs.readFileSync('js/store.js', 'utf8');
const rolesInStore = new Set();
const matches = store.matchAll(/role:\s*['"]([^'"]+)['"]/g);
for (const m of matches) {
  rolesInStore.add(m[1]);
}
console.log('Roles in store.js:', Array.from(rolesInStore));

const usersJs = fs.readFileSync('js/users.js', 'utf8');
const rolesInUsers = new Set();
const mUsers = usersJs.matchAll(/role:\s*['"]([^'"]+)['"]/g);
for (const m of mUsers) {
  rolesInUsers.add(m[1]);
}
console.log('Roles in users.js:', Array.from(rolesInUsers));

// Check normalizeRole or similar
console.log('app.js has normalizeRole:', fs.readFileSync('js/app.js', 'utf8').includes('normalizeRole'));
