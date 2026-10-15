const fs = require('fs');

let app = fs.readFileSync('js/app.js', 'utf8');

// Replace line_1790626036368 with line_1790626000002
app = app.replace(/"line_1790626036368"/g, '"line_1790626000002"');

// Also update legacyLineMap in auto-migrate
app = app.replace(
  'line2: "line_1790626000002", line3: "line_1790626000003"',
  'line2: "line_1790626000002", line3: "line_1790626000003", line_1790626036368: "line_1790626000002"'
);

fs.writeFileSync('js/app.js', app, 'utf8');
console.log('Successfully aligned Neuro line ID in js/app.js');
