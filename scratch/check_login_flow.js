const fs = require('fs');

console.log('=== Checking login.js login flow ===');
const login = fs.readFileSync('js/login.js', 'utf8');
const lines = login.split('\n');
lines.forEach((l, i) => {
  if (l.includes('handleLogin') || l.includes('login(') || l.includes('passwordHash') || l.includes('pharma_current_user') || l.includes('dashboard.html')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 95)}`);
  }
});
