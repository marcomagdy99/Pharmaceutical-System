const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\DeLL\\OneDrive\\Desktop\\pharma-rep\\Pharmaceutical-System';

function replaceInFile(file, replacerFn) {
  const full = path.join(root, file);
  const oldContent = fs.readFileSync(full, 'utf8');
  const newContent = replacerFn(oldContent);
  if (oldContent !== newContent) {
    fs.writeFileSync(full, newContent, 'utf8');
    console.log(`[UPDATED] ${file}`);
  } else {
    console.log(`[NO CHANGE] ${file}`);
  }
}

// 1. js/users.js
replaceInFile('js/users.js', c => {
  return c.replace(
    /\(window\.getCurrentLang && window\.getCurrentLang\(\) === "ar"\)\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Access Denied: Admins & HR only\.")/g,
    '$1'
  );
});

// 2. js/missing-days-report.js
replaceInFile('js/missing-days-report.js', c => {
  return c.replace(/,?\s*nameAr:\s*"[^"]*[\u0600-\u06FF][^"]*"/g, '');
});

// 3. js/timeline-report.js
replaceInFile('js/timeline-report.js', c => {
  return c.replace(/\(lang === 'ar' \? 'اليوم' : 'Today'\)/g, "'Today'");
});

// 4. js/interactive-charts.js
replaceInFile('js/interactive-charts.js', c => {
  return c.replace(/isAr\s*\?\s*\['[^']*', '[^']*', '[^']*'\]\s*:\s*(\['Class A', 'Class B', 'Hospitals'\])/g, '$1')
          .replace(/isAr\s*\?\s*\['[^']*', '[^']*'\]\s*:\s*(\['Covered', 'Remaining'\])/g, '$1');
});

// 5. js/products.js
replaceInFile('js/products.js', c => {
  return c.replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Permission Denied:[^"]*")/g, '$1');
});

// 6. js/hospitals-report.js
replaceInFile('js/hospitals-report.js', c => {
  return c.replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Permission Denied:[^"]*")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Please fill in all required hospital fields\.")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Hospital saved successfully\.")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Hospital deleted successfully\.")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Error reading Excel file\.")/g, '$1');
});

// 7. js/pharmacies-report.js
replaceInFile('js/pharmacies-report.js', c => {
  return c.replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Permission Denied:[^"]*")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Please fill in all required pharmacy fields\.")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Pharmacy saved successfully\.")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Pharmacy deleted successfully\.")/g, '$1');
});

// 8. js/doctors-report.js
replaceInFile('js/doctors-report.js', c => {
  return c.replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Permission Denied:[^"]*")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Please fill in all required doctor fields\.")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Doctor saved successfully\.")/g, '$1')
          .replace(/getCurrentLang\(\) === "ar"\s*\?\s*"[^"]*[\u0600-\u06FF][^"]*"\s*:\s*("Doctor deleted successfully\.")/g, '$1');
});
