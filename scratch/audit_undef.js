const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const out = fs.readFileSync(path.join(__dirname, 'eslint_out.txt'), 'utf8').split(/\r?\n/);
const jsDir = path.join(root, 'js');
const files = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
const sources = Object.fromEntries(files.map((f) => [f, fs.readFileSync(path.join(jsDir, f), 'utf8')]));
const htmls = fs.readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => [f, fs.readFileSync(path.join(root, f), 'utf8')]);

const hits = {};
out.forEach((l) => {
  const m = l.match(/js[\\/]([^:]+):(\d+):\d+: '([^']+)' is not defined/);
  if (m) (hits[m[3]] = hits[m[3]] || []).push(`${m[1]}:${m[2]}`);
});

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const report = [];
Object.keys(hits).forEach((name) => {
  const n = esc(name);
  const defRe = new RegExp(
    `(function\\s+${n}\\b|\\b(?:const|let|var)\\s+${n}\\b|window\\.${n}\\s*=|globalThis\\.${n}\\s*=|\\b${n}\\s*[:=]\\s*(?:async\\s*)?(?:function|\\()|class\\s+${n}\\b)`
  );
  const definedIn = files.filter((f) => defRe.test(sources[f]));
  const inHtml = htmls.filter(([, s]) => new RegExp(`function\\s+${n}\\b|window\\.${n}\\s*=|\\b(?:const|let|var)\\s+${n}\\b`).test(s)).map(([f]) => f);
  report.push({ name, uses: hits[name].length, definedIn: [...definedIn, ...inHtml.map((h) => 'HTML:' + h)], sample: hits[name].slice(0, 3) });
});

const never = report.filter((r) => r.definedIn.length === 0);
console.log('=== NAMES NOT DEFINED ANYWHERE (likely real bugs) ===');
never.forEach((r) => console.log(r.name, '| uses:', r.uses, '| e.g.', r.sample.join(', ')));
console.log('\n=== DEFINED ONLY IN A FILE THAT MAY NOT BE LOADED ON THE PAGE ===');
// For each use-site file, which pages load it, and does any loaded script define the name?
const pageScripts = {};
htmls.forEach(([h, s]) => {
  pageScripts[h] = [...s.matchAll(/<script[^>]+src=["']js\/([^"'?]+)/g)].map((x) => x[1]);
});
const problems = [];
report.filter((r) => r.definedIn.length > 0).forEach((r) => {
  const n = esc(r.name);
  const defRe = new RegExp(`(function\\s+${n}\\b|\\b(?:const|let|var)\\s+${n}\\b|window\\.${n}\\s*=|\\b${n}\\s*[:=]\\s*(?:async\\s*)?(?:function|\\()|class\\s+${n}\\b)`);
  const useFiles = [...new Set(r.sample.concat(hits[r.name]).map((x) => x.split(':')[0]))];
  useFiles.forEach((uf) => {
    const pages = Object.keys(pageScripts).filter((p) => pageScripts[p].includes(uf));
    pages.forEach((p) => {
      const loaded = pageScripts[p];
      const defined = loaded.some((f) => sources[f] && defRe.test(sources[f])) ||
        new RegExp(`function\\s+${n}\\b|window\\.${n}\\s*=|\\b(?:const|let|var)\\s+${n}\\b`).test(htmls.find(([h]) => h === p)[1]);
      if (!defined) problems.push(`${r.name}  used in js/${uf}  but page ${p} loads no script defining it (defined in: ${r.definedIn.join(', ')})`);
    });
  });
});
[...new Set(problems)].forEach((p) => console.log(p));
if (!problems.length) console.log('none');
