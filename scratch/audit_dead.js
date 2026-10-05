const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const jsDir = path.join(root, 'js');
const skip = new Set(['chart.umd.min.js', 'egypt-bricks-data.js', 'excel-templates-data.js']);
const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js') && !skip.has(f));
const src = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(jsDir, f), 'utf8')]));
const htmlSrc = fs.readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const all = Object.values(src).join('\n') + '\n' + htmlSrc;

console.log('=== console.log / debugger / TODO / FIXME / alert( counts per file ===');
files.forEach((f) => {
  const s = src[f];
  const c = (re) => (s.match(re) || []).length;
  const r = { 'console.log': c(/console\.log\(/g), debugger: c(/\bdebugger\b/g), 'TODO/FIXME/HACK': c(/\b(TODO|FIXME|HACK|XXX)\b/g), 'alert(': c(/(?<![\w.])alert\(/g) };
  if (Object.values(r).some((v) => v)) console.log(f.padEnd(34), JSON.stringify(r));
});

console.log('\n=== Top-level named functions never referenced anywhere else (dead candidates) ===');
const dead = [];
files.forEach((f) => {
  const s = src[f];
  const re = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  let m;
  while ((m = re.exec(s))) {
    const name = m[1];
    const occ = (all.match(new RegExp('(?<![\\w$])' + name.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')) || []).length;
    if (occ <= 1) dead.push(`${f}: ${name}`);
  }
  const re2 = /^window\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function/gm;
  while ((m = re2.exec(s))) {
    const name = m[1];
    const occ = (all.match(new RegExp('(?<![\\w$])' + name.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')) || []).length;
    if (occ <= 1) dead.push(`${f}: window.${name}`);
  }
});
console.log(dead.length ? dead.join('\n') : 'none');

console.log('\n=== Same function name declared in more than one JS file ===');
const decl = {};
files.forEach((f) => {
  const re = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  let m;
  while ((m = re.exec(src[f]))) (decl[m[1]] = decl[m[1]] || new Set()).add(f);
});
Object.entries(decl).filter(([, v]) => v.size > 1).forEach(([k, v]) => console.log(k, '->', [...v].join(', ')));

console.log('\n=== Large commented-out code blocks (>=5 consecutive // lines containing code-like chars) ===');
files.forEach((f) => {
  const lines = src[f].split(/\r?\n/);
  let run = 0, start = 0;
  lines.forEach((l, i) => {
    const t = l.trim();
    const codey = /^\/\/.*[;{}()=]/.test(t) && !/^\/\/\s*(=|-|Section|\*)/.test(t);
    if (codey) { if (!run) start = i + 1; run++; }
    else { if (run >= 5) console.log(`${f}:${start}-${start + run - 1} (${run} lines)`); run = 0; }
  });
});
