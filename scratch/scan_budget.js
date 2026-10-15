const fs = require('fs');

const content = fs.readFileSync('js/activities-tab-budget.js', 'utf8');
const lines = content.split('\n');

const styleLines = [];
lines.forEach((line, idx) => {
    if (line.includes('style="') || line.includes("style='")) {
        styleLines.push({ lineNum: idx + 1, content: line.trim() });
    }
});

console.log('Total style= occurrences in activities-tab-budget.js:', styleLines.length);
styleLines.forEach(s => {
    console.log(`L${s.lineNum}: ${s.content}`);
});
