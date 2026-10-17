const fs = require('fs');

// 1. doctors-report.js
{
  let d = fs.readFileSync('js/doctors-report.js', 'utf8');
  
  // Neutralize onDoctorFilterChange
  const oldFunc = d.match(/function onDoctorFilterChange\(\)\s*\{[\s\S]*?\n\}/);
  if (oldFunc) {
    d = d.replace(oldFunc[0], 'function onDoctorFilterChange() {}');
    console.log('onDoctorFilterChange neutralized in doctors-report.js');
  }

  // Fix rep filter in getScopedDoctors
  const oldRepCheck = `docs = docs.filter((d) =>
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim())) ||
            (!d.areaId && d.repId === repId)
          );`;

  const newRepCheck = `docs = docs.filter((d) =>
            d.repId === repId ||
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
          );`;

  if (d.includes(oldRepCheck)) {
    d = d.replace(oldRepCheck, newRepCheck);
    console.log('Rep check fixed in doctors-report.js');
  } else {
    console.warn('Could not find oldRepCheck in doctors-report.js');
  }

  fs.writeFileSync('js/doctors-report.js', d, 'utf8');
}

// 2. pharmacies-report.js
{
  let p = fs.readFileSync('js/pharmacies-report.js', 'utf8');

  // Neutralize onPharmacyFilterChange
  const oldFunc = p.match(/function onPharmacyFilterChange\(\)\s*\{[\s\S]*?\n\}/);
  if (oldFunc) {
    p = p.replace(oldFunc[0], 'function onPharmacyFilterChange() {}');
    console.log('onPharmacyFilterChange neutralized in pharmacies-report.js');
  }

  // Fix rep filter in getScopedPharmacies
  const oldRepCheck = `pharms = pharms.filter((p) =>
            (p.areaId && repAreaIds.includes(p.areaId)) ||
            (!p.areaId && p.area && repAreaNames.includes(p.area.toLowerCase().trim())) ||
            (!p.areaId && p.repId === repId)
          );`;

  const newRepCheck = `pharms = pharms.filter((p) =>
            p.repId === repId ||
            (p.areaId && repAreaIds.includes(p.areaId)) ||
            (p.area && repAreaNames.includes(p.area.toLowerCase().trim()))
          );`;

  if (p.includes(oldRepCheck)) {
    p = p.replace(oldRepCheck, newRepCheck);
    console.log('Rep check fixed in pharmacies-report.js');
  } else {
    console.warn('Could not find oldRepCheck in pharmacies-report.js');
  }

  fs.writeFileSync('js/pharmacies-report.js', p, 'utf8');
}

console.log('Completed doctors and pharmacies patch.');
