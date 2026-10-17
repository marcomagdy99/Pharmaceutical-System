const fs = require('fs');

// 1. Update style.css
let styleCss = fs.readFileSync('css/style.css', 'utf8');
styleCss = styleCss.replace(
  'z-index: 999999;',
  'z-index: var(--z-max);'
);
fs.writeFileSync('css/style.css', styleCss, 'utf8');

// 2. Update users.css
let usersCss = fs.readFileSync('css/users.css', 'utf8');

usersCss = usersCss.replace(
  '.modal {\n  z-index: 2500;\n}\n\n.modal-backdrop {\n  z-index: 2490;\n}',
  '.modal {\n  z-index: var(--z-modal);\n}\n\n.modal-backdrop {\n  z-index: var(--z-backdrop);\n}'
);
usersCss = usersCss.replace(
  '.modal {\r\n  z-index: 2500;\r\n}\r\n\r\n.modal-backdrop {\r\n  z-index: 2490;\r\n}',
  '.modal {\r\n  z-index: var(--z-modal);\r\n}\r\n\r\n.modal-backdrop {\r\n  z-index: var(--z-backdrop);\r\n}'
);

usersCss = usersCss.replace(
  'box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);',
  'box-shadow: var(--shadow-modal);'
);

usersCss = usersCss.replace(
  'border-radius: 999px;',
  'border-radius: var(--radius-pill);'
);

usersCss = usersCss.replace(
  'border-radius: 10px;',
  'border-radius: var(--radius-md);'
);

usersCss = usersCss.replace(
  'border-radius: 8px;',
  'border-radius: var(--radius-sm);'
);

usersCss = usersCss.replace(
  'border-radius: 6px !important;',
  'border-radius: var(--radius-xs) !important;'
);

fs.writeFileSync('css/users.css', usersCss, 'utf8');

console.log('Connected design tokens in style.css and users.css');
