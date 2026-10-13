const fs = require('fs');

const files = ['js/app.js', 'js/leaves.js', 'js/products.js', 'js/quizzes.js', 'js/plans-review.js'];
files.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (l.includes('Hassan Ali') || l.includes('Karim Nasser')) {
      console.log(`${f}:${i + 1} -> ${l.trim()}`);
    }
  });
});
