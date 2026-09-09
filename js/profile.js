/**
 * @file profile.js
 * @description Profile management module displaying user info and dynamically computing leave balances.
 */

const profileTranslations = {
  en: {
    upload_photo: "Upload Photo",
    role_rep: "Medical Rep",
    personal_info: "Personal Information",
    full_name: "Full Name",
    email: "Email",
    phone: "Phone",
    employee_code: "Employee Code",
    product_line: "Product Line",
    manager: "Manager",
    save_changes: "Save Changes",
    leave_balance: "Leave Balance",
    annual_leave: "Annual Leave",
    sick_leave: "Sick Leave",
    emergency_leave: "Emergency Leave",
    unpaid_leave: "Unpaid Leave",
    days: "Days",
    preferences: "Preferences",
    language: "Language",
    email_notifications: "Email Notifications",
    push_notifications: "Push Notifications",
    save_preferences: "Save Preferences",
    change_password: "Change Password",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm New Password",
    update_password: "Update Password",
    req_length: "At least 8 characters",
    req_upper: "At least one uppercase letter",
    req_number: "At least one number",
  },
  ar: {
    upload_photo: "رفع صورة",
    role_rep: "مندوب طبي",
    personal_info: "المعلومات الشخصية",
    full_name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    employee_code: "رمز الموظف",
    product_line: "خط المنتجات",
    manager: "المدير",
    save_changes: "حفظ التغييرات",
    leave_balance: "رصيد الإجازات",
    annual_leave: "إجازة سنوية",
    sick_leave: "إجازة مرضية",
    emergency_leave: "إجازة طارئة",
    unpaid_leave: "إجازة غير مدفوعة",
    days: "أيام",
    preferences: "التفضيلات",
    language: "اللغة",
    email_notifications: "إشعارات البريد الإلكتروني",
    push_notifications: "إشعارات التطبيق",
    save_preferences: "حفظ التفضيلات",
    change_password: "تغيير كلمة المرور",
    current_password: "كلمة المرور الحالية",
    new_password: "كلمة المرور الجديدة",
    confirm_password: "تأكيد كلمة المرور الجديدة",
    update_password: "تحديث كلمة المرور",
    req_length: "8 أحرف على الأقل",
    req_upper: "حرف كبير واحد على الأقل",
    req_number: "رقم واحد على الأقل",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.translations) {
    Object.keys(profileTranslations).forEach((lang) => {
      if (!window.translations[lang]) window.translations[lang] = {};
      Object.assign(window.translations[lang], profileTranslations[lang]);
    });
  }

  const photoInput = document.getElementById("photoInput");
  const profileImagePreview = document.getElementById("profileImagePreview");
  const profileInitials = document.getElementById("profileInitials");

  if (photoInput) {
    photoInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          if (profileImagePreview) {
            profileImagePreview.src = e.target.result;
            profileImagePreview.style.display = "block";
          }
          if (profileInitials) profileInitials.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document
    .getElementById("personalInfoForm")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newName = document.getElementById("fullName").value;
      const disp = document.getElementById("profileNameDisplay");
      if (disp) disp.innerText = newName;
      
      const parts = newName.split(" ");
      let initials = parts[0][0];
      if (parts.length > 1) initials += parts[parts.length - 1][0];
      if (profileInitials) profileInitials.innerText = initials.toUpperCase();
      if (typeof showToast === "function") showToast("Personal information updated successfully!", "success");
    });

  document.getElementById("preferencesForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const lang = document.getElementById("languageSelect").value;
    if (window.switchLanguage) {
      window.switchLanguage(lang);
    }
    if (typeof showToast === "function") showToast("Preferences saved successfully!", "success");
  });

  document.getElementById("passwordForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;
    if (newPass !== confirmPass) {
      if (typeof showToast === "function") showToast("New password and confirmation do not match.", "error");
      return;
    }
    if (typeof showToast === "function") showToast("Password updated successfully!", "success");
    e.target.reset();
    const ind = document.getElementById("strengthIndicator");
    if (ind) ind.style.width = "0";
    document
      .querySelectorAll(".req-list li")
      .forEach((li) => li.classList.remove("valid"));
  });

  const newPassword = document.getElementById("newPassword");
  const strengthIndicator = document.getElementById("strengthIndicator");
  const reqLength = document.getElementById("req-length");
  const reqUpper = document.getElementById("req-upper");
  const reqNumber = document.getElementById("req-number");

  if (newPassword) {
    newPassword.addEventListener("input", (e) => {
      const val = e.target.value;
      let score = 0;

      if (val.length >= 8) {
        score++;
        reqLength?.classList.add("valid");
      } else {
        reqLength?.classList.remove("valid");
      }

      if (/[A-Z]/.test(val)) {
        score++;
        reqUpper?.classList.add("valid");
      } else {
        reqUpper?.classList.remove("valid");
      }

      if (/[0-9]/.test(val)) {
        score++;
        reqNumber?.classList.add("valid");
      } else {
        reqNumber?.classList.remove("valid");
      }

      let width = "0%";
      let color = "var(--gray-200)";
      if (score === 1) {
        width = "33%";
        color = "var(--danger)";
      } else if (score === 2) {
        width = "66%";
        color = "var(--warning)";
      } else if (score === 3) {
        width = "100%";
        color = "var(--success)";
      }

      if (strengthIndicator) {
        strengthIndicator.style.width = width;
        strengthIndicator.style.background = color;
      }
    });
  }

  if (document.documentElement.lang) {
    const select = document.getElementById("languageSelect");
    if (select) {
      select.value = document.documentElement.lang;
    }
  }

  loadUserProfile();
});

/**
 * Loads dynamic profile data and computes leave balances programmatically.
 */
