const fs = require('fs');

let css = fs.readFileSync('css/style.css', 'utf8');

const rootAdditions = `  --card-bg: var(--surface-card);
  --text-color: var(--text-primary);
  --role-admin: #dc3545;
  --role-gm: #1e293b;
  --role-bu: #6f42c1;
  --role-pm: #0891b2;
  --role-lm: #0d6efd;
  --role-dm: #198754;
  --role-rep: #64748b;
  --role-hr: #7e22ce;
  --purple-subtle: #f3e8ff;
  --purple-text: #6b21a8;
  --purple-border: #d8b4fe;
`;

const darkAdditions = `  --card-bg: var(--surface-card);
  --text-color: var(--text-primary);
  --purple-subtle: rgba(168, 85, 247, 0.2);
  --purple-text: #d8b4fe;
  --purple-border: rgba(168, 85, 247, 0.4);
`;

if (!css.includes('--role-admin:')) {
  css = css.replace(
    '  --info-subtle: #e0f2fe;\n',
    '  --info-subtle: #e0f2fe;\n' + rootAdditions
  );
  if (!css.includes('--role-admin:')) {
    // If CRLF
    css = css.replace(
      '  --info-subtle: #e0f2fe;\r\n',
      '  --info-subtle: #e0f2fe;\r\n' + rootAdditions.replace(/\n/g, '\r\n')
    );
  }
}

if (!css.includes('--purple-border: rgba(168, 85, 247, 0.4);')) {
  css = css.replace(
    '  --bs-secondary-rgb: 203, 213, 225;\n',
    '  --bs-secondary-rgb: 203, 213, 225;\n' + darkAdditions
  );
  if (!css.includes('--purple-border: rgba(168, 85, 247, 0.4);')) {
    css = css.replace(
      '  --bs-secondary-rgb: 203, 213, 225;\r\n',
      '  --bs-secondary-rgb: 203, 213, 225;\r\n' + darkAdditions.replace(/\n/g, '\r\n')
    );
  }
}

fs.writeFileSync('css/style.css', css, 'utf8');
console.log('Successfully patched extra tokens in css/style.css');
