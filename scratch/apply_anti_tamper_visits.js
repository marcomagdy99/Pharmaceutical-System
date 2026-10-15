const fs = require('fs');

let content = fs.readFileSync('js/visits.js', 'utf8');

// 1. Add renderTimeTamperedBadge after renderGpsBadge
const gpsBadgeEnd = `  if (v.gpsStatus === "out_of_range") {
    const text = \`⚠️ Out of Range\${distStr}\`;
    return \`<span class="badge badge-gps-out-of-range" title="Out of Range">\${text}\${mapLinkHtml}</span>\`;
  }
  return "";
}`;

const timeBadgeCode = `  if (v.gpsStatus === "out_of_range") {
    const text = \`⚠️ Out of Range\${distStr}\`;
    return \`<span class="badge badge-gps-out-of-range" title="Out of Range">\${text}\${mapLinkHtml}</span>\`;
  }
  return "";
}

function renderTimeTamperedBadge(v, lang) {
  if (!v || !v.timeTampered) return "";
  const drift = v.clockDriftMinutes || 0;
  const sign = drift > 0 ? "+" : "";
  const isAr = lang === "ar" || (typeof window !== "undefined" && window.getCurrentLang && window.getCurrentLang() === "ar");
  const text = isAr ? \`⏰ فارق توقيت (\${sign}\${drift} د)\` : \`⏰ Time Drift (\${sign}\${drift}m)\`;
  const title = isAr
    ? \`ساعة جهاز المندوب كانت غير متطابقة مع توقيت الشبكة بفارق \${sign}\${drift} دقيقة. تم اعتماد توقيت الشبكة الرسمي.\`
    : \`Device clock differed from verified network time by \${sign}\${drift} minutes. Stamped with official network time.\`;
  return \`<span class="badge bg-warning text-dark border border-warning ms-1" title="\${title}" style="font-size:0.75rem; vertical-align:middle;">\${text}</span>\`;
}`;

content = content.replace(gpsBadgeEnd, timeBadgeCode);

// 2. Add renderTimeTamperedBadge(v, lang) in timeline cards
content = content.replace(
  '${renderGpsBadge(v, lang)}\n            <span class="visit-badge-pill ${badgeClass}">',
  '${renderGpsBadge(v, lang)}\n            ${renderTimeTamperedBadge(v, lang)}\n            <span class="visit-badge-pill ${badgeClass}">'
);

// 3. Update saveVisit() to use NetworkTime and detect tampering
const saveVisitStart = `  const timeInput = document.getElementById("visitTime");
  const visitTime = timeInput && timeInput.value ? timeInput.value : "11:00";
  const dateInput = document.getElementById("visitDate");
  const visitDate = dateInput && dateInput.value ? dateInput.value : todayStr;`;

const saveVisitEnhanced = `  const todayStrNow = (window.getSystemTodayStr && window.getSystemTodayStr()) || todayStr;
  const timeInput = document.getElementById("visitTime");
  const visitTime = timeInput && timeInput.value ? timeInput.value : "11:00";
  const dateInput = document.getElementById("visitDate");
  const visitDate = dateInput && dateInput.value ? dateInput.value : todayStrNow;

  // Anti-Timestamp Tampering Check
  let isTimeTampered = false;
  let clockDriftMinutes = 0;
  if (window.NetworkTime && typeof window.NetworkTime.checkTampering === "function") {
    const timeCheck = window.NetworkTime.checkTampering(5);
    if (timeCheck.isTampered) {
      isTimeTampered = true;
      clockDriftMinutes = timeCheck.driftMinutes;
      const driftText = Math.abs(timeCheck.driftMinutes) + (lang === "ar" ? " دقيقة" : " min");
      const msg = lang === "ar"
        ? \`⚠️ تنبيه أمني: ساعة جهازك غير مطابقة لتوقيت الشبكة (فارق \${driftText}). تم اعتماد توقيت الشبكة الرسمي للزيارة تلقائياً.\`
        : \`⚠️ Security Notice: Device clock out of sync (\${driftText}). Visit stamped with official network time.\`;
      if (typeof showToast === "function") {
        showToast(msg, "warning");
      }
    }
  }`;

content = content.replace(saveVisitStart, saveVisitEnhanced);

// 4. In saveVisit future date checks, use todayStrNow
content = content.replace('if (visitDate < todayStr)', 'if (visitDate < todayStrNow)');
content = content.replace('if (visitDate > todayStr)', 'if (visitDate > todayStrNow)');

// 5. In saveVisit nowStamp for edits
content = content.replace(
  'const nowStamp = new Date();\n      visit.insertionDate = nowStamp.toISOString().slice(0, 10);',
  `const nowStamp = (window.NetworkTime && window.NetworkTime.now) ? window.NetworkTime.now() : new Date();
      if (isTimeTampered) {
        visit.timeTampered = true;
        visit.clockDriftMinutes = clockDriftMinutes;
        visit.verifiedNetworkTime = nowStamp.toISOString();
      }
      visit.insertionDate = nowStamp.toISOString().slice(0, 10);`
);

// 6. In saveVisit nowStamp for new visits
content = content.replace(
  'const nowStamp = new Date();\n    const insDate = nowStamp.toISOString().slice(0, 10);',
  'const nowStamp = (window.NetworkTime && window.NetworkTime.now) ? window.NetworkTime.now() : new Date();\n    const insDate = nowStamp.toISOString().slice(0, 10);'
);

content = content.replace(
  'status: modalSource === "plan" ? "pending_approval" : "completed",',
  `status: modalSource === "plan" ? "pending_approval" : "completed",
      timeTampered: isTimeTampered,
      clockDriftMinutes: clockDriftMinutes,
      verifiedNetworkTime: nowStamp.toISOString(),`
);

fs.writeFileSync('js/visits.js', content, 'utf8');
console.log('✅ Successfully integrated Anti-Timestamp Tampering into js/visits.js');
