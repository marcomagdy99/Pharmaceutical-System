const fs = require("fs");
const path = require("path");

const dashboardPath = path.resolve(__dirname, "../js/dashboard.js");
let content = fs.readFileSync(dashboardPath, "utf8");

// 1. Fix isPlannedVisitExpired and getDmAccompanimentSchedule
const targetFuncs = `function isPlannedVisitExpired(dateStr) {
  return window.isPlannedVisitExpired ? window.isPlannedVisitExpired(dateStr) : false;
}`;

const replacementFuncs = `var isPlannedVisitExpired = (typeof window !== "undefined" && window.isPlannedVisitExpired) || function (dateStr) {
  return false;
};`;

const targetDmFunc = `function getDmAccompanimentSchedule(dmId) {
  return window.getDmAccompanimentSchedule ? window.getDmAccompanimentSchedule(dmId) : {};
}`;

const replacementDmFunc = `var getDmAccompanimentSchedule = (typeof window !== "undefined" && window.getDmAccompanimentSchedule) || function (dmId) {
  try {
    const raw = localStorage.getItem("pharma_dm_accompaniments");
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data[dmId]) return data[dmId];
    }
  } catch (e) {}
  return {};
};`;

// 2. Fix fallback card styling
const targetCard = `<div style="padding: 40px 20px; text-align: center; max-width: 480px; margin: 40px auto; background: var(--card-bg, #ffffff); border-radius: 16px; border: 1px solid var(--gray-200); box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔄</div>
        <h3 style="font-weight: 800; margin-bottom: 8px; font-size: 1.2rem;">\${isAr ? "تحديث جديد للنظام متاح" : "New App Update Available"}</h3>
        <p style="color: var(--gray-600); font-size: 0.88rem; line-height: 1.6; margin-bottom: 20px;">
          \${isAr ? "تم إصدار تحديث حديث للنظام يتطلب تحديث الذاكرة المؤقتة (Cache) على هذا الجهاز." : "A new update has been released. Please refresh your browser cache to apply changes."}
        </p>
        <button onclick="if(window.forceClearCacheAndReload){window.forceClearCacheAndReload();}else{window.location.reload(true);}" class="btn btn-primary" style="padding: 10px 24px; font-weight: 700; border-radius: 10px; cursor: pointer;">
          ⚡ \${isAr ? "تحديث الصفحة وحذف الكاش" : "Refresh & Clear Cache"}
        </button>
      </div>`;

const replacementCard = `<div class="card" style="padding: 40px 20px; text-align: center; max-width: 480px; margin: 40px auto; border-radius: 16px; border: 1px solid var(--border-color, #e2e8f0); box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: var(--card-bg, #ffffff);">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔄</div>
        <h3 style="font-weight: 800; margin-bottom: 8px; font-size: 1.2rem; color: var(--text-color, #1e293b);">\${isAr ? "تحديث جديد للنظام متاح" : "New App Update Available"}</h3>
        <p style="color: var(--text-muted, #64748b); font-size: 0.88rem; line-height: 1.6; margin-bottom: 20px;">
          \${isAr ? "تم إصدار تحديث حديث للنظام يتطلب تحديث الذاكرة المؤقتة (Cache) على هذا الجهاز." : "A new update has been released. Please refresh your browser cache to apply changes."}
        </p>
        <button onclick="if(window.forceClearCacheAndReload){window.forceClearCacheAndReload();}else{window.location.reload(true);}" class="btn btn-primary" style="padding: 10px 24px; font-weight: 700; border-radius: 10px; cursor: pointer;">
          ⚡ \${isAr ? "تحديث الصفحة وحذف الكاش" : "Refresh & Clear Cache"}
        </button>
      </div>`;

// Normalize line endings for replacement
const norm = (s) => s.replace(/\r\n/g, "\n");

let normContent = norm(content);

if (!normContent.includes(norm(targetFuncs))) {
  console.error("targetFuncs not found!");
  process.exit(1);
}
normContent = normContent.replace(norm(targetFuncs), norm(replacementFuncs));

if (!normContent.includes(norm(targetDmFunc))) {
  console.error("targetDmFunc not found!");
  process.exit(1);
}
normContent = normContent.replace(norm(targetDmFunc), norm(replacementDmFunc));

if (!normContent.includes(norm(targetCard))) {
  console.error("targetCard not found!");
  process.exit(1);
}
normContent = normContent.replace(norm(targetCard), norm(replacementCard));

fs.writeFileSync(dashboardPath, normContent, "utf8");
console.log("Successfully fixed dashboard.js recursion traps and fallback card styling.");
