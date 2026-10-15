const fs = require('fs');

const app = fs.readFileSync('js/app.js', 'utf8');
const dataStr = app.substring(app.indexOf('DEFAULT_DEMO_DATA ='), app.indexOf('loadDataFromStorage'));
const jsonStr = dataStr.substring(dataStr.indexOf('{'), dataStr.lastIndexOf('};') + 1);
const data = eval('(' + jsonStr + ')');

console.log('================ AUDITING ALL ENTITIES FOR OLD IDS ================');

Object.keys(data).forEach(key => {
  if (Array.isArray(data[key])) {
    const items = data[key];
    const oldStyle = [];
    const timestampStyle = [];
    items.forEach(item => {
      const id = item.id;
      if (!id) return;
      // Check if it's timestamp style (contains 179... or length > 12)
      if (id.match(/\d{10,}/)) {
        timestampStyle.push(id);
      } else {
        oldStyle.push({ id, name: item.name || item.title || item.code || item.productName || item.specialty || '' });
      }
    });

    console.log(`\nEntity: [${key}] (Total: ${items.length})`);
    console.log(`  - Timestamp Style: ${timestampStyle.length}`);
    console.log(`  - Old Style IDs: ${oldStyle.length}`);
    if (oldStyle.length > 0) {
      console.log('    List of Old IDs:');
      oldStyle.forEach(o => console.log(`      • id: "${o.id}" | ${o.name}`));
    }
  }
});
