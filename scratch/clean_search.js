const fs = require('fs');
let html = fs.readFileSync('reports.html', 'utf8');
html = html.replace('oninput="if (typeof onHospitalFilterChange === \'function\') onHospitalFilterChange();"', '');
html = html.replace('oninput="if (typeof onPharmacyFilterChange === \'function\') onPharmacyFilterChange();"', '');
fs.writeFileSync('reports.html', html, 'utf8');
console.log('Cleaned remaining search inputs in reports.html.');
