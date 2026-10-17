// Unit test for product dosage consolidation and dark mode classes
const fs = require('fs');
const path = require('path');

console.log("Checking products.html...");
const html = fs.readFileSync(path.join(__dirname, '../products.html'), 'utf8');
if (html.includes('id="productDosage"')) {
  throw new Error("FAIL: productDosage input still present in products.html!");
}
if (!html.includes('placeholder="Enter product name (e.g. Augmentin 1g, Lipitor 20mg)"')) {
  throw new Error("FAIL: placeholder not updated in products.html!");
}
console.log("products.html OK.");

console.log("Checking css/products.css...");
const css = fs.readFileSync(path.join(__dirname, '../css/products.css'), 'utf8');
if (!css.includes('.product-name-cell') || !css.includes('[data-theme="dark"] .product-name-cell')) {
  throw new Error("FAIL: .product-name-cell dark mode styles missing!");
}
if (!css.includes('[data-theme="dark"] .product-mobile-name')) {
  throw new Error("FAIL: .product-mobile-name dark mode styles missing!");
}
console.log("css/products.css OK.");

console.log("Checking js/products.js...");
const jsProducts = fs.readFileSync(path.join(__dirname, '../js/products.js'), 'utf8');
if (jsProducts.includes('<th data-i18n="dosage">Dosage</th>')) {
  throw new Error("FAIL: dosage header still in products table!");
}
if (jsProducts.includes('product-name-cell') === false) {
  throw new Error("FAIL: product-name-cell not applied in products.js!");
}
if (jsProducts.includes('Please enter Dosage.')) {
  throw new Error("FAIL: dosage required check still present in products.js!");
}
console.log("js/products.js OK.");

console.log("Checking js/app.js auto-migration...");
const jsApp = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
if (!jsApp.includes('p.dosage && p.name && !p.name.toLowerCase().includes(p.dosage.toLowerCase())')) {
  throw new Error("FAIL: auto-migration rule missing in app.js!");
}
console.log("js/app.js OK.");

console.log("ALL PRODUCT DOSAGE & DARK MODE TESTS PASSED!");
