const fs = require('fs');

const storeContent = fs.readFileSync('js/store.js', 'utf8');
const lines = storeContent.split('\n');

lines.forEach((line, i) => {
  if (line.includes('window.DEMO_DATA') || line.includes('products: [')) {
    console.log(`Line ${i+1}: ${line.trim().slice(0, 100)}`);
  }
});
