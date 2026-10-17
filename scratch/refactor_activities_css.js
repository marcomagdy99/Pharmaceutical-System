const fs = require('fs');

let css = fs.readFileSync('css/activities.css', 'utf8');

const initialHexMatches = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
console.log('Initial hex matches in activities.css:', initialHexMatches);

// 1. Root & Dark theme header
css = css.replace(
  `:root {
    --text-color: var(--gray-800, #1e293b);
    --text-muted: var(--gray-500, #64748b);
}`,
  `:root {
    --text-color: var(--text-primary, #1e293b);
    --text-muted: var(--text-muted, #64748b);
    --border-color: var(--border-main, #e2e8f0);
}`
);
css = css.replace(
  `:root {\r\n    --text-color: var(--gray-800, #1e293b);\r\n    --text-muted: var(--gray-500, #64748b);\r\n}`,
  `:root {\r\n    --text-color: var(--text-primary, #1e293b);\r\n    --text-muted: var(--text-muted, #64748b);\r\n    --border-color: var(--border-main, #e2e8f0);\r\n}`
);

css = css.replace(
  `[data-theme="dark"] {
    --text-color: #f1f3f5;
    --text-muted: #94a3b8;
    --border-color: #2d3340;
}`,
  `[data-theme="dark"] {
    --text-color: var(--text-primary, #f1f3f5);
    --text-muted: var(--text-muted, #94a3b8);
    --border-color: var(--border-main, #2d3340);
}`
);
css = css.replace(
  `[data-theme="dark"] {\r\n    --text-color: #f1f3f5;\r\n    --text-muted: #94a3b8;\r\n    --border-color: #2d3340;\r\n}`,
  `[data-theme="dark"] {\r\n    --text-color: var(--text-primary, #f1f3f5);\r\n    --text-muted: var(--text-muted, #94a3b8);\r\n    --border-color: var(--border-main, #2d3340);\r\n}`
);

