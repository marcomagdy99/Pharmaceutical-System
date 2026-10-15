const fs = require('fs');

function inspectIds(file) {
  const code = fs.readFileSync('js/' + file, 'utf8');
  const lines = code.split('\n');
  lines.forEach((l, i) => {
    if ((l.includes('.id =') || l.includes('id:') || l.includes('id =')) && (l.includes('Date.now()') || l.includes('Math.random()') || l.includes('"u"') || l.includes('"v_"') || l.includes('"doc_"') || l.includes('"p_"') || l.includes('"area_"') || l.includes('ds_'))) {
      console.log(`${file} L${i+1}: ${l.trim()}`);
    }
  });
}

['users.js', 'products.js', 'areas.js', 'visits.js', 'store.js', 'sales-report.js', 'activities-core.js'].forEach(inspectIds);
