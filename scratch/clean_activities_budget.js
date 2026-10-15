const fs = require('fs');

let content = fs.readFileSync('js/activities-tab-budget.js', 'utf8');

content = content.replace(
  'Core.safeShowToast(Core.t("unauthorizedBudgetAction") || "غير مصرح لك بتعديل ميزانية قطاع الأعمال.", "danger");',
  'Core.safeShowToast(Core.t("unauthorizedBudgetAction") || "You are not authorized to edit business unit budget.", "danger");'
);

content = content.replace(
  'Core.t("budgetOverAllocated") || `تحذير: إجمالي مخصصات مديري الخطوط (${totalLmAlloc.toLocaleString()}) يتجاوز الميزانية الكلية للخط (${total.toLocaleString()}).`,',
  'Core.t("budgetOverAllocated") || `Warning: Total line manager allocations (${totalLmAlloc.toLocaleString()}) exceed line total budget (${total.toLocaleString()}).`,'
);

content = content.replace(
  'Core.safeShowToast(Core.t("savedBudgetMessage") || "تم حفظ مخصصات الميزانية بنجاح", "success");',
  'Core.safeShowToast(Core.t("savedBudgetMessage") || "Budget allocations saved successfully.", "success");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("unauthorizedRepBudgetAction") || "غير مصرح لك بتعديل مخصصات المندوبين.", "danger");',
  'Core.safeShowToast(Core.t("unauthorizedRepBudgetAction") || "You are not authorized to edit representative allocations.", "danger");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("insufficientBudgetNotice") || "تحذير: إجمالي المخصص للمندوبين يتجاوز ميزانية المنطقة المتاحة لك.", "warning");',
  'Core.safeShowToast(Core.t("insufficientBudgetNotice") || "Warning: Total allocated to reps exceeds your available territory budget.", "warning");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("savedRepBudgetMessage") || "تم حفظ مخصصات المندوبين بنجاح.", "success");',
  'Core.safeShowToast(Core.t("savedRepBudgetMessage") || "Rep allocations saved successfully.", "success");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("unauthorizedDmBudgetAction") || "غير مصرح لك بتعديل مخصصات مديري المناطق.", "danger");',
  'Core.safeShowToast(Core.t("unauthorizedDmBudgetAction") || "You are not authorized to edit district manager allocations.", "danger");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("insufficientBudgetNotice") || "تحذير: إجمالي المخصص لمديري المناطق يتجاوز ميزانية الخط المتاحة لك.", "warning");',
  'Core.safeShowToast(Core.t("insufficientBudgetNotice") || "Warning: Total allocated to district managers exceeds your available line budget.", "warning");'
);

content = content.replace(
  'Core.safeShowToast(Core.t("savedDmBudgetMessage") || "تم حفظ مخصصات مديري المناطق بنجاح.", "success");',
  'Core.safeShowToast(Core.t("savedDmBudgetMessage") || "District manager allocations saved successfully.", "success");'
);

fs.writeFileSync('js/activities-tab-budget.js', content, 'utf8');
console.log('activities-tab-budget.js cleaned. Remaining Arabic:', /[\u0600-\u06FF]/.test(content));
