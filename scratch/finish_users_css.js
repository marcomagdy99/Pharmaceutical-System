const fs = require('fs');

let css = fs.readFileSync('css/users.css', 'utf8');

css = css.replace(/color:\s*#ffffff\s*!important;/g, 'color: var(--white, #ffffff) !important;');
css = css.replace(/--bs-secondary-color:\s*#cbd5e1;/g, '--bs-secondary-color: var(--text-secondary, #cbd5e1);');

fs.writeFileSync('css/users.css', css, 'utf8');
console.log('Finished secondary cleanup on css/users.css');