function loadUserProfile() {
  const user = (window.checkAuth && window.checkAuth()) || (window.DEMO_DATA && window.DEMO_DATA.currentUser) || {
    name: "Ahmed Mostafa",
    email: "ahmed@pharmacare.com",
    role: "medical_rep",
    employeeCode: "EMP-001"
  };

  const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const allAreas = (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
  const allLines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const allLeaves = (window.store && window.store.leaves ? window.store.leaves.getAll() : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const displayName = (lang === "ar" && user.nameAr) ? user.nameAr : user.name;

  const profileNameDisplay = document.getElementById("profileNameDisplay");
  const fullName = document.getElementById("fullName");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const empCodeInput = document.getElementById("empCodeInput");
  const productLineInput = document.getElementById("productLineInput");
  const managerInput = document.getElementById("managerInput");
  const profileInitials = document.getElementById("profileInitials");

  if (profileNameDisplay) profileNameDisplay.textContent = displayName;
  if (fullName) fullName.value = displayName;
  if (email) email.value = user.email || `${user.id}@pharmacare.com`;
  if (phone) phone.value = user.phone || "+201001234567";
  if (empCodeInput) empCodeInput.value = user.employeeCode || user.code || "EMP-001";

  const profileRoleBadge = document.getElementById("profileRoleBadge");
  const profileEmpBadge = document.getElementById("profileEmpBadge");
  const profileAreaBadge = document.getElementById("profileAreaBadge");

  if (profileEmpBadge) profileEmpBadge.textContent = user.employeeCode || user.code || "EMP-001";

  const roleLabels = {
    medical_rep: lang === "ar" ? "مندوب طبي" : "Medical Rep",
    district_manager: lang === "ar" ? "مدير منطقة" : "District Manager",
    line_manager: lang === "ar" ? "مدير خط" : "Line Manager",
    business_unit: lang === "ar" ? "رئيس وحدة الأعمال" : "Business Unit Head",
    admin: lang === "ar" ? "مدير النظام" : "System Admin",
    hr: lang === "ar" ? "مسؤول موارد بشرية" : "HR Manager"
  };
  if (profileRoleBadge) {
    profileRoleBadge.textContent = roleLabels[user.role] || user.role;
  }

  const area = allAreas.find((a) => a.id === user.areaId || a.repId === user.id);
  if (profileAreaBadge) {
    profileAreaBadge.textContent = area ? `${area.name} (${area.code})` : (lang === "ar" ? "الإدارة العامة" : "Headquarters");
  }

  const line = allLines.find((l) => l.id === user.lineId || (l.products && user.lineIds && user.lineIds.includes(l.id)));
  if (productLineInput) {
    productLineInput.value = line ? line.name : (lang === "ar" ? "كافة الخطوط" : "All Product Lines");
  }

  const manager = allUsers.find((u) => u.id === user.managerId);
  if (managerInput) {
    const managerName = (lang === "ar" && manager?.nameAr) ? manager.nameAr : (manager ? manager.name : (lang === "ar" ? "الإدارة التنفيذية" : "Executive Management"));
    managerInput.value = managerName;
  }

  if (profileInitials && displayName) {
    const parts = displayName.split(" ");
    let inits = parts[0][0];
    if (parts.length > 1) inits += parts[parts.length - 1][0];
    profileInitials.textContent = inits.toUpperCase();
  }

  // Dynamic leave balances calculation synchronized with store leaves
  const approvedLeaves = allLeaves.filter((l) => l.userId === user.id && l.status === "approved");
  const used = { annual: 0, sick: 0, emergency: 0, unpaid: 0 };
  approvedLeaves.forEach((l) => {
    const d = parseFloat(l.days) || 1;
    if (l.type === "annual") used.annual += d;
    else if (l.type === "sick") used.sick += d;
    else if (l.type === "emergency" || l.type === "casual") used.emergency += d;
    else if (l.type === "unpaid") used.unpaid += d;
  });

  const freshUser = allUsers.find((u) => u.id === user.id) || user;
  const userBalance = freshUser.leaveBalance || user.leaveBalance || {};
  const totals = {
    annual: userBalance.annual !== undefined ? Number(userBalance.annual) : 21,
    sick: userBalance.sick !== undefined ? Number(userBalance.sick) : 7,
    emergency: userBalance.emergency !== undefined ? Number(userBalance.emergency) : (userBalance.casual !== undefined ? Number(userBalance.casual) : 6),
    unpaid: userBalance.unpaid || 0
  };
  const daysSuffix = lang === "ar" ? "أيام" : "Days";

  const updateLeaveEl = (textId, progId, usedVal, totalVal) => {
    const textEl = document.getElementById(textId);
    const progEl = document.getElementById(progId);
    if (textEl) {
      textEl.innerHTML = `${usedVal} / ${totalVal} <span>${daysSuffix}</span>`;
    }
    if (progEl) {
      const pct = totalVal > 0 ? Math.min(100, Math.round((usedVal / totalVal) * 100)) : 0;
      progEl.style.width = `${pct}%`;
    }
  };

  updateLeaveEl("annualLeaveText", "annualLeaveProgress", used.annual, totals.annual);
  updateLeaveEl("sickLeaveText", "sickLeaveProgress", used.sick, totals.sick);
  updateLeaveEl("emergencyLeaveText", "emergencyLeaveProgress", used.emergency, totals.emergency);

  const unpaidText = document.getElementById("unpaidLeaveText");
  const unpaidProg = document.getElementById("unpaidLeaveProgress");
  if (unpaidText) unpaidText.innerHTML = `${used.unpaid} <span>${daysSuffix}</span>`;
  if (unpaidProg) unpaidProg.style.width = used.unpaid > 0 ? "100%" : "0%";
}