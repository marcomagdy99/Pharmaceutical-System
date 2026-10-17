const { execSync } = require('child_process');

const gitPath = 'C:\\Users\\DeLL\\AppData\\Local\\GitHubDesktop\\app-3.6.7\\resources\\app\\git\\cmd\\git.exe';
const gitArg = process.argv[2] || 'diff';
const diff = execSync(`"${gitPath}" ${gitArg}`).toString('utf8');

const arabicRegex = /[\u0600-\u06FF]/;
const lines = diff.split(/\r?\n/);
const arabicDiffLines = [];

lines.forEach((line, idx) => {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    if (arabicRegex.test(line)) {
      arabicDiffLines.push({ lineNum: idx + 1, content: line });
    }
  }
});

console.log('Arabic lines added in diff:', arabicDiffLines.length);
if (arabicDiffLines.length > 0) {
  console.log('Found Arabic lines:');
  arabicDiffLines.forEach(l => console.log(l));
} else {
  console.log('CONFIRMED: ZERO Arabic comments or strings found in git diff!');
}
