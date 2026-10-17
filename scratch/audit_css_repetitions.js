const fs = require('fs');
const path = require('path');

const cssDir = 'css';
const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));

const stats = {
  colors: {},
  shadows: {},
  radiuses: {},
  transitions: {},
  zIndexes: {},
  fontSizes: {}
};

files.forEach(file => {
  const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach(line => {
    // Colors (hex & rgba)
    const hexes = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexes) {
      hexes.forEach(h => {
        const c = h.toLowerCase();
        stats.colors[c] = (stats.colors[c] || 0) + 1;
      });
    }

    // Box shadows
    const shadowMatch = line.match(/box-shadow:\s*([^;]+);/);
    if (shadowMatch) {
      const s = shadowMatch[1].trim();
      stats.shadows[s] = (stats.shadows[s] || 0) + 1;
    }

    // Border radius
    const radiusMatch = line.match(/border-radius:\s*([^;]+);/);
    if (radiusMatch) {
      const r = radiusMatch[1].trim();
      stats.radiuses[r] = (stats.radiuses[r] || 0) + 1;
    }

    // Transitions
    const transMatch = line.match(/transition:\s*([^;]+);/);
    if (transMatch) {
      const t = transMatch[1].trim();
      stats.transitions[t] = (stats.transitions[t] || 0) + 1;
    }

    // Z-index
    const zMatch = line.match(/z-index:\s*([0-9]+);/);
    if (zMatch) {
      const z = zMatch[1].trim();
      stats.zIndexes[z] = (stats.zIndexes[z] || 0) + 1;
    }

    // Font-size
    const fontMatch = line.match(/font-size:\s*([^;]+);/);
    if (fontMatch) {
      const f = fontMatch[1].trim();
      stats.fontSizes[f] = (stats.fontSizes[f] || 0) + 1;
    }
  });
});

console.log('=== CSS REPETITION AUDIT RESULTS ===\n');

console.log('--- Top 10 Box Shadows ---');
console.log(Object.entries(stats.shadows).sort((a,b) => b[1] - a[1]).slice(0, 10));

console.log('\n--- Top 10 Border Radiuses ---');
console.log(Object.entries(stats.radiuses).sort((a,b) => b[1] - a[1]).slice(0, 10));

console.log('\n--- Top 10 Transitions ---');
console.log(Object.entries(stats.transitions).sort((a,b) => b[1] - a[1]).slice(0, 10));

console.log('\n--- Top 10 Z-Indexes ---');
console.log(Object.entries(stats.zIndexes).sort((a,b) => b[1] - a[1]).slice(0, 10));

console.log('\n--- Top 10 Font Sizes ---');
console.log(Object.entries(stats.fontSizes).sort((a,b) => b[1] - a[1]).slice(0, 10));

console.log('\n--- Top Remaining Colors across ALL CSS files ---');
console.log(Object.entries(stats.colors).sort((a,b) => b[1] - a[1]).slice(0, 15));
