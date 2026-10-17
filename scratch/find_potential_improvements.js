const fs = require('fs');

console.log('--- Checking versioning ---');
const appJs = fs.readFileSync('js/app.js', 'utf8');
const versionLines = appJs.split('\n').filter(l => /version/i.test(l) && (l.includes('=') || l.includes(':')));
console.log('Version lines in app.js:', versionLines);

if (fs.existsSync('sw.js')) {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const swCache = sw.split('\n').filter(l => /cache/i.test(l) && l.includes('='));
  console.log('SW cache lines:', swCache);
} else {
  console.log('sw.js does not exist');
}

console.log('\n--- Checking favicon / meta tags in HTML files ---');
const htmls = ['dashboard.html', 'users.html', 'visits.html', 'products.html', 'reports.html'].filter(f => fs.existsSync(f));
htmls.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const hasFavicon = content.includes('rel="icon"') || content.includes("rel='icon'");
  const hasMetaTheme = content.includes('theme-color');
  console.log(`${f}: favicon=${hasFavicon}, theme-color=${hasMetaTheme}`);
});

console.log('\n--- Checking keyboard shortcuts / ESC modal close ---');
const escHandling = appJs.includes('Escape') || appJs.includes('keyCode === 27');
console.log('Global Escape key modal handling in app.js:', escHandling);
