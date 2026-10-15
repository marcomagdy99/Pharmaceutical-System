const fs = require('fs');

let content = fs.readFileSync('js/app.js', 'utf8');
const isCrlf = content.includes('\r\n');
const normalize = s => s.replace(/\r\n/g, '\n');

let norm = normalize(content);

const t1 = `  const banner = document.createElement("div");
  banner.id = "pharmaImpersonationBanner";
  banner.className = "pharma-impersonation-top-alert";
  banner.style.cssText = "position: sticky; top: 0; left: 0; right: 0; z-index: 999999;";`;

const r1 = `  const banner = document.createElement("div");
  banner.id = "pharmaImpersonationBanner";
  banner.className = "pharma-impersonation-top-alert pharma-impersonation-standalone";`;

const t2 = `      bannerEl.className = "pharma-impersonation-top-alert";
      bannerEl.style.cssText = "";`;

const r2 = `      bannerEl.className = "pharma-impersonation-top-alert";`;

if (!norm.includes(normalize(t1)) || !norm.includes(normalize(t2))) {
  console.error('Target not found');
  process.exit(1);
}

norm = norm.replace(normalize(t1), normalize(r1)).replace(normalize(t2), normalize(r2));
const finalContent = isCrlf ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync('js/app.js', finalContent, 'utf8');
console.log('SUCCESS: Impersonation banner styles cleaned');
