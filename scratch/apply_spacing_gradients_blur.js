const fs = require('fs');

let css = fs.readFileSync('css/style.css', 'utf8');

const rootAdditions = `  /* --- Spacing Scale --- */
  --space-2xs: 4px;
  --space-xs: 6px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;

  /* --- Linear Gradients (Brand & Status) --- */
  --gradient-primary: linear-gradient(135deg, var(--primary), var(--primary-dark));
  --gradient-success: linear-gradient(135deg, #10b981, #059669);
  --gradient-progress: linear-gradient(90deg, #3b82f6, #10b981);
  --gradient-card: linear-gradient(180deg, var(--surface-card), var(--surface-subtle));

  /* --- Glassmorphism & Backdrop Blur --- */
  --blur-xs: blur(2px);
  --blur-sm: blur(4px);
  --blur-md: blur(8px);
  --blur-lg: blur(12px);

  /* --- Custom Scrollbar Engine --- */
  --scrollbar-size: 6px;
  --scrollbar-track: transparent;
  --scrollbar-thumb: var(--border-color);
  --scrollbar-thumb-hover: var(--text-muted);
`;

const darkAdditions = `  /* --- Linear Gradients (Dark Theme) --- */
  --gradient-card: linear-gradient(180deg, #232731, #1e2229);
  --gradient-card-dark: linear-gradient(180deg, #232731, #1e2229);

  /* --- Custom Scrollbar Engine (Dark Theme) --- */
  --scrollbar-track: rgba(255, 255, 255, 0.03);
  --scrollbar-thumb: #3d4554;
  --scrollbar-thumb-hover: #64748b;
`;

const norm = s => s.replace(/\r\n/g, '\n');
const toCRLF = s => s.replace(/\n/g, '\r\n');
const isCRLF = css.includes('\r\n');

let normCss = norm(css);

// Insert into :root before --font-xs
if (normCss.includes('  /* --- Typography Scale & Base --- */')) {
  normCss = normCss.replace(
    '  /* --- Typography Scale & Base --- */',
    rootAdditions + '\n  /* --- Typography Scale & Base --- */'
  );
  console.log('Inserted spacing, gradients, blur into :root');
}

// Insert into [data-theme="dark"] before closing brace of dark theme block
if (normCss.includes('  --shadow-focus: 0 0 0 0.25rem rgba(56, 139, 253, 0.3);\n}')) {
  normCss = normCss.replace(
    '  --shadow-focus: 0 0 0 0.25rem rgba(56, 139, 253, 0.3);\n}',
    '  --shadow-focus: 0 0 0 0.25rem rgba(56, 139, 253, 0.3);\n\n' + darkAdditions + '}'
  );
  console.log('Inserted dark gradients and scrollbars into [data-theme="dark"]');
}

// Also connect specific usages in style.css
normCss = normCss.replace(
  'background: linear-gradient(135deg, #0d6efd, #0a58ca);',
  'background: var(--gradient-primary);'
);
normCss = normCss.replace(
  'background: linear-gradient(90deg, #3b82f6, #10b981);',
  'background: var(--gradient-progress);'
);
normCss = normCss.replace(
  'backdrop-filter: blur(4px);',
  'backdrop-filter: var(--blur-sm);'
);

const finalCss = isCRLF ? toCRLF(normCss) : normCss;
fs.writeFileSync('css/style.css', finalCss, 'utf8');
console.log('Successfully updated css/style.css with spacing, gradients, blur, and scrollbars tokens');
