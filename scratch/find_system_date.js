const fs = require('fs');

function search(file) {
  const content = fs.readFileSync(file, 'utf8');
  content.split('\n').forEach((l, i) => {
    if (l.includes('getSystemDate')) {
      console.log(`${file}:${i+1}: ${l.trim().slice(0, 95)}`);
    }
  });
}

search('js/app.js');
search('js/visits.js');
search('js/calendar.js');
