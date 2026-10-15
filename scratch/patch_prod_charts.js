const fs = require('fs');

// products.js
let p = fs.readFileSync('js/products.js', 'utf8');
p = p.replace(/\(window\.getCurrentLang && window\.getCurrentLang\(\) === "ar"\)\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Access Denied:[^"]*")/g, '$1');
fs.writeFileSync('js/products.js', p, 'utf8');

// interactive-charts.js
let c = fs.readFileSync('js/interactive-charts.js', 'utf8');
c = c.replace(/const labels = lang === 'ar'\s*\?\s*\['[^']*', '[^']*', '[^']*'\]\s*:\s*(\['Class A', 'Class B', 'Hospitals'\]);/g, 'const labels = $1;');
c = c.replace(/const labels = lang === 'ar'\s*\?\s*\['[^']*', '[^']*'\]\s*:\s*(\['Covered', 'Remaining'\]);/g, 'const labels = $1;');
fs.writeFileSync('js/interactive-charts.js', c, 'utf8');

console.log('products.js remaining ar:', /[\u0600-\u06FF]/.test(fs.readFileSync('js/products.js', 'utf8')));
console.log('interactive-charts.js remaining ar:', /[\u0600-\u06FF]/.test(fs.readFileSync('js/interactive-charts.js', 'utf8')));
