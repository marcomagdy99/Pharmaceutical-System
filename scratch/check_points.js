const fs = require('fs');

console.log('--- Checking js/leaves.js ---');
const leaves = fs.readFileSync('js/leaves.js', 'utf8');

// 1. Upper-tier submitter
const matchSubmitter = leaves.match(/isSubmitter(Lm|Bu|Dm|LineManager|BuManager)/i) || 
                       leaves.match(/submitterRole/i) || 
                       leaves.match(/approvals\.dm/i);
console.log('Submitter check match:', matchSubmitter ? matchSubmitter[0] : 'None');

// Find sections in leaves.js discussing submitter role or skipping DM/LM
const lines = leaves.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Leave balance updated for') ||
      l.includes('secDayName') ||
      l.includes('excludedThursdays') ||
      l.includes('approvals.bu') ||
      l.includes('bu.status') ||
      (l.includes('skip') && l.includes('dm')) ||
      l.includes('Upper-Tier') ||
      l.includes('buManager') ||
      l.includes('line_manager')) {
    if (idx < 500 || idx > 2500) {
      // sample
    }
    console.log(`Line ${idx + 1}: ${l.trim().slice(0, 110)}`);
  }
});

console.log('\n--- Checking Activities files ---');
const actFiles = fs.readdirSync('js').filter(f => f.startsWith('activities'));
actFiles.forEach(f => {
  const content = fs.readFileSync('js/' + f, 'utf8');
  if (content.includes('belongsToMyHierarchy') || content.includes('canApproveFor')) {
    console.log(`${f} has match!`);
    const flines = content.split('\n');
    flines.forEach((l, idx) => {
      if (l.includes('belongsToMyHierarchy') || l.includes('canApproveFor')) {
        console.log(`  [${f}:${idx + 1}] ${l.trim().slice(0, 110)}`);
      }
    });
  }
});
