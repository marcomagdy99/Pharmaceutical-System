const fs = require('fs');

const files = [
  'css/announcements.css',
  'css/areas.css',
  'css/login.css',
  'css/profile.css',
  'css/quizzes.css'
];

const results = {};

files.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  const counts = {};
  const samples = {};
  let darkCount = 0;
  let lightCount = 0;
  let inDark = false;
  let braceDepth = 0;

  lines.forEach((line, idx) => {
    if (line.includes('[data-theme="dark"]')) inDark = true;
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
        counts[hex] = (counts[hex] || 0) + 1;
        if (inDark) darkCount++; else lightCount++;

        if (!samples[hex]) samples[hex] = [];
        if (samples[hex].length < 3) {
          samples[hex].push({ lineNum: idx + 1, text: line.trim() });
        }
      });
    }
  });

  results[filePath] = {
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    lightCount,
    darkCount,
    topColors: Object.entries(counts).sort((a,b) => b[1] - a[1]),
    samples
  };
});

fs.writeFileSync('scratch/remaining_5_analysis.json', JSON.stringify(results, null, 2));

console.log('=== ANALYSIS OF REMAINING 5 FILES ===\n');
for (const [file, data] of Object.entries(results)) {
  console.log(`\n=============================`);
  console.log(`FILE: ${file} (Total: ${data.total} occurrences | Light: ${data.lightCount} | Dark: ${data.darkCount})`);
  console.log(`=============================`);
  data.topColors.slice(0, 10).forEach(([hex, count]) => {
    console.log(`Color ${hex}: ${count} times`);
    if (data.samples[hex]) {
      data.samples[hex].forEach(s => console.log(`   L${s.lineNum}: ${s.text}`));
    }
  });
}
