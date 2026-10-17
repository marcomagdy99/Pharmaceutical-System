const fs = require('fs');

// doctors-report.js
{
  let d = fs.readFileSync('js/doctors-report.js', 'utf8');
  d = d.replace('(!d.areaId && d.repId === repId)', 'd.repId === repId');
  fs.writeFileSync('js/doctors-report.js', d, 'utf8');
  console.log('Fixed rep check in doctors-report.js');
}

// pharmacies-report.js
{
  let p = fs.readFileSync('js/pharmacies-report.js', 'utf8');
  p = p.replace('(!p.areaId && p.repId === repId)', 'p.repId === repId');
  fs.writeFileSync('js/pharmacies-report.js', p, 'utf8');
  console.log('Fixed rep check in pharmacies-report.js');
}
