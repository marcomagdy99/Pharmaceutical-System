const fs = require('fs');
const path = require('path');

const cssDir = 'css';
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

const stats = {
  backdropFilters: {},
  gradients: {},
  paddings: {},
  gaps: {},
  scrollbars: {},
  fileColors: {}
};

files.forEach(file => {
  const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
  const lines = content.split(/\r?\n/);

  let hexCount = 0;
  lines.forEach(line => {
    // Backdrop filter
    const bf = line.match(/backdrop-filter:\s*([^;]+);/);
    if (bf) {
      const v = bf[1].trim();
      stats.backdropFilters[v] = (stats.backdropFilters[v] || 0) + 1;
    }

    // Gradients
    const gr = line.match(/linear-gradient\([^)]+\)/g);
    if (gr) {
      gr.forEach(g => {
        stats.gradients[g] = (stats.gradients[g] || 0) + 1;
      });
    }

    // Gaps
    const gap = line.match(/\bgap:\s*([0-9]+px|[0-9.]+rem);/);
    if (gap) {
      const v = gap[1].trim();
      stats.gaps[v] = (stats.gaps[v] || 0) + 1;
    }

    // Hex matches per file
    const hex = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hex) hexCount += hex.length;
  });

  stats.fileColors[file] = hexCount;
});

console.log('--- Backdrop Filters ---');
console.log(stats.backdropFilters);

console.log('\n--- Linear Gradients ---');
console.log(Object.entries(stats.gradients).sort((a,b) => b[1] - a[1]));

console.log('\n--- Gaps ---');
console.log(Object.entries(stats.gaps).sort((a,b) => b[1] - a[1]).slice(0, 10));

console.log('\n--- Remaining Hex Colors Per CSS File ---');
console.log(Object.entries(stats.fileColors).sort((a,b) => b[1] - a[1]));
