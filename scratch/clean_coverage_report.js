const fs = require('fs');

let content = fs.readFileSync('js/coverage-report.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. rulesEl
content = content.replace(
  /if \(lang === 'ar'\) \{\s*rulesEl\.innerHTML = `💡 <strong>قواعد التغطية\$\{lineTag\}:<\/strong> أطباء فئة A = \$\{freqA\} زيارات\/ربع سنوي \| أطباء فئة B = \$\{freqB\} زيارات\/ربع سنوي \| مستشفيات = 2 زيارة\/شهر`;\s*\} else \{\s*rulesEl\.innerHTML = `💡 <strong>Coverage Rules\$\{lineTag\}:<\/strong> Class A Doctors = \$\{freqA\} visits\/Quarter \| Class B Doctors = \$\{freqB\} visits\/Quarter \| AM Hospitals = 2 visits\/Month`;\s*\}/s,
  'rulesEl.innerHTML = `💡 <strong>Coverage Rules${lineTag}:</strong> Class A Doctors = ${freqA} visits/Quarter | Class B Doctors = ${freqB} visits/Quarter | AM Hospitals = 2 visits/Month`;'
);

// 2. summaryTbody empty
content = content.replace(
  /\$\{lang === 'ar' \? 'لا توجد بيانات مطابقة للموظفين المحددين في هذه الفترة\.' : 'No employee data matching the selected filter\.'\}/g,
  'No employee data matching the selected filter.'
);

// 3. titles for rep rows
content = content.replace(
  /title="\$\{lang === 'ar' \? 'عرض كل أطباء هذا المندوب' : 'Show all doctors for this rep'\}"/g,
  'title="Show all doctors for this rep"'
);
content = content.replace(
  /title="\$\{lang === 'ar' \? 'عرض الأطباء المزارين فقط' : 'Show visited doctors only'\}"/g,
  'title="Show visited doctors only"'
);
content = content.replace(
  /title="\$\{lang === 'ar' \? 'عرض الأطباء غير المزارين' : 'Show unvisited doctors only'\}"/g,
  'title="Show unvisited doctors only"'
);
content = content.replace(
  /title="\$\{lang === 'ar' \? 'عرض أطباء الزيارات الفعلية' : 'Show actual visits doctors'\}"/g,
  'title="Show actual visits doctors"'
);

// 4. totalTr
content = content.replace(
  /<td style="color: var\(--primary\);">\$\{lang === 'ar' \? 'الإجمالي' : 'TOTAL'\}<\/td>/g,
  '<td style="color: var(--primary);">TOTAL</td>'
);
content = content.replace(
  /<td>\$\{lang === 'ar' \? 'كافة المناطق' : 'All Territories'\}<\/td>/g,
  '<td>All Territories</td>'
);

content = content.replace(
  /onclick="setCoverageDrilldown\('all', null, '\$\{lang === 'ar' \? 'الكل' : 'All'\}'\)"\s*title="\$\{lang === 'ar' \? 'عرض كافة الأطباء للجميع' : 'Show all doctors'\}"/g,
  `onclick="setCoverageDrilldown('all', null, 'All')"\n              title="Show all doctors"`
);
content = content.replace(
  /onclick="setCoverageDrilldown\('visited', null, '\$\{lang === 'ar' \? 'الكل' : 'All'\}'\)"\s*title="\$\{lang === 'ar' \? 'عرض كافة الأطباء المزارين' : 'Show all visited doctors'\}"/g,
  `onclick="setCoverageDrilldown('visited', null, 'All')"\n              title="Show all visited doctors"`
);
content = content.replace(
  /onclick="setCoverageDrilldown\('unvisited', null, '\$\{lang === 'ar' \? 'الكل' : 'All'\}'\)"\s*title="\$\{lang === 'ar' \? 'عرض كافة الأطباء غير المزارين' : 'Show all unvisited doctors'\}"/g,
  `onclick="setCoverageDrilldown('unvisited', null, 'All')"\n              title="Show all unvisited doctors"`
);
content = content.replace(
  /onclick="setCoverageDrilldown\('actual', null, '\$\{lang === 'ar' \? 'الكل' : 'All'\}'\)"\s*title="\$\{lang === 'ar' \? 'عرض كافة أطباء الزيارات الفعلية' : 'Show all actual visit doctors'\}"/g,
  `onclick="setCoverageDrilldown('actual', null, 'All')"\n              title="Show all actual visit doctors"`
);

// 5. typeLabel in drilldown
content = content.replace(
  /if \(coverageDrilldownState\.type === 'visited'\) \{\s*typeLabel = lang === 'ar' \? 'الأطباء المزارين فقط' : 'Visited Doctors Only';\s*\} else if \(coverageDrilldownState\.type === 'unvisited'\) \{\s*typeLabel = lang === 'ar' \? 'الأطباء غير المزارين' : 'Unvisited Doctors Only';\s*\} else if \(coverageDrilldownState\.type === 'actual'\) \{\s*typeLabel = lang === 'ar' \? 'أطباء الزيارات الفعلية \(Actual\)' : 'Actual Visits Doctors';\s*\} else \{\s*typeLabel = lang === 'ar' \? 'كافة الأطباء' : 'All Doctors';\s*\}/s,
  `if (coverageDrilldownState.type === 'visited') {
        typeLabel = 'Visited Doctors Only';
      } else if (coverageDrilldownState.type === 'unvisited') {
        typeLabel = 'Unvisited Doctors Only';
      } else if (coverageDrilldownState.type === 'actual') {
        typeLabel = 'Actual Visits Doctors';
      } else {
        typeLabel = 'All Doctors';
      }`
);

content = content.replace(
  /drilldownText\.textContent = lang === 'ar'\s*\?\s*`عرض مخصص: \$\{typeLabel\}\$\{repLabel\}`\s*:\s*`Filtered View: \$\{typeLabel\}\$\{repLabel\}`;/s,
  'drilldownText.textContent = `Filtered View: ${typeLabel}${repLabel}`;'
);

// 6. detailsTargets
content = content.replace(
  /\$\{lang === 'ar' \? 'لا توجد أهداف مطابقة لهذا الاختيار المحدد\.' : 'No targets match the selected drill-down filter\.'\}/g,
  'No targets match the selected drill-down filter.'
);

content = content.replace(
  /const typeLabel = isAct \? \(lang === 'ar' \? 'فعلية' : 'Actual'\) : \(lang === 'ar' \? 'خطة' : 'Plan'\);/g,
  "const typeLabel = isAct ? 'Actual' : 'Plan';"
);

content = content.replace(
  /return `<div style="font-size: 0\.68rem; color: #0d6efd; font-weight: 600; margin-top: 2px;">📥 \$\{lang === 'ar' \? 'إدخال:' : 'Ins:'\} \$\{insD\} \$\{insT\}<\/div>`;/g,
  'return `<div style="font-size: 0.68rem; color: #0d6efd; font-weight: 600; margin-top: 2px;">📥 Ins: ${insD} ${insT}</div>`;'
);

content = content.replace(
  /timestampsHtml = `<span style="color: var\(--gray-400\); font-style: italic; font-size: 0\.8rem;">\$\{lang === 'ar' \? 'لا توجد زيارات في هذه الفترة' : 'No visits in this period'\}<\/span>`;/g,
  'timestampsHtml = `<span style="color: var(--gray-400); font-style: italic; font-size: 0.8rem;">No visits in this period</span>`;'
);

// 7. elTargetsSubtext
content = content.replace(
  /if \(elTargetsSubtext\) elTargetsSubtext\.textContent = lang === 'ar' \? 'الأطباء والمستشفيات المزارة' : 'Doctors\/Hospitals Visited';/g,
  "if (elTargetsSubtext) elTargetsSubtext.textContent = 'Doctors/Hospitals Visited';"
);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/coverage-report.js', content, 'utf8');
console.log('coverage-report.js cleaned. Remaining Arabic:', /[\u0600-\u06FF]/.test(content));
