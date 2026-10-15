const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\DeLL\\OneDrive\\Desktop\\pharma-rep\\Pharmaceutical-System';
const arabicRegex = /[\u0600-\u06FF]/;

const files = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'));

const report = {};

files.forEach(f => {
  if (f === 'egypt-bricks-data.js') return; // Separate note for 1,900 brick names
  const full = path.join(root, 'js', f);
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n');
  const matches = [];
  lines.forEach((l, i) => {
    if (arabicRegex.test(l)) {
      matches.push({
        line: i + 1,
        code: l.trim()
      });
    }
  });
  if (matches.length > 0) {
    report[f] = matches;
  }
});

let md = `# 📋 تقرير حصر شامل لجميع النصوص والترجمات العربية في الكود\n\n`;
md += `يوضح هذا التقرير كل ملف وسطر يحتوي على لغة عربية متبقية في ملفات الجافاسكربت، مع تصنيف وظيفة كل جزء:\n\n`;

// 1. UI Translations & Fallbacks
md += `## 1. نصوص الواجهة والترجمات المزدوجة (UI & Toast Fallbacks)\n\n`;

const uiFiles = ['sales-report.js', 'dashboard.js', 'profile.js', 'plans-review.js', 'doctors-report.js', 'pharmacies-report.js', 'hospitals-report.js', 'quizzes.js', 'users.js', 'timeline-report.js', 'products.js', 'login.js'];

uiFiles.forEach(f => {
  if (!report[f]) return;
  const list = report[f];
  md += `### 📄 [\`js/${f}\`](file:///${root.replace(/\\/g, '/')}/js/${f}) (${list.length} سطر)\n\n`;
  md += `| السطر | الكود المكتوب في الملف |\n`;
  md += `| :---: | :--- |\n`;
  list.forEach(item => {
    // Escape markdown pipes
    const cleanCode = item.code.replace(/\|/g, '\\|').replace(/`/g, '\\`');
    md += `| [L${item.line}](file:///${root.replace(/\\/g, '/')}/js/${f}#L${item.line}) | \`${cleanCode.slice(0, 110)}\` |\n`;
  });
  md += `\n`;
});

// 2. Excel Import Matching & Arabic Normalization
md += `## 2. دوال مطابقة وقراءة شيتات الإكسيل للموزعين (Excel Columns & Text Normalization)\n\n`;
md += `> [!NOTE]\n`;
md += `> هذه السطور تستخدم للتعرف على ملفات الإكسيل الصادرة من الموزعين المصريين (ابن سينا، فارما أوفرسيز، المتحدة) لمطابقة أعمدة مثل "اسم الصيدلية"، "صافي"، "الكمية".\n\n`;

const dataFiles = ['distributors.js', 'shared-report.js', 'store.js'];
dataFiles.forEach(f => {
  if (!report[f]) return;
  const list = report[f];
  md += `### 📄 [\`js/${f}\`](file:///${root.replace(/\\/g, '/')}/js/${f}) (${list.length} سطر)\n\n`;
  md += `| السطر | الكود المكتوب في الملف |\n`;
  md += `| :---: | :--- |\n`;
  list.forEach(item => {
    const cleanCode = item.code.replace(/\|/g, '\\|').replace(/`/g, '\\`');
    md += `| [L${item.line}](file:///${root.replace(/\\/g, '/')}/js/${f}#L${item.line}) | \`${cleanCode.slice(0, 110)}\` |\n`;
  });
  md += `\n`;
});

// 3. Egypt Geo Dataset
md += `## 3. قاعدة البيانات الجغرافية لمصر (Egypt Bricks Data)\n\n`;
md += `- **الملف:** [\`js/egypt-bricks-data.js\`](file:///${root.replace(/\\/g, '/')}/js/egypt-bricks-data.js)\n`;
md += `- **الحجم:** يحتوي على **1,903 سطر** بأسماء المربعات السكنية والمناطق في مصر (مثل: المعادي، الدقي، مدينة نصر، طنطا، المنصورة، أسيوط...) لمطابقة صيدليات ومبيعات الموزعين.\n`;

const outPath = 'C:\\Users\\DeLL\\.gemini\\antigravity\\brain\\b53c222b-c0d3-476a-b520-5a9e86e62746\\arabic_code_audit_report.md';
fs.writeFileSync(outPath, md, 'utf8');
console.log('Report generated at:', outPath);
