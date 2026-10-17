const fs = require('fs');
const path = require('path');

const targetFiles = [
  'css/reports.css',
  'css/dashboard.css',
  'css/visits.css',
  'css/calendar.css',
  'css/leaves.css',
  'css/products.css'
];

const results = {};

targetFiles.forEach(relPath => {
  if (!fs.existsSync(relPath)) return;
  const content = fs.readFileSync(relPath, 'utf8');
  const lines = content.split(/\r?\n/);

  const colorCounts = {};
  const darkThemeColors = {};
  const lightThemeColors = {};
  const sampleSelectors = {};

  let inDark = false;
  let braceDepth = 0;

  lines.forEach((line, idx) => {
    if (line.includes('[data-theme="dark"]')) {
      inDark = true;
    }

    if (inDark) {
      if (line.includes('{')) braceDepth++;
      if (line.includes('}')) {
        braceDepth--;
        if (braceDepth <= 0) {
          inDark = false;
          braceDepth = 0;
        }
      }
    }

    const matches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (matches) {
      matches.forEach(m => {
        const hex = m.toLowerCase();
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        if (inDark) {
          darkThemeColors[hex] = (darkThemeColors[hex] || 0) + 1;
        } else {
          lightThemeColors[hex] = (lightThemeColors[hex] || 0) + 1;
        }

        if (!sampleSelectors[hex]) sampleSelectors[hex] = [];
        if (sampleSelectors[hex].length < 3) {
          sampleSelectors[hex].push({ lineNum: idx + 1, text: line.trim() });
        }
      });
    }
  });

  const total = Object.values(colorCounts).reduce((a, b) => a + b, 0);
  const sortedColors = Object.entries(colorCounts).sort((a,b) => b[1] - a[1]);

  results[relPath] = {
    total,
    uniqueCount: sortedColors.length,
    topColors: sortedColors.slice(0, 10),
    darkTotal: Object.values(darkThemeColors).reduce((a, b) => a + b, 0),
    lightTotal: Object.values(lightThemeColors).reduce((a, b) => a + b, 0),
    sampleSelectors
  };
});

fs.writeFileSync('scratch/deep_css_analysis.json', JSON.stringify(results, null, 2));

console.log('=== SUMMARY OF REMAINING 6 CSS FILES ===\n');
for (const [file, data] of Object.entries(results)) {
  console.log(`--- ${file} (Total: ${data.total} occurrences, Unique: ${data.uniqueCount}) ---`);
  console.log(`  Light Mode Hexes: ${data.lightTotal} | Dark Mode Overrides Hexes: ${data.darkTotal}`);
  console.log('  Top Colors:');
  data.topColors.forEach(([hex, count]) => {
    console.log(`    ${hex}: ${count} times`);
  });
  console.log('');
}
