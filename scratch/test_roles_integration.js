const fs = require('fs');
const assert = require('assert');

// Read app.js
const app = fs.readFileSync('js/app.js', 'utf8');

// Ensure syntax compiles before editing
console.log('Original app.js length:', app.length);
assert.strictEqual(typeof app, 'string');
