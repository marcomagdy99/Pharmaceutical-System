const fs = require('fs');

let c = fs.readFileSync('js/sales-report.js', 'utf8');

c = c.replace(/const placeholder = lang === 'ar' \? '-- اختار الموزّع --' : '-- Select Distributor --';/, "const placeholder = '-- Select Distributor --';");
c = c.replace(/: `\$\{d\.name\} \$\{lang === 'ar' \? '\(غير مضبوط\)' : '\(not configured\)'\}`;/, ": `${d.name} (not configured)`;");
c = c.replace(/labelEl\.textContent = lang === 'ar' \? 'لم يتم اختيار شهور' : 'No Months Selected';/, "labelEl.textContent = 'No Months Selected';");
c = c.replace(/labelEl\.textContent = lang === 'ar' \? 'كل الشهور' : 'All Months';/, "labelEl.textContent = 'All Months';");
c = c.replace(/names\.join\(lang === 'ar' \? '، ' : ', '\)/, "names.join(', ')");
c = c.replace(/checkedBoxes\.length > 1 \? `\$\{checkedBoxes\.length\} شهور محددة` : names\[0\]/, "checkedBoxes.length > 1 ? `${checkedBoxes.length} Months Selected` : names[0]");
c = c.replace(/const allLabel = lang === 'ar' \? 'جميع الموزعين' : 'All Distributors';/, "const allLabel = 'All Distributors';");
c = c.replace(/const allLabel = curLang === 'ar' \? 'جميع المناطق' : 'All Areas';/, "const allLabel = 'All Areas';");
c = c.replace(/const vacantTag = isVacant \? ` \[\$\{curLang === 'ar' \? 'شاغرة' : 'Vacant'\}\]` : '';/, "const vacantTag = isVacant ? ' [Vacant]' : '';");
c = c.replace(/const allLabel = curLang === 'ar' \? 'جميع الأدوية' : 'All Products';/, "const allLabel = 'All Products';");
c = c.replace(/const periodText = monthText \? `\$\{monthText\} \$\{yearVal\}`\.trim\(\) : \(lang === 'ar' \? 'كل الفترات' : 'All periods'\);/, "const periodText = monthText ? `${monthText} ${yearVal}`.trim() : 'All periods';");
c = c.replace(/periodLabel\.textContent = `\$\{lang === 'ar' \? 'الفترة:' : 'Period:'\} \$\{periodText\}`;/, "periodLabel.textContent = `Period: ${periodText}`;");
c = c.replace(/\$\{lang === 'ar' \? 'يرجى اختيار شهر واحد على الأقل\.' : 'Please select at least one month\.'\}/, "Please select at least one month.");
c = c.replace(/\$\{lang === 'ar' \? 'لا توجد بيانات مبيعات صيدليات لهذا الاختيار\.' : 'No pharmacy sales found for this selection\.'\}/, "No pharmacy sales found for this selection.");
c = c.replace(/row\.areaRaw \|\| \(lang === 'ar' \? 'غير مربوط' : 'Unmatched'\)/, "row.areaRaw || 'Unmatched'");
c = c.replace(/rep \? rep\.name : \(lang === 'ar' \? 'غير مربوط' : 'Unassigned'\)/, "rep ? rep.name : 'Unassigned'");

c = c.replace(/showToast\(lang === 'ar' \? 'عفواً، الأدمن فقط هو المصرح له برفع شيت المبيعات' : 'Permission Denied: Admin only\.', 'error'\);/, "showToast('Permission Denied: Admin only.', 'error');");
c = c.replace(/showToast\(lang === 'ar' \? 'اختار الموزّع الأول\.' : 'Select a distributor first\.', 'warning'\);/, "showToast('Select a distributor first.', 'warning');");

c = c.replace(/showToast\(\s*lang === 'ar'\s*\?\s*'الموزّع ده لسه مفيهوش ربط أعمدة\. اضبطه من صفحة الموزعين الأول\.'\s*:\s*"This distributor's sheet columns aren't mapped yet\. Configure it from the Distributors page first\.",\s*'error',\s*\);/, "showToast(\"This distributor's sheet columns aren't mapped yet. Configure it from the Distributors page first.\", 'error');");

c = c.replace(/showToast\(lang === 'ar' \? 'محتاج تختار الموزّع والشهر والسنة الأول\.' : 'Select a distributor, month, and year first\.', 'warning'\);/, "showToast('Select a distributor, month, and year first.', 'warning');");
c = c.replace(/showToast\(lang === 'ar' \? 'مكتبة قراءة الإكسيل غير محملة\.' : 'Excel reader library failed to load\.', 'error'\);/, "showToast('Excel reader library failed to load.', 'error');");

