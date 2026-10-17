const fs = require('fs');

let style = fs.readFileSync('css/style.css', 'utf8');
const hasCRLF = style.includes('\r\n');
style = style.replace(/\r\n/g, '\n');

// 1. Add semantic tokens to :root
const rootTarget = `  --surface: #ffffff;
  --surface-alt: var(--gray-50);
  --surface-dim: var(--gray-100);
  --surface-hover: var(--gray-100);
  --border-color: #dee2e6;
  --text-muted: #64748b;`;

const rootReplacement = `  --surface: #ffffff;
  --surface-card: #ffffff;
  --surface-body: #f4f6f9;
  --surface-subtle: #f8fafc;
  --surface-hover: #f1f5f9;
  --surface-alt: var(--gray-50);
  --surface-dim: var(--gray-100);
  --border-color: #dee2e6;
  --border-main: #e2e8f0;
  --border-subtle: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --primary-subtle: #e0e7ff;
  --success-subtle: #dcfce7;
  --warning-subtle: #fef3c7;
  --danger-subtle: #fee2e2;
  --info-subtle: #e0f2fe;`;

if (!style.includes(rootTarget)) {
  console.error('rootTarget not found in style.css');
  process.exit(1);
}
style = style.replace(rootTarget, rootReplacement);

// 2. Add semantic tokens to [data-theme="dark"]
const darkTarget = `  --surface: #1e2229;
  --surface-alt: #232731;
  --surface-dim: #16191f;
  --surface-hover: #282d38;
  --border-color: #2d3340;
  --text-muted: #cbd5e1;`;

const darkReplacement = `  --surface: #1e2229;
  --surface-card: #1e2229;
  --surface-body: #121418;
  --surface-subtle: #232731;
  --surface-hover: #282d38;
  --surface-alt: #232731;
  --surface-dim: #16191f;
  --border-color: #2d3340;
  --border-main: #2d3340;
  --border-subtle: #3d4554;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --primary-subtle: rgba(99, 102, 241, 0.2);
  --success-subtle: rgba(16, 185, 129, 0.2);
  --warning-subtle: rgba(245, 158, 11, 0.2);
  --danger-subtle: rgba(239, 68, 68, 0.2);
  --info-subtle: rgba(14, 165, 233, 0.2);`;

if (!style.includes(darkTarget)) {
  console.error('darkTarget not found in style.css');
  process.exit(1);
}
style = style.replace(darkTarget, darkReplacement);

if (hasCRLF) {
  style = style.replace(/\n/g, '\r\n');
}

fs.writeFileSync('css/style.css', style, 'utf8');
console.log('Successfully updated css/style.css with standard semantic tokens!');
