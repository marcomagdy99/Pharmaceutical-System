const fs = require('fs');
let html = fs.readFileSync('reports.html', 'utf8');

// Normalize line endings to LF
html = html.replace(/\r\n/g, '\n');

const oldSnippet = '<!-- Pharmacy Sales Table (raw rows) -->\n              <div class="table-container">';
const hint = `<!-- Mobile Horizontal Scroll Hint -->
              <div class="d-md-none px-2 py-1 mb-2 rounded" style="background: rgba(13,110,253,0.08); border: 1px dashed rgba(13,110,253,0.3); font-size: 0.78rem; display: flex; align-items: center; justify-content: space-between; color: var(--primary);">
                <span><i class="fas fa-arrows-alt-h me-1"></i> <span data-i18n="scrollHintTable">مرر أفقياً لعرض جميع بيانات الجدول (8 أعمدة) ↔</span></span>
                <span class="badge bg-primary text-white" style="font-size: 0.7rem;">8 أعمدة</span>
              </div>
              <!-- Pharmacy Sales Table (raw rows) -->
              <div class="table-container">`;

if (html.includes(oldSnippet)) {
  html = html.replace(oldSnippet, hint);
  fs.writeFileSync('reports.html', html, 'utf8');
  console.log('reports.html updated successfully with scroll hint!');
} else {
  console.log('Snippet not found!');
}
