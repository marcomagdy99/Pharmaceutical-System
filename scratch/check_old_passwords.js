const fs = require('fs');

console.log('=== Checking old passwords in login.js ===');
const login = fs.readFileSync('js/login.js', 'utf8');
const loginLines = login.split('\n');
loginLines.forEach((l, i) => {
  if (l.includes('passwordHash') || l.includes('password:') || l.includes('admin123') || l.includes('rep123')) {
    if (i < 340) {
      console.log(`login.js:${i+1}: ${l.trim().slice(0, 100)}`);
    }
  }
});

console.log('\n=== Checking users in app.js for passwords ===');
const app = fs.readFileSync('js/app.js', 'utf8');
const appLines = app.split('\n');
appLines.forEach((l, i) => {
  if (l.includes('password') && (l.includes('admin') || l.includes('rep') || l.includes('hash') || l.includes('Hash'))) {
    if (i < 800) {
      console.log(`app.js:${i+1}: ${l.trim().slice(0, 100)}`);
    }
  }
});
