const fs = require('fs');

let c = fs.readFileSync('js/profile.js', 'utf8');

c = c.replace(/profileAreaBadge\.textContent = area \? `\$\{area\.name\} \(\$\{area\.code\}\)` : \(lang === "ar" \? "الإدارة العامة" : "Headquarters"\);/, 'profileAreaBadge.textContent = area ? `${area.name} (${area.code})` : "Headquarters";');
c = c.replace(/const managerName = \(lang === "ar" && manager\?\.nameAr\) \? manager\.nameAr : \(manager \? manager\.name : \(lang === "ar" \? "الإدارة التنفيذية" : "Executive Management"\)\);/, 'const managerName = manager ? manager.name : "Executive Management";');
c = c.replace(/\$\{lang === "ar" \? "مرحل" : "Rollover"\}/g, 'Rollover');
c = c.replace(/taglineAr:\s*taglineAr\s*\|\|\s*"[^"]*",?/g, '');
c = c.replace(/descAr:\s*descAr\s*\|\|\s*"[^"]*",?/g, '');

c = c.replace(/<strong class="sys-mgmt-status-title-prod">\$\{isAr \? "[^"]*" : "Active Production Environment \(Live\)"\}<\/strong>/, '<strong class="sys-mgmt-status-title-prod">Active Production Environment (Live)</strong>');
c = c.replace(/<span class="badge sys-mgmt-tag-prod">\$\{isAr \? "[^"]*" : "Official Live"\}<\/span>/, '<span class="badge sys-mgmt-tag-prod">Official Live</span>');
c = c.replace(/\$\{isAr \? `[^`]*` : `Officially launched on: <strong>\$\{launchDate \|\| "Active"\}<\/strong> — Transactional resets are permanently locked\.`\}/, 'Officially launched on: <strong>${launchDate || "Active"}</strong> — Transactional resets are permanently locked.');
c = c.replace(/\$\{isAr \? "السيستم مباشر 100%" : "Production 100%"\}/, 'Production 100%');
c = c.replace(/<strong class="sys-mgmt-status-title-demo">\$\{isAr \? "[^"]*" : "Demo & Staging Environment"\}<\/strong>/, '<strong class="sys-mgmt-status-title-demo">Demo & Staging Environment</strong>');
c = c.replace(/<span class="badge sys-mgmt-tag-demo">\$\{isAr \? "[^"]*" : "Pre-Launch"\}<\/span>/, '<span class="badge sys-mgmt-tag-demo">Pre-Launch</span>');
c = c.replace(/\$\{isAr \? "[^"]*" : "The system is running with test records\. Use the Launch button below when ready to go live\."\}/, 'The system is running with test records. Use the Launch button below when ready to go live.');
c = c.replace(/\$\{isAr \? "وضع تجريبي" : "Demo Mode"\}/, 'Demo Mode');

c = c.replace(/showToast\(isAr \? "[^"]*" : ("Database backup exported successfully!"), "success"\);/, 'showToast($1, "success");');
c = c.replace(/showToast\(isAr \? "[^"]*" : ("Database restored successfully! Refreshing\.\.\."), "success"\);/, 'showToast($1, "success");');
c = c.replace(/showToast\(\(isAr \? "فشل استعادة النسخة الاحتياطية: " : "Failed to restore backup: "\) \+ \(err\.message \|\| err\), "error"\);/, 'showToast("Failed to restore backup: " + (err.message || err), "error");');
c = c.replace(/showToast\(isAr \? "[^"]*" : ("Congratulations! Production launched successfully!"), "success"\);/, 'showToast($1, "success");');

fs.writeFileSync('js/profile.js', c, 'utf8');
console.log('profile.js remaining ar:', /[\u0600-\u06FF]/.test(fs.readFileSync('js/profile.js', 'utf8')));