c = c.replace(/const confirmMsg = lang === 'ar'[\s\S]*?: `A sheet was already uploaded for "\$\{dist\.name\}" \/ \$\{monthKey\} \(\$\{existingBatch\.rowCount\} rows\$\{uploadedDate \? ', on ' \+ uploadedDate : ''\}\)\. Continuing will replace that previous upload entirely with this new file \(not add on top of it\)\. Continue\?`;/, "const confirmMsg = `A sheet was already uploaded for \"${dist.name}\" / ${monthKey} (${existingBatch.rowCount} rows${uploadedDate ? ', on ' + uploadedDate : ''}). Continuing will replace that previous upload entirely with this new file (not add on top of it). Continue?`;");

c = c.replace(/showToast\(lang === 'ar' \? `جاري معالجة الشيت: \$\{file\.name\}\.\.\.` : `Processing file: \$\{file\.name\}\.\.\.`, 'info'\);/, "showToast(`Processing file: ${file.name}...`, 'info');");
c = c.replace(/title: lang === 'ar' \? `جاري استيراد مبيعات: \$\{dist\.name\}` : `Importing Sales: \$\{dist\.name\}`,/, "title: `Importing Sales: ${dist.name}`,");
c = c.replace(/progress\.update\(totalRows, totalRows, lang === 'ar' \? 'جاري حفظ وتخزين البيانات\.\.\.' : 'Saving imported records\.\.\.'\);/, "progress.update(totalRows, totalRows, 'Saving imported records...');");
c = c.replace(/const replacedNote = replacingPreviousBatch\s*\?\s*\(lang === 'ar' \? ' \(استبدلت رفعة سابقة لنفس الشهر\/الموزّع\)' : ' \(replaced a previous upload for this month\/distributor\)'\)\s*:\s*'';/, "const replacedNote = replacingPreviousBatch ? ' (replaced a previous upload for this month/distributor)' : '';");

c = c.replace(/panel\.innerHTML = lang === 'ar'[\s\S]*?: `✅ Imported <strong>\$\{imported\.length\.toLocaleString\(\)\}<\/strong> rows from "\$\{dist\.name\}" for \$\{monthKey\}\$\{replacedNote\}[\s\S]*?Distributors page\.`;/, "panel.innerHTML = `✅ Imported <strong>${imported.length.toLocaleString()}</strong> rows from \"${dist.name}\" for ${monthKey}${replacedNote} (including ${returnsCount} negative return rows, netted automatically). Net value: ${totalValue.toLocaleString()}. Skipped ${skippedInvalid} rows with unclear product/value.<br><span style=\"font-weight:600;\">Note:</span> these rows show up in the Pharmacies Sales table right away, but any with an unmatched area or product won't count toward the Achievements tab or the Line filter until you link them on the Distributors page.`;");

c = c.replace(/progress\.finish\(lang === 'ar' \? `تم استيراد \$\{imported\.length\.toLocaleString\(\)\} سجل بنجاح!` : `Successfully imported \$\{imported\.length\.toLocaleString\(\)\} rows!`\);/, "progress.finish(`Successfully imported ${imported.length.toLocaleString()} rows!`);");

c = c.replace(/showToast\(\s*lang === 'ar'\s*\?\s*`تم استيراد \$\{imported\.length\.toLocaleString\(\)\} صف بنجاح\.`\s*:\s*`Successfully imported \$\{imported\.length\.toLocaleString\(\)\} rows\.`,\s*'success',\s*\);/, "showToast(`Successfully imported ${imported.length.toLocaleString()} rows.`, 'success');");

c = c.replace(/showToast\(\s*lang === 'ar'\s*\?\s*'تعذرت قراءة الملف\. تأكد إنه بنفس شكل الشيت اللي اتعمل عليه الربط\.'\s*:\s*"Couldn't read this file\. Make sure it matches the sheet layout the mapping was configured from\.",\s*'error',\s*\);/, "showToast(\"Couldn't read this file. Make sure it matches the sheet layout the mapping was configured from.\", 'error');");

c = c.replace(/if \(typeof showToast === 'function'\) showToast\(getCurrentLang\(\) === 'ar' \? 'غير مصرح: إدارة الأهداف للأدمن فقط\.' : 'Permission Denied: Admin only\.', 'error'\);/g, "if (typeof showToast === 'function') showToast('Permission Denied: Admin only.', 'error');");
c = c.replace(/showToast\(getCurrentLang\(\) === 'ar' \? 'خطأ: الصنف المختار لا ينتمي لخط الإنتاج المخصص لهذا المندوب\.' : 'Error: Selected product does not belong to this rep\\'s assigned line\.', 'error'\);/, "showToast('Error: Selected product does not belong to this rep\\'s assigned line.', 'error');");

fs.writeFileSync('js/sales-report.js', c, 'utf8');
console.log('sales-report remaining ar:', /[\u0600-\u06FF]/.test(fs.readFileSync('js/sales-report.js', 'utf8')));