// 2. Exact token replacements
const exactRules = [
  // Surfaces
  { from: /var\(--surface,\s*#ffffff\)/g, to: 'var(--surface-card, #ffffff)' },
  { from: /var\(--surface-dim,\s*#f8fafc\)/g, to: 'var(--surface-subtle, #f8fafc)' },
  { from: /var\(--surface-dim,\s*#f1f5f9\)/g, to: 'var(--surface-hover, #f1f5f9)' },
  { from: /var\(--gray-50,\s*#f8fafc\)/g, to: 'var(--surface-subtle, #f8fafc)' },
  { from: /var\(--gray-100,\s*#f1f5f9\)/g, to: 'var(--surface-hover, #f1f5f9)' },

  // Borders
  { from: /var\(--border-color,\s*#e2e8f0\)/g, to: 'var(--border-main, #e2e8f0)' },
  { from: /var\(--border-color,\s*#cbd5e1\)/g, to: 'var(--border-color, #cbd5e1)' },
  { from: /var\(--gray-300,\s*#cbd5e1\)/g, to: 'var(--border-color, #cbd5e1)' },

  // Typography
  { from: /var\(--gray-800,\s*#1e293b\)/g, to: 'var(--text-primary, #1e293b)' },
  { from: /var\(--text-color,\s*#1e293b\)/g, to: 'var(--text-primary, #1e293b)' },
  { from: /var\(--gray-500,\s*#64748b\)/g, to: 'var(--text-muted, #64748b)' },
  { from: /var\(--gray-600,\s*#64748b\)/g, to: 'var(--text-muted, #64748b)' },
  { from: /var\(--text-muted,\s*#64748b\)/g, to: 'var(--text-muted, #64748b)' },
  { from: /var\(--gray-700,\s*#334155\)/g, to: 'var(--text-secondary, #334155)' },
  { from: /var\(--text-color,\s*#334155\)/g, to: 'var(--text-secondary, #334155)' },
  { from: /var\(--gray-600,\s*#475569\)/g, to: 'var(--text-secondary, #475569)' },
  { from: /var\(--text-muted,\s*#475569\)/g, to: 'var(--text-secondary, #475569)' },

  // Colors
  { from: /var\(--primary,\s*#2563eb\)/g, to: 'var(--primary, #2563eb)' },
  { from: /var\(--success,\s*#10b981\)/g, to: 'var(--success, #10b981)' },
  { from: /var\(--danger,\s*#ef4444\)/g, to: 'var(--danger, #ef4444)' }
];

exactRules.forEach(r => {
  css = css.replace(r.from, r.to);
});

// 3. Dark Theme Blocks replacements
// Lines matching data-theme="dark" with hardcoded colors
const lines = css.split(/\r?\n/);
const isCRLF = css.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

let inDarkMode = false;
let braceDepth = 0;

const processedLines = lines.map(line => {
  if (line.includes('[data-theme="dark"]')) {
    inDarkMode = true;
  }
  
  if (inDarkMode) {
    if (line.includes('{')) braceDepth++;
    if (line.includes('}')) {
      braceDepth--;
      if (braceDepth <= 0) {
        inDarkMode = false;
        braceDepth = 0;
      }
    }

    // Replace dark mode colors with CSS variables
    let l = line;
    // backgrounds
    l = l.replace(/background:\s*#1e2229;/g, 'background: var(--surface-card, #1e2229);');
    l = l.replace(/background-color:\s*#1e2229;/g, 'background-color: var(--surface-card, #1e2229);');
    l = l.replace(/background:\s*#232731;/g, 'background: var(--surface-subtle, #232731);');
    l = l.replace(/background-color:\s*#232731;/g, 'background-color: var(--surface-subtle, #232731);');
    l = l.replace(/background:\s*#282d38;/g, 'background: var(--surface-hover, #282d38);');
    l = l.replace(/background-color:\s*#282d38;/g, 'background-color: var(--surface-hover, #282d38);');
    l = l.replace(/background:\s*#121418;/g, 'background: var(--surface-body, #121418);');
    l = l.replace(/background-color:\s*#121418;/g, 'background-color: var(--surface-body, #121418);');

    // borders
    l = l.replace(/border-color:\s*#2d3340;/g, 'border-color: var(--border-main, #2d3340);');
    l = l.replace(/border-bottom-color:\s*#2d3340;/g, 'border-bottom-color: var(--border-main, #2d3340);');
    l = l.replace(/border-top-color:\s*#2d3340;/g, 'border-top-color: var(--border-main, #2d3340);');
    l = l.replace(/border-left-color:\s*#2d3340;/g, 'border-left-color: var(--border-main, #2d3340);');
    l = l.replace(/border-right-color:\s*#2d3340;/g, 'border-right-color: var(--border-main, #2d3340);');
    l = l.replace(/border-color:\s*#3d4554;/g, 'border-color: var(--border-subtle, #3d4554);');
    l = l.replace(/border-bottom-color:\s*#3d4554;/g, 'border-bottom-color: var(--border-subtle, #3d4554);');
    l = l.replace(/border-top-color:\s*#3d4554;/g, 'border-top-color: var(--border-subtle, #3d4554);');

    // texts
    l = l.replace(/color:\s*#f1f3f5;/g, 'color: var(--text-primary, #f1f3f5);');
    l = l.replace(/color:\s*#f8fafc;/g, 'color: var(--text-primary, #f8fafc);');
    l = l.replace(/color:\s*#94a3b8;/g, 'color: var(--text-muted, #94a3b8);');
    l = l.replace(/color:\s*#cbd5e1;/g, 'color: var(--text-secondary, #cbd5e1);');
    l = l.replace(/color:\s*#ffffff;/g, 'color: var(--white, #ffffff);');

    return l;
  }

  // Non-dark mode lines: general white text on buttons / badges
  let l = line;
  l = l.replace(/color:\s*#ffffff;/g, 'color: var(--white, #ffffff);');
  return l;
});

const newCss = processedLines.join(nl);
fs.writeFileSync('css/activities.css', newCss, 'utf8');
console.log('Successfully refactored css/activities.css');
