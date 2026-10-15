const fs = require('fs');

const profileContent = fs.readFileSync('js/profile.js', 'utf8');
const lines = profileContent.split('\n');

lines.forEach((l, i) => {
  if (l.includes('goLive') || l.includes('reset') || l.includes('backup') || l.includes('production') || l.includes('demo')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 95)}`);
  }
});
