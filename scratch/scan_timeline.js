const fs = require('fs');

const content = fs.readFileSync('js/timeline-report.js', 'utf8');
const lines = content.split('\n');

const styleLines = [];
const domStyles = [];

lines.forEach((line, idx) => {
    if (line.includes('style="') || line.includes("style='")) {
        styleLines.push({ lineNum: idx + 1, content: line.trim() });
    }
    if (line.includes('.style.') || line.includes('.style[')) {
        domStyles.push({ lineNum: idx + 1, content: line.trim() });
    }
});

console.log('Total style= occurrences in timeline-report.js:', styleLines.length);
styleLines.forEach(s => {
    console.log(`L${s.lineNum}: ${s.content}`);
});

console.log('\nTotal DOM style actions in timeline-report.js:', domStyles.length);
domStyles.forEach(d => {
    console.log(`L${d.lineNum}: ${d.content}`);
});
