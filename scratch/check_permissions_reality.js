const fs = require('fs');

function checkPermissions(file, keywords) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`=== ${file} ===`);
  content.split('\n').forEach((l, i) => {
    for (const kw of keywords) {
      if (l.includes(kw)) {
        if (l.includes('role') || l.includes('delete') || l.includes('edit') || l.includes('save') || l.includes('disabled') || l.includes('canEdit')) {
          console.log(`L${i+1}: ${l.trim().slice(0, 95)}`);
        }
      }
    }
  });
}

checkPermissions('js/doctors-report.js', ['deleteDoctor', 'saveDoctor', 'role']);
checkPermissions('js/pharmacies-report.js', ['deletePharmacy', 'savePharmacy', 'role']);
checkPermissions('js/visits.js', ['deleteVisit', 'role']);
