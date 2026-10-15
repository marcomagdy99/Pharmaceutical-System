const fs = require('fs');
const content = fs.readFileSync('js/dashboard.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.match(/^(function\s+[a-zA-Z0-9_]+|window\.[a-zA-Z0-9_]+\s*=|const\s+[a-zA-Z0-9_]+\s*=\s*function|\b[a-zA-Z0-9_]+\s*:\s*function|\basync\s+function)/)) {
    console.log(`${idx + 1}: ${l.trim().slice(0, 80)}`);
  }
});
