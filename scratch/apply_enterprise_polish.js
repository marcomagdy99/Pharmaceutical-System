const fs = require('fs');

let css = fs.readFileSync('css/style.css', 'utf8');

const newBlock = `
/* --- Branded Text Selection ---
   Provides clean, high-contrast text selection using the system primary token
   instead of browser default harsh blue across both light and dark themes. */
::selection {
  background-color: var(--primary-subtle);
  color: var(--primary);
}

/* --- Mobile Instant Tap Response ---
   Eliminates the 300ms click delay on mobile touch devices (touch-action manipulation)
   making all interactive buttons, pills, and links respond instantaneously. */
button,
.btn,
a,
input,
select,
textarea,
.badge-more-areas,
.line-filter-pill,
.role-badge,
.nav-link {
  touch-action: manipulation;
}

/* --- iOS Auto-Zoom Prevention on Form Controls ---
   Prevents unwanted viewport zoom on iOS/Safari devices when field reps focus on
   form inputs by ensuring the mobile input font-size meets the 16px requirement. */
@media (max-width: 768px) {
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]),
  select,
  textarea {
    font-size: 16px !important;
  }
}

/* --- Accessible Reduced Motion Support ---
   Respects user operating system settings for reduced motion to prevent dizziness,
   improve accessibility (WCAG), and conserve device battery on mobile in the field. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

const norm = s => s.replace(/\r\n/g, '\n');
const toCRLF = s => s.replace(/\n/g, '\r\n');
const isCRLF = css.includes('\r\n');

let normCss = norm(css);

if (!normCss.includes('Branded Text Selection')) {
  normCss = normCss.replace(
    '/* --- END: Reset & Base Styles --- */',
    newBlock.trim() + '\n/* --- END: Reset & Base Styles --- */'
  );

  const finalCss = isCRLF ? toCRLF(normCss) : normCss;
  fs.writeFileSync('css/style.css', finalCss, 'utf8');
  console.log('Successfully inserted enterprise polish features into css/style.css');
} else {
  console.log('Features already present in css/style.css');
}
