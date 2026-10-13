const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (['node_modules', '.git', 'scratch', 'brain'].includes(f)) continue;
    if (fs.statSync(full).isDirectory()) {
      searchDir(full, pattern);
    } else if (f.endsWith('.js') || f.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      if (pattern.test(content)) {
        console.log(`Found match in: ${full}`);
      }
    }
  }
}

console.log('Searching for "Hassan Ali":');
searchDir('.', /Hassan Ali/);

console.log('Searching for "Karim Nasser":');
searchDir('.', /Karim Nasser/);
