const fs = require('fs');

// 1. Update css/style.css
let styleCss = fs.readFileSync('css/style.css', 'utf8');

const scrollbarAndFocusBlock = `
/* --- Global Custom Scrollbar Engine --- */
::-webkit-scrollbar {
  width: var(--scrollbar-size);
  height: var(--scrollbar-size);
}
::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-pill);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

/* --- Smooth Theme Switch Transition --- */
html.theme-transitioning,
html.theme-transitioning *,
html.theme-transitioning *::before,
html.theme-transitioning *::after {
  transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease !important;
  transition-delay: 0s !important;
}

/* --- Universal Accessible Focus Ring --- */
.form-control:focus,
.form-select:focus,
input[type="text"]:focus,
input[type="password"]:focus,
input[type="email"]:focus,
input[type="number"]:focus,
input[type="date"]:focus,
input[type="search"]:focus,
select:focus,
textarea:focus {
  border-color: var(--primary) !important;
  box-shadow: var(--shadow-focus) !important;
  outline: none;
}
`;

const norm = s => s.replace(/\r\n/g, '\n');
const toCRLF = s => s.replace(/\n/g, '\r\n');
const isCRLFStyle = styleCss.includes('\r\n');

let normStyle = norm(styleCss);

if (!normStyle.includes('Global Custom Scrollbar Engine')) {
  normStyle = normStyle.replace(
    '/* --- END: Reset & Base Styles --- */',
    scrollbarAndFocusBlock.trim() + '\n/* --- END: Reset & Base Styles --- */'
  );
  const finalStyle = isCRLFStyle ? toCRLF(normStyle) : normStyle;
  fs.writeFileSync('css/style.css', finalStyle, 'utf8');
  console.log('Applied scrollbar, smooth transition, and focus ring to css/style.css');
} else {
  console.log('Scrollbar already present in style.css');
}

// 2. Update js/app.js
let appJs = fs.readFileSync('js/app.js', 'utf8');
const isCRLFApp = appJs.includes('\r\n');
let normApp = norm(appJs);

const oldToggle = `window.toggleTheme = function () {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  if (document.body) document.body.setAttribute("data-theme", newTheme);
  try {
    localStorage.setItem("pharmaTheme", newTheme);
  } catch (e) {}
  window.updateThemeUI(newTheme);
  document.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
};`;

const newToggle = `window.toggleTheme = function () {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  // Smooth theme transition class
  document.documentElement.classList.add("theme-transitioning");

  document.documentElement.setAttribute("data-theme", newTheme);
  if (document.body) document.body.setAttribute("data-theme", newTheme);
  try {
    localStorage.setItem("pharmaTheme", newTheme);
  } catch (e) {}
  window.updateThemeUI(newTheme);
  document.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));

  setTimeout(() => {
    document.documentElement.classList.remove("theme-transitioning");
  }, 260);
};`;

if (normApp.includes(norm(oldToggle))) {
  normApp = normApp.replace(norm(oldToggle), norm(newToggle));
  const finalApp = isCRLFApp ? toCRLF(normApp) : normApp;
  fs.writeFileSync('js/app.js', finalApp, 'utf8');
  console.log('Updated toggleTheme in js/app.js with smooth animation');
} else {
  console.log('Warning: oldToggle not matched in app.js');
}
