const fs = require('fs');

console.log('=== Checking PWA, GPS, Audit, and Sync capabilities ===');

console.log('sw.js exists:', fs.existsSync('sw.js'));
console.log('manifest.json exists:', fs.existsSync('manifest.json'));

if (fs.existsSync('sw.js')) {
  const sw = fs.readFileSync('sw.js', 'utf8');
  console.log('sw.js version/cache name:', sw.match(/CACHE_NAME\s*=\s*['"][^'"]+['"]/));
}

if (fs.existsSync('manifest.json')) {
  const m = fs.readFileSync('manifest.json', 'utf8');
  console.log('manifest.json name/icons:', m.slice(0, 150));
}

const visits = fs.readFileSync('js/visits.js', 'utf8');
console.log('visits.js mock/fake GPS:', visits.includes('mock') || visits.includes('fake') || visits.includes('accuracy'));
console.log('visits.js geofence:', visits.includes('distance') || visits.includes('geofence') || visits.includes('radius'));
