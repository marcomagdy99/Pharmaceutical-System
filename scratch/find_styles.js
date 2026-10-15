const fs = require('fs');
const file = process.argv[2];
if (!file) {
  console.log('Provide a file relative to project root');
  process.exit(1);
}
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('style="') || line.includes("style='") || line.includes('.style.')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
