const fs = require('fs');

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let inBlockComment = false;
  let hasArabicComment = false;

  lines.forEach((line, idx) => {
    let commentText = '';
    const trimmed = line.trim();

    if (inBlockComment) {
      const endIdx = line.indexOf('*/');
      if (endIdx !== -1) {
        commentText = line.substring(0, endIdx);
        inBlockComment = false;
      } else {
        commentText = line;
      }
    } else {
      const slashSlashIdx = line.indexOf('//');
      const slashStarIdx = line.indexOf('/*');

      if (slashSlashIdx !== -1 && (slashStarIdx === -1 || slashSlashIdx < slashStarIdx)) {
        const before = line.substring(0, slashSlashIdx);
        const singleQuotes = (before.match(/'/g) || []).length;
        const doubleQuotes = (before.match(/"/g) || []).length;
        const backticks = (before.match(/`/g) || []).length;
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backticks % 2 === 0) {
          commentText = line.substring(slashSlashIdx + 2);
        }
      } else if (slashStarIdx !== -1) {
        const before = line.substring(0, slashStarIdx);
        const singleQuotes = (before.match(/'/g) || []).length;
        const doubleQuotes = (before.match(/"/g) || []).length;
        const backticks = (before.match(/`/g) || []).length;
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backticks % 2 === 0) {
          const endIdx = line.indexOf('*/', slashStarIdx + 2);
          if (endIdx !== -1) {
            commentText = line.substring(slashStarIdx + 2, endIdx);
          } else {
            commentText = line.substring(slashStarIdx + 2);
            inBlockComment = true;
          }
        }
      }
    }

    if (commentText) {
      const arabicMatch = commentText.match(/[\u0600-\u06FF]/);
      if (arabicMatch) {
        console.error(`ARABIC COMMENT DETECTED in ${filePath} line ${idx + 1}: ${line}`);
        hasArabicComment = true;
      }
    }
  });

  if (!hasArabicComment) {
    console.log(`PASS: No Arabic comments in ${filePath}`);
  } else {
    process.exitCode = 1;
  }
}

['js/visits.js', 'js/shared-report.js', 'sw.js', 'distributors.html'].forEach(checkFile);
