const fs = require('fs');
const content = fs.readFileSync('js/store.js', 'utf8');

// find all sections in DEMO_DATA
const match = content.match(/const DEMO_DATA\s*=\s*\{([\s\S]*?)\n\s*\};/);
if (match) {
  console.log('Found DEMO_DATA');
  // let's search for id: in store.js
  const idMatches = content.match(/id:\s*['"][a-zA-Z0-9_\-]+['"]/g);
  if (idMatches) {
    const uniqueIds = Array.from(new Set(idMatches.map(m => m.replace(/id:\s*['"]/, '').replace(/['"]/, ''))));
    console.log('Sample unique IDs in store.js:', uniqueIds.slice(0, 30));
    
    // Check if any legacy rep/admin IDs are in store.js
    const legacy = uniqueIds.filter(id => /^(rep[0-9]|admin[0-9]|bu[0-9]|lm[0-9]|dm[0-9]|hr[0-9]|pm[0-9])$/.test(id));
    console.log('Legacy user IDs in store.js:', legacy);
  }
} else {
  console.log('DEMO_DATA not found');
}
