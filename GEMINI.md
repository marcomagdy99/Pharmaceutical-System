# PharmaCare Project Coding Standards & Guidelines

This document outlines the strict project guidelines and coding standards established for all files in this project. All future code additions and modifications must strictly adhere to these rules.

## 1. XSS Protection & HTML Escaping
- Escaping is centrally defined once in `js/app.js` on `window.escapeHtml`.
- **NO local aliases**: Do NOT define local aliases (such as `const esc = ...` or `const escPharm = ...`) in individual script files.
- **NO silent fallbacks**: Do NOT use fallbacks like `|| ((s) => s || "")` which fail open.
- Any variable, user attribute, name, title, code, dosage, role, or description interpolated into HTML MUST be escaped by calling `window.escapeHtml(...)` directly.

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

## 4. UI Language Standard & Zero Arabic Comments
- **STRICT**: Absolutely ZERO Arabic text inside comments (`//`, `/* ... */`, or `<!-- ... -->`).
- All code comments, documentation, commit messages, and logs must be in English.
- The platform user interface (UI elements, menus, navigation bars, buttons, table headers, system alerts) is 100% Pure English.

## 5. Data & Input Flexibility Standard (Bilingual Input Support)
- User-entered data, field notes, client names, and distributor imports natively support both Arabic and English text.
- Single Unified Form Fields: Forms must never force separate English and Arabic duplicate fields (e.g. no separate `nameEn` and `nameAr` in user forms). Always provide a single, unified input field that accepts English or Arabic text freely.
- Egyptian Market Domain Data: Preserve Egyptian IMS bricks (`egypt-bricks-data.js`) and distributor Excel column header matching keywords.
- Search & Collation: Searching and alphabetical sorting must natively support both Latin and Arabic scripts using `localeCompare(['en', 'ar'], { numeric: true, sensitivity: 'base' })`.

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