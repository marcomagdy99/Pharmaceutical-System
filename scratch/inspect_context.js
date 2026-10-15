const fs = require('fs');
const lines = fs.readFileSync('js/dashboard.js', 'utf8').split('\n');

const targetLineNumbers = [1044, 1366, 1413, 1500, 1855, 2021, 3377, 3590, 3640, 3688];

targetLineNumbers.forEach(ln => {
  console.log(`\n=================== Context around L${ln} ===================`);
  const start = Math.max(0, ln - 6);
  const end = Math.min(lines.length, ln + 6);
  for (let i = start; i < end; i++) {
    console.log(`L${i+1}: ${lines[i]}`);
  }
});
