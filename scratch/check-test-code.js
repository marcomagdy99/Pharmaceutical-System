const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'scratch') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      if (file.includes('test-suite') || file.includes('test-') || file.includes('testing')) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (
          line.includes('doc_test_') ||
          line.includes('Dr. Test Medical') ||
          line.includes('purgeAllTest') ||
          line.includes('srv_sim_')
        ) {
          console.log(`MATCH: ${fullPath}:${idx + 1} -> ${line.trim().substring(0, 100)}`);
        }
      });
    }
  }
}

console.log('--- Scanning Production Files ---');
searchDir('.');
console.log('--- Scan Completed ---');
