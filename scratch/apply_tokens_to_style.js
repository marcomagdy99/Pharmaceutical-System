const fs = require('fs');

let css = fs.readFileSync('css/style.css', 'utf8');

// Target block in :root
const targetRootOld = `  --sidebar-width: 280px; 
  --radius: 14px;
  --radius-sm: 10px;
  --radius-xs: 6px;
  
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
  
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --font-main: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --bg-color: #f4f6f9;`;

const targetRootNew = `  --sidebar-width: 280px; 

  /* --- Border Radius Scale --- */
  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-card: 14px;
  --radius: 14px;
  --radius-pill: 9999px;
  --radius-full: 50%;
  
  /* --- Transitions System --- */
  --transition-fast: all 0.15s ease;
  --transition-base: all 0.2s ease;
  --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* --- Elevation & Shadows (Light Theme) --- */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-hover: 0 4px 14px rgba(0, 0, 0, 0.1);
  --shadow-modal: 0 20px 45px rgba(0, 0, 0, 0.18);
  --shadow-focus: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);

  /* --- Z-Index Layering Hierarchy --- */
  --z-sticky: 100;
  --z-topbar: 1050;
  --z-backdrop: 2490;
  --z-modal: 2500;
  --z-banner: 99999;
  --z-max: 999999;

  /* --- Typography Scale & Base --- */
  --font-xs: 0.72rem;
  --font-sm: 0.75rem;
  --font-md: 0.82rem;
  --font-base: 0.875rem;
  --font-main: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --bg-color: #f4f6f9;`;

// Target block in [data-theme="dark"]
const targetDarkOld = `  --purple-subtle: rgba(168, 85, 247, 0.2);
  --purple-text: #d8b4fe;
  --purple-border: rgba(168, 85, 247, 0.4);
}`;

const targetDarkNew = `  --purple-subtle: rgba(168, 85, 247, 0.2);
  --purple-text: #d8b4fe;
  --purple-border: rgba(168, 85, 247, 0.4);

  /* --- Elevation & Shadows (Dark Theme) --- */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.6);
  --shadow-card: 0 4px 14px rgba(0, 0, 0, 0.35);
  --shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-modal: 0 20px 45px rgba(0, 0, 0, 0.75);
  --shadow-focus: 0 0 0 0.25rem rgba(56, 139, 253, 0.3);
}`;

// Normalize CRLF
const norm = s => s.replace(/\r\n/g, '\n');
const toCRLF = s => s.replace(/\n/g, '\r\n');

let isCRLF = css.includes('\r\n');
let normCss = norm(css);

if (normCss.includes(norm(targetRootOld))) {
  normCss = normCss.replace(norm(targetRootOld), norm(targetRootNew));
  console.log('Successfully replaced :root tokens');
} else {
  console.log('Warning: targetRootOld not found in style.css');
}

if (normCss.includes(norm(targetDarkOld))) {
  normCss = normCss.replace(norm(targetDarkOld), norm(targetDarkNew));
  console.log('Successfully replaced dark theme tokens');
} else {
  console.log('Warning: targetDarkOld not found in style.css');
}

const finalCss = isCRLF ? toCRLF(normCss) : normCss;
fs.writeFileSync('css/style.css', finalCss, 'utf8');
console.log('Applied design tokens to css/style.css');
