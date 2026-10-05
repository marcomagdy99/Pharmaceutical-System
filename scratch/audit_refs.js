const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(p, 'utf8');
const htmls = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
const refs = new Set();
const broken = [];

htmls.forEach((h) => {
  const src = read(path.join(root, h));
  const re = /(?:src|href)\s*=\s*["']([^"'#]+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    let u = m[1].split('?')[0];
    if (/^(https?:|\/\/|data:|mailto:|javascript:)/.test(u)) continue;
    if (!/\.(js|css|png|json|xlsx|jpg|svg|ico)$/i.test(u)) continue;
    refs.add(path.normalize(u));
    if (!fs.existsSync(path.join(root, u))) broken.push(`${h} -> ${u}`);
  }
});

// sw.js asset list
const sw = read(path.join(root, 'sw.js'));
const swRe = /'\.\/([^']+)'/g;
let m;
const swMissing = [];
while ((m = swRe.exec(sw))) {
  if (!fs.existsSync(path.join(root, m[1]))) swMissing.push(m[1]);
  refs.add(path.normalize(m[1]));
}

// JS files not referenced by any HTML
const allJs = fs.readdirSync(path.join(root, 'js')).map((f) => path.join('js', f));
const allCss = fs.readdirSync(path.join(root, 'css')).map((f) => path.join('css', f));
const htmlRefsOnly = new Set();
htmls.forEach((h) => {
  const src = read(path.join(root, h));
  const re = /(?:src|href)\s*=\s*["']([^"'#]+)["']/g;
  let mm;
  while ((mm = re.exec(src))) htmlRefsOnly.add(path.normalize(mm[1].split('?')[0]));
});
console.log('BROKEN HTML REFS:', broken.length ? broken : 'none');
console.log('SW.JS MISSING ASSETS:', swMissing.length ? swMissing : 'none');
console.log('JS NOT LOADED BY ANY HTML:', allJs.filter((f) => !htmlRefsOnly.has(f)));
console.log('CSS NOT LOADED BY ANY HTML:', allCss.filter((f) => !htmlRefsOnly.has(f)));
console.log('JS/CSS IN HTML BUT NOT IN SW CACHE LIST:');
const swSet = new Set([...sw.matchAll(/'\.\/([^']+)'/g)].map((x) => path.normalize(x[1])));
console.log([...htmlRefsOnly].filter((f) => /^(js|css)/.test(f) && !swSet.has(f)));

// Per-page script usage
htmls.forEach((h) => {
  const src = read(path.join(root, h));
  const scripts = [...src.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((x) => x[1].split('?')[0]);
  const dup = scripts.filter((s, i) => scripts.indexOf(s) !== i);
  if (dup.length) console.log('DUPLICATE SCRIPT TAGS in', h, dup);
});
