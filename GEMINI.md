# PharmaCare Project Coding Standards & Guidelines

This document outlines the strict project guidelines and coding standards established for all files in this project. All future code additions and modifications must strictly adhere to these rules.

## 1. XSS Protection & HTML Escaping
- Every JavaScript file generating dynamic HTML via template literals must define the escape helper at the top:
  ```javascript
  const esc = window.escapeHtml || ((s) => s || "");
  ```
- Any variable, user attribute, name, title, code, dosage, role, or description interpolated into HTML MUST be escaped using `esc(...)` or `escapeHtml(...)`.

## 2. File Headers & JSDoc
- Every `.js` file must start with a clean JSDoc file header:
  ```javascript
  /**
   * @file <filename>.js
   * @description <Clear description of module responsibilities>.
   */
  ```
- Functions should include JSDoc comments explaining parameters and behavior.

## 3. Formatting & Code Style
- **Indentation**: 2 spaces.
- **Quotes**: Double quotes (`"`) for JavaScript strings (except template literals where needed).
- **Trailing Commas**: Trailing commas in multi-line objects, arrays, and parameter lists.
- **Section Dividers**: Use standardized clean divider comments, e.g.:
  ```javascript
  // ==========================================
  // Section: Module Name
  // ==========================================
  ```

## 4. Zero Arabic Comments Rule
- **STRICT**: Absolutely ZERO Arabic text inside comments (`//`, `/* ... */`, or `<!-- ... -->`).
- All code comments, documentation, commit messages, and logs must be in English.
- Arabic is ONLY permitted inside user-facing translation strings (e.g. `translations.ar = { ... }`).

## 5. Translation & i18n Architecture
- Never redefine or overwrite `window.applyTranslations` in individual page scripts.
- Always merge local translation dictionaries into the global registry:
  ```javascript
  if (typeof window.translations !== "undefined") {
    if (window.translations.en && localTranslations.en) Object.assign(window.translations.en, localTranslations.en);
    if (window.translations.ar && localTranslations.ar) Object.assign(window.translations.ar, localTranslations.ar);
  }
  ```
- Use `window.applyTranslations(lang)` to apply translations globally.

## 6. Topbar & Navigation Layout Uniformity
- All HTML pages must use the unified topbar structure:
  - `.pharma-topbar-top-row` containing Brand, `.pharma-user-desktop-pill`, and Quick Actions.
  - `.pharma-user-mobile-row` containing the mobile user status pill.
  - `.pharma-nav-center` containing `.pharma-navbar-strip` with role-appropriate nav links.
- Avoid any hardcoded legacy `.pharma-topbar-wrapper` markup.

## 7. Single Source of Truth & State Persistence
- All state must reference `window.DEMO_DATA`.
- Whenever a record is added, edited, or deleted (users, lines, products, areas, visits, leaves, etc.), synchronize with `window.DEMO_DATA` and invoke `window.saveDataToStorage()`.

## 8. Dual Workspace Mirroring
- Any file created or modified in `C:\Users\DeLL\OneDrive\Desktop\pharma-rep` must always be mirrored to `C:\Users\DeLL\.gemini\antigravity\scratch\pharma-rep`.