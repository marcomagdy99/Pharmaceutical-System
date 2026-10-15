const fs = require('fs');

const storeContent = fs.readFileSync('js/store.js', 'utf8');
const lines = storeContent.split('\n');

console.log('Searching for products initial / demo data in store.js:');
lines.forEach((line, i) => {
  if (line.includes('DEFAULT_') || line.includes('INITIAL_') || line.includes('SAMPLE_') || line.includes('products = [') || line.includes('productLines = [')) {
    console.log(`Line ${i+1}: ${line.trim().slice(0, 80)}`);
  }
});
