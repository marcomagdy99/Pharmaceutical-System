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
    hire_date: "Hire Date",
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
    managed_by_admin_hint: "Official personal & employee details are managed by the System Administrator or HR.",
    manage_users_link: "Manage in Users Module",
    photo_updated: "Profile photo updated successfully!",
    companyGovernanceTitle: "Company Field Governance & Policies",
    adminExclusive: "Admin Exclusive",
    companyGovernanceDesc: "Configure organizational policies that apply across all Medical Representatives and Managers in the field.",
    toggleGpsLabel: "Enforce GPS Location Verification for Visits",
    toggleGpsHint: "When enabled, reps must record visits within the clinic geofence. If rep disables GPS, an audit flag is reported to the manager.",
    gpsRadiusLabel: "Geofencing Validation Radius (Meters)",
    minPmVisitsLabel: "Minimum Evening Visits (PM Visits/Day)",
    minPmVisitsHint: "Daily minimum required clinic visits during the evening shift for medical representatives.",
    workSchedulePolicyTitle: "Work Schedule & Weekly Rest Days",
    toggleThursdayWeekendLabel: "Designate Thursday as Official Weekend (Thursday & Friday)",
    toggleThursdayWeekendHint: "When enabled, Thursday is treated as an official day off alongside Friday across all visits, daily activities, and leave balances. If disabled, only Friday is the statutory rest day.",
    saveCompanyPolicies: "Save Company Policies",
    companyPoliciesSaved: "Company field policies updated successfully!",
    companyBrandingTitle: "Company Branding & Login Customization",
    companyBrandingDesc: "Customize the right-hand panel of the login screen with your company logo, slogan, description, and brand colors.",
    companyLogoLabel: "Company Brand Logo (Login Showcase)",
    uploadLogo: "Upload Logo",
    resetDefault: "Reset Default",
    logoConstraintHint: "PNG, JPG, or SVG. Auto-scaled & optimized to fit perfectly within standard 96x96 box without distortion.",
    taglineEnLabel: "Slogan / Tagline (English)",
    taglineArLabel: "Slogan / Tagline (Arabic)",
    descEnLabel: "Description (English)",
    descArLabel: "Description (Arabic)",
    bannerThemeLabel: "Login Panel Theme Color & Gradient",
    saveBrandingSettings: "Save Branding Settings",
    brandingSettingsSaved: "Company branding & login appearance saved successfully!",
  },
  ar: {
    upload_photo: "رفع صورة",
    role_rep: "مندوب طبي",
    personal_info: "المعلومات الشخصية",
    full_name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    employee_code: "رمز الموظف",
    hire_date: "تاريخ التعيين",
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
    managed_by_admin_hint: "البيانات الشخصية والوظيفية الرسمية يتم تعديلها فقط من قِبل إدارة النظام أو الموارد البشرية.",
    manage_users_link: "إدارة بيانات الموظفين في شاشة المستخدمين",
    photo_updated: "تم تحديث الصورة الشخصية بنجاح!",
    companyGovernanceTitle: "إعدادات وسياسات الشركة الميدانية",
    adminExclusive: "خاص بالإدارة العامة",
    companyGovernanceDesc: "تهيئة السياسات التنظيمية الملزمة لكافة المناديب والمشرفين والمديرين في الميدان.",
    toggleGpsLabel: "إلزام التحقق الجغرافي بالـ GPS للزيارات الميدانية",
    toggleGpsHint: "عند التفعيل، يتم فحص تواجد المندوب داخل نطاق العيادة/المستشفى (200 متر). وفي حال تعطيل المندوب للـ GPS يتم تسجيل شارة تدقيق للمدير.",
    gpsRadiusLabel: "نصف قطر نطاق العيادة المسموح به (بالأمتار)",
    minPmVisitsLabel: "الحد الأدنى لزيارات العيادات المسائية (PM Visits)",
    minPmVisitsHint: "الحد الأدنى الإلزامي لعدد زيارات العيادات خلال الفترة المسائية يومياً لكل مندوب طبي.",
    workSchedulePolicyTitle: "مواعيد العمل والعطلات الأسبوعية الرسمية",
    toggleThursdayWeekendLabel: "اعتماد يوم الخميس عطلة أسبوعية رسمية (خميس وجمعة)",
    toggleThursdayWeekendHint: "عند التفعيل، يُعتبر يوم الخميس راحة أسبوعية رسمية إلى جانب الجمعة في تقارير الزيارات وجداول الأنشطة ورصيد الإجازات. في حال التعطيل، يكون يوم الجمعة فقط هو العطلة الرسمية.",
    saveCompanyPolicies: "حفظ سياسات الشركة",
    companyPoliciesSaved: "تم حفظ وتطبيق سياسات الشركة بنجاح على جميع المستخدمين!",
    companyBrandingTitle: "تخصيص هوية الشركة وشاشة الدخول",
    companyBrandingDesc: "تخصيص اللوحة الجانبية لشاشة تسجيل الدخول بشعار الشركة، الشعار اللفظي (السلوجان)، الوصف، وألوان الهوية.",
    companyLogoLabel: "شعار الشركة (اللوجو المعروض بشاشة الدخول)",
    uploadLogo: "رفع شعار جديد",
    resetDefault: "استعادة الافتراضي",
    logoConstraintHint: "صيغ PNG أو JPG أو SVG. يتم ضبط الحجم والمقاسات تلقائياً ليناسب المربع الموحد 96×96 بدون أي تشويه.",
    taglineEnLabel: "الشعار اللفظي / السلوجان (بالإنجليزي)",
    taglineArLabel: "الشعار اللفظي / السلوجان (بالعربي)",
    descEnLabel: "الوصف التفصيلي (بالإنجليزي)",
    descArLabel: "الوصف التفصيلي (بالعربي)",
    bannerThemeLabel: "لون وتدرج لوحة الدخول (Brand Theme)",
    saveBrandingSettings: "حفظ إعدادات الهوية",
    brandingSettingsSaved: "تم حفظ وتطبيق هوية الشركة وشاشة تسجيل الدخول بنجاح!",
  },
};

async function hashPassword(str) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return "fallback_" + Math.abs(hash).toString(16);
}

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
        if (!file.type.startsWith("image/")) {
          const currentLang = (window.getCurrentLang && window.getCurrentLang()) || "en";
          const msg = currentLang === "ar" ? "يرجى اختيار ملف صورة صالح." : "Please select a valid image file.";
          if (typeof showToast === "function") showToast(msg, "warning");
          return;
        }

        const reader = new FileReader();
        reader.onload = function (ev) {
          const rawDataUrl = ev.target.result;
          const img = new Image();
          img.onload = function () {
            // Compress profile photo to max 400x400 pixels to stay well within localStorage quota (< 50KB)
            const maxDim = 400;
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const photoData = canvas.toDataURL("image/jpeg", 0.85);

            if (profileImagePreview) {
              profileImagePreview.src = photoData;
              profileImagePreview.style.display = "block";
            }
            if (profileInitials) profileInitials.style.display = "none";

            const currentUser = (window.checkAuth && window.checkAuth()) || (window.DEMO_DATA && window.DEMO_DATA.currentUser);
            if (currentUser) {
              try {
                localStorage.setItem("user_photo_" + (currentUser.id || currentUser.employeeCode || "current"), photoData);
              } catch (err) {
                console.warn("Could not save photo to localStorage:", err);
              }
            }

            const currentLang = (window.getCurrentLang && window.getCurrentLang()) || "en";
            const msg = (window.translations && window.translations[currentLang]?.photo_updated) ||
              (currentLang === "ar" ? "تم تحديث الصورة الشخصية بنجاح!" : "Profile photo updated successfully!");
            if (typeof showToast === "function") showToast(msg, "success");
          };
          img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document
    .getElementById("personalInfoForm")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
    });

  document.getElementById("preferencesForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const lang = document.getElementById("languageSelect").value;
    if (window.switchLanguage) {
      window.switchLanguage(lang);
    }
    if (typeof showToast === "function") showToast("Preferences saved successfully!", "success");
  });

  document.getElementById("passwordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const isAr = lang === "ar";
    const currentPass = document.getElementById("currentPassword")?.value || "";
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;

    if (newPass.length < 8) {
      const msg = isAr ? "يجب ألا تقل كلمة المرور عن 8 أحرف." : "Password must be at least 8 characters.";
      if (typeof showToast === "function") showToast(msg, "warning");
      return;
    }

    if (!/[A-Z]/.test(newPass)) {
      const msg = isAr ? "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل (A-Z)." : "Password must contain at least one uppercase letter (A-Z).";
      if (typeof showToast === "function") showToast(msg, "warning");
      return;
    }

    if (!/[0-9]/.test(newPass)) {
      const msg = isAr ? "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل (0-9)." : "Password must contain at least one number (0-9).";
      if (typeof showToast === "function") showToast(msg, "warning");
      return;
    }

    if (newPass !== confirmPass) {
      const msg = isAr ? "كلمة المرور وتأكيدها غير متطابقين." : "New password and confirmation do not match.";
      if (typeof showToast === "function") showToast(msg, "error");
      return;
    }

    const currentUser = (window.checkAuth && window.checkAuth());
    if (currentUser && window.store && window.store.users) {
      const userObj = window.store.users.getById(currentUser.id);
      if (userObj) {
        if (currentPass && userObj.passwordHash) {
          const checkHash = await hashPassword(currentPass);
          if (checkHash !== userObj.passwordHash && (!userObj.password || userObj.password !== currentPass)) {
            const msg = isAr ? "كلمة المرور الحالية غير صحيحة." : "Current password is incorrect.";
            if (typeof showToast === "function") showToast(msg, "error");
            return;
          }
        }
        userObj.passwordHash = await hashPassword(newPass);
        if (userObj.password) userObj.password = newPass;
        window.store.users.save(userObj);

        try {
          const sessionUser = JSON.parse(sessionStorage.getItem("pharmaUser") || "{}");
          if (sessionUser && sessionUser.id === userObj.id) {
            sessionUser.passwordHash = userObj.passwordHash;
            sessionStorage.setItem("pharmaUser", JSON.stringify(sessionUser));
          }
        } catch (err) {}
      }
    }

    const successMsg = isAr ? "تم تحديث كلمة المرور بنجاح!" : "Password updated successfully!";
    if (typeof showToast === "function") showToast(successMsg, "success");
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
 * Computes employee rollover balance dynamically from previous year based on companySettings.
 */
function getEmployeeLeaveRollover(userId, targetYear) {
  if (typeof window.getEmployeeLeaveRollover === "function" && window.getEmployeeLeaveRollover !== getEmployeeLeaveRollover) {
    return window.getEmployeeLeaveRollover(userId, targetYear);
  }
  const companySettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};

  if (companySettings.allowLeaveRollover === false) {
    return {
      initialCarriedOver: 0,
      consumedFromRollover: 0,
      remainingRollover: 0,
      carriedOver: 0,
      isValid: false,
      isExpired: false,
      expiryDate: null,
      maxCap: 0,
      graceMonths: 0,
      consumedFromNewAnnual: 0,
    };
  }

  const allUsers = (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users))
    ? window.DEMO_DATA.users
    : [];
  const userObj = allUsers.find((u) => u.id === userId) || {};
  const userBalance = userObj.leaveBalance || {};
  const annualTotal = userBalance.annual !== undefined ? Number(userBalance.annual) : 21;

  const currentYear = targetYear || (window.getSystemDate ? window.getSystemDate() : new Date()).getFullYear();
  const prevYearStr = String(currentYear - 1);
  const currentYearStr = String(currentYear);
  const todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || (new Date()).toISOString().slice(0, 10);

  const allLeaves = (window.store && window.store.leaves
    ? window.store.leaves.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

  let prevYearUsed = 0;
  allLeaves.forEach((l) => {
    if (l.userId === userId && l.status === "approved" && l.type === "annual" && l.startDate && l.startDate.startsWith(prevYearStr)) {
      prevYearUsed += (parseFloat(l.days) || 1);
    }
  });

  const leftover = Math.max(0, annualTotal - prevYearUsed);
  const maxCap = companySettings.leaveRolloverMaxDays !== undefined ? Number(companySettings.leaveRolloverMaxDays) : 5;
  const initialCarriedOver = maxCap > 0 ? Math.min(leftover, maxCap) : leftover;

  const graceMonths = Number(companySettings.leaveRolloverGraceMonths) || 3;
  let expiryDate = `${currentYear}-03-31`;
  if (graceMonths === 1) expiryDate = `${currentYear}-01-31`;
  else if (graceMonths === 3) expiryDate = `${currentYear}-03-31`;
  else if (graceMonths === 6) expiryDate = `${currentYear}-06-30`;
  else if (graceMonths === 12) expiryDate = `${currentYear}-12-31`;

  let gracePeriodApprovedTaken = 0;
  let postGraceApprovedTaken = 0;
  allLeaves.forEach((l) => {
    if (l.userId === userId && l.status === "approved" && l.type === "annual" && l.startDate && l.startDate.startsWith(currentYearStr)) {
      const days = parseFloat(l.days) || 1;
      if (l.startDate <= expiryDate) {
        gracePeriodApprovedTaken += days;
      } else {
        postGraceApprovedTaken += days;
      }
    }
  });

  const consumedFromRollover = Math.min(initialCarriedOver, gracePeriodApprovedTaken);
  const remainingRollover = Math.max(0, initialCarriedOver - consumedFromRollover);
  const consumedFromNewAnnual = Math.max(0, gracePeriodApprovedTaken - initialCarriedOver) + postGraceApprovedTaken;

  const isValid = initialCarriedOver > 0 && todayStr <= expiryDate;
  const isExpired = remainingRollover > 0 && todayStr > expiryDate;

  return {
    initialCarriedOver,
    consumedFromRollover,
    remainingRollover,
    carriedOver: remainingRollover,
    isValid,
    isExpired,
    expiryDate,
    maxCap,
    graceMonths,
    consumedFromNewAnnual,
  };
}

if (!window.getEmployeeLeaveRollover) {
  window.getEmployeeLeaveRollover = getEmployeeLeaveRollover;
}

/**
 * Loads dynamic profile data and computes leave balances programmatically.
 */
function loadUserProfile() {
  const user = (window.requireAuth ? window.requireAuth() : (window.checkAuth && window.checkAuth())) || {};
  if (!user || !user.id) return;

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
  const hireDateInput = document.getElementById("hireDateInput");
  const productLineInput = document.getElementById("productLineInput");
  const managerInput = document.getElementById("managerInput");
  const profileInitials = document.getElementById("profileInitials");

  if (profileNameDisplay) profileNameDisplay.textContent = displayName;
  if (fullName) fullName.value = displayName;
  if (email) email.value = user.email || `${user.id}@pharmacare.com`;
  if (phone) phone.value = user.phone || "+201001234567";
  if (empCodeInput) empCodeInput.value = user.employeeCode || user.code || "EMP-001";
  if (hireDateInput) hireDateInput.value = user.hireDate || "2024-01-15";

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

  const profileImagePreview = document.getElementById("profileImagePreview");
  const storedPhoto = localStorage.getItem("user_photo_" + (user.id || user.employeeCode || "current"));
  if (storedPhoto && profileImagePreview) {
    profileImagePreview.src = storedPhoto;
    profileImagePreview.style.display = "block";
    if (profileInitials) profileInitials.style.display = "none";
  }

  const adminShortcut = document.getElementById("adminManageUsersShortcut");
  if (adminShortcut) {
    adminShortcut.style.display = (user.role === "admin") ? "block" : "none";
  }

  // Dynamic leave balances calculation synchronized with store leaves & rollover policy
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
  const rollover = getEmployeeLeaveRollover(user.id);
  const isWithinGrace = rollover && rollover.isValid;
  const baseAnnual = userBalance.annual !== undefined ? Number(userBalance.annual) : 21;
  const activeAnnualTotal = isWithinGrace ? (baseAnnual + rollover.initialCarriedOver) : baseAnnual;

  // After grace period ends, days consumed from rollover are not charged against new annual quota
  if (rollover && !isWithinGrace && rollover.initialCarriedOver > 0) {
    used.annual = rollover.consumedFromNewAnnual;
  }

  const totals = {
    annual: activeAnnualTotal,
    sick: userBalance.sick !== undefined ? Number(userBalance.sick) : 7,
    emergency: userBalance.emergency !== undefined ? Number(userBalance.emergency) : (userBalance.casual !== undefined ? Number(userBalance.casual) : 6),
    unpaid: userBalance.unpaid || 0
  };
  const daysSuffix = lang === "ar" ? "أيام" : "Days";

  const updateLeaveEl = (textId, progId, usedVal, totalVal, badgeHtml = "") => {
    const textEl = document.getElementById(textId);
    const progEl = document.getElementById(progId);
    if (textEl) {
      textEl.innerHTML = `${usedVal} / ${totalVal} <span>${daysSuffix}</span>${badgeHtml}`;
    }
    if (progEl) {
      const pct = totalVal > 0 ? Math.min(100, Math.round((usedVal / totalVal) * 100)) : 0;
      progEl.style.width = `${pct}%`;
    }
  };

  const rolloverBadge = (rollover && isWithinGrace && rollover.initialCarriedOver > 0)
    ? ` <span class="badge bg-success-subtle text-success border ms-1" style="font-size:0.75rem; vertical-align:middle;">+${rollover.carriedOver} ${lang === "ar" ? "مرحل" : "Rollover"}</span>`
    : "";

  updateLeaveEl("annualLeaveText", "annualLeaveProgress", used.annual, totals.annual, rolloverBadge);
  updateLeaveEl("sickLeaveText", "sickLeaveProgress", used.sick, totals.sick);
  updateLeaveEl("emergencyLeaveText", "emergencyLeaveProgress", used.emergency, totals.emergency);

  const unpaidText = document.getElementById("unpaidLeaveText");
  const unpaidProg = document.getElementById("unpaidLeaveProgress");
  if (unpaidText) unpaidText.innerHTML = `${used.unpaid} <span>${daysSuffix}</span>`;
  if (unpaidProg) unpaidProg.style.width = used.unpaid > 0 ? "100%" : "0%";

  const adminCompanyCard = document.getElementById("adminCompanySettingsCard");
  if (adminCompanyCard) {
    const isUserAdmin = typeof window.isAdmin === "function" ? window.isAdmin(user) : (user && String(user.role).toLowerCase() === "admin");
    if (isUserAdmin) {
      adminCompanyCard.style.display = "block";
      const currentSettings = (window.store && window.store.companySettings)
        ? window.store.companySettings.get()
        : { requireGpsValidation: true, gpsMaxDistanceMeters: 200, minPmVisitsPerDay: 4 };

      const toggleInput = document.getElementById("toggleGpsValidation");
      const radiusInput = document.getElementById("gpsMaxRadiusInput");
      const minPmInput = document.getElementById("minPmVisitsInput");
      const rolloverToggle = document.getElementById("toggleLeaveRollover");
      const rolloverGrace = document.getElementById("leaveRolloverGraceSelect");
      const rolloverMax = document.getElementById("leaveRolloverMaxDaysInput");
      const rolloverOpts = document.getElementById("leaveRolloverOptionsContainer");
      const thursdayToggle = document.getElementById("toggleThursdayWeekend");

      const backlogSelect = document.getElementById("visitBacklogLimitSelect");
      const expirySelect = document.getElementById("plannedVisitExpirySelect");

      if (toggleInput) toggleInput.checked = !!currentSettings.requireGpsValidation;
      if (radiusInput) radiusInput.value = currentSettings.gpsMaxDistanceMeters || 200;
      if (minPmInput) minPmInput.value = currentSettings.minPmVisitsPerDay || 4;
      if (thursdayToggle) thursdayToggle.checked = !!currentSettings.isThursdayWeekend;
      if (backlogSelect) backlogSelect.value = String(currentSettings.visitBacklogLimitDays !== undefined ? currentSettings.visitBacklogLimitDays : 2);
      if (expirySelect) expirySelect.value = String(currentSettings.plannedVisitExpiryDays !== undefined ? currentSettings.plannedVisitExpiryDays : 7);

      const allowRollover = currentSettings.allowLeaveRollover !== false;
      if (rolloverToggle) rolloverToggle.checked = allowRollover;
      if (rolloverGrace) rolloverGrace.value = String(currentSettings.leaveRolloverGraceMonths || 3);
      if (rolloverMax) rolloverMax.value = currentSettings.leaveRolloverMaxDays !== undefined ? currentSettings.leaveRolloverMaxDays : 5;
      if (rolloverOpts) rolloverOpts.style.display = allowRollover ? "block" : "none";
    } else {
      adminCompanyCard.style.display = "none";
    }
  }

  const adminBrandingCard = document.getElementById("adminBrandingCard");
  if (adminBrandingCard) {
    const isUserAdmin = typeof window.isAdmin === "function" ? window.isAdmin(user) : (user && String(user.role).toLowerCase() === "admin");
    if (isUserAdmin) {
      adminBrandingCard.style.display = "block";
      const currentSettings = (window.store && window.store.companySettings)
        ? window.store.companySettings.get()
        : {};
      const branding = currentSettings.branding || {
        logoUrl: "images/pharma-icon-192.png",
        taglineEn: "Empowering Medical Representatives",
        taglineAr: "نمكّن المناديب الطبيين",
        descEn: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
        descAr: "قم بتبسيط سير عملك وإدارة علاقاتك وتعزيز الأداء مع حل إدارة علاقات العملاء الشامل لدينا.",
        gradient: "linear-gradient(135deg, #0d6efd 0%, #4dabf7 100%)"
      };

      currentBrandLogoData = branding.logoUrl || "images/pharma-icon-192.png";
      const previewEl = document.getElementById("brandLogoPreview");
      if (previewEl) previewEl.src = currentBrandLogoData;

      const previewBox = document.getElementById("brandLogoPreviewContainer");
      if (previewBox && branding.gradient) previewBox.style.background = branding.gradient;

      const taglineEn = document.getElementById("brandTaglineEn");
      const taglineAr = document.getElementById("brandTaglineAr");
      const descEn = document.getElementById("brandDescEn");
      const descAr = document.getElementById("brandDescAr");
      const gradInput = document.getElementById("brandGradientValue");

      if (taglineEn) taglineEn.value = branding.taglineEn || "";
      if (taglineAr) taglineAr.value = branding.taglineAr || "";
      if (descEn) descEn.value = branding.descEn || "";
      if (descAr) descAr.value = branding.descAr || "";
      if (gradInput) gradInput.value = branding.gradient || "linear-gradient(135deg, #0d6efd 0%, #4dabf7 100%)";

      document.querySelectorAll(".gradient-preset-btn").forEach((btn) => {
        if (btn.getAttribute("data-gradient") === branding.gradient) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    } else {
      adminBrandingCard.style.display = "none";
    }
  }
}

window.onToggleLeaveRolloverChange = function() {
  const toggle = document.getElementById("toggleLeaveRollover");
  const opts = document.getElementById("leaveRolloverOptionsContainer");
  if (toggle && opts) {
    opts.style.display = toggle.checked ? "block" : "none";
  }
};

function handleSaveCompanySettings(e) {
  if (e) e.preventDefault();
  const user = (window.checkAuth && window.checkAuth()) || {};
  const isUserAdmin = typeof window.isAdmin === "function" ? window.isAdmin(user) : (user && String(user.role).toLowerCase() === "admin");
  if (!isUserAdmin) {
    if (typeof showToast === "function") showToast("Access Denied: Admins only.", "error");
    return;
  }
  const toggleInput = document.getElementById("toggleGpsValidation");
  const radiusInput = document.getElementById("gpsMaxRadiusInput");
  const minPmInput = document.getElementById("minPmVisitsInput");
  const rolloverToggle = document.getElementById("toggleLeaveRollover");
  const rolloverGrace = document.getElementById("leaveRolloverGraceSelect");
  const rolloverMax = document.getElementById("leaveRolloverMaxDaysInput");
  const thursdayToggle = document.getElementById("toggleThursdayWeekend");
  const backlogSelect = document.getElementById("visitBacklogLimitSelect");
  const expirySelect = document.getElementById("plannedVisitExpirySelect");

  const requireGpsValidation = toggleInput ? toggleInput.checked : true;
  const gpsMaxDistanceMeters = radiusInput ? (parseInt(radiusInput.value, 10) || 200) : 200;
  const minPmVisitsPerDay = minPmInput ? (parseInt(minPmInput.value, 10) || 4) : 4;
  const allowLeaveRollover = rolloverToggle ? rolloverToggle.checked : true;
  const leaveRolloverGraceMonths = rolloverGrace ? (parseInt(rolloverGrace.value, 10) || 3) : 3;
  const leaveRolloverMaxDays = rolloverMax ? Math.max(0, parseInt(rolloverMax.value, 10) || 0) : 5;
  const isThursdayWeekend = thursdayToggle ? thursdayToggle.checked : false;
  const visitBacklogLimitDays = backlogSelect ? Math.max(0, parseInt(backlogSelect.value, 10) || 0) : 2;
  const plannedVisitExpiryDays = expirySelect ? Math.max(1, parseInt(expirySelect.value, 10) || 7) : 7;

  const rawPrev = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : (window.DEMO_DATA && window.DEMO_DATA.companySettings) || {};
  const prevSettings = JSON.parse(JSON.stringify(rawPrev));

  if (window.store && window.store.companySettings) {
    window.store.companySettings.update({
      requireGpsValidation,
      gpsMaxDistanceMeters,
      minPmVisitsPerDay,
      allowLeaveRollover,
      leaveRolloverGraceMonths,
      leaveRolloverMaxDays,
      isThursdayWeekend,
      visitBacklogLimitDays,
      plannedVisitExpiryDays,
    });
  }

  // Broadcast policy update notifications to all employees
  const allUsers = (window.store && window.store.users)
    ? window.store.users.getAll()
    : (window.DEMO_DATA && window.DEMO_DATA.users) || [];

  function broadcastPolicyNotification(notifData) {
    if (typeof window.addWorkflowNotification !== "function") return;
    allUsers.forEach((u) => {
      window.addWorkflowNotification({
        userId: u.id,
        type: "policy_update",
        ...notifData,
      });
    });
  }

  // 1. Visit Backlog Grace Period Change
  const prevBacklog = prevSettings.visitBacklogLimitDays !== undefined ? prevSettings.visitBacklogLimitDays : 2;
  if (prevBacklog !== visitBacklogLimitDays) {
    const backlogLabelsAr = {
      0: "نفس اليوم فقط (0 يوم)",
      1: "يوم واحد (24 ساعة)",
      2: "يومان (48 ساعة)",
      3: "3 أيام (72 ساعة)",
      5: "5 أيام عمل",
      7: "أسبوع كامل (7 أيام)",
      14: "أسبوعان (14 يوماً)",
      30: "شهر كامل (30 يوماً)",
    };
    const backlogLabelsEn = {
      0: "Same Day Only (0 Days)",
      1: "1 Day (24 Hours)",
      2: "2 Days (48 Hours)",
      3: "3 Days (72 Hours)",
      5: "5 Days (Working Week)",
      7: "7 Days (Full Week)",
      14: "14 Days (2 Weeks)",
      30: "30 Days (1 Month)",
    };
    const bAr = backlogLabelsAr[visitBacklogLimitDays] || `${visitBacklogLimitDays} يوم`;
    const bEn = backlogLabelsEn[visitBacklogLimitDays] || `${visitBacklogLimitDays} day(s)`;

    broadcastPolicyNotification({
      icon: "⏱️",
      badgeClass: "bg-warning",
      title: "تحديث سياسة تسجيل الزيارات",
      titleEn: "Visit Logging Limit Policy Update",
      message: `تنبيه: تم تعديل مهلة تسجيل الزيارات بأثر رجعي إلى: ${bAr}. لن يُسمح بتسجيل أو إتمام أي زيارة تتعدى هذه المهلة.`,
      messageEn: `Notice: Past visit logging grace period is now set to: ${bEn}. Visits beyond this window cannot be logged.`,
      link: "visits.html",
    });
  }

  // 2. Planned Visit Expiry Change
  const prevExpiry = prevSettings.plannedVisitExpiryDays !== undefined ? prevSettings.plannedVisitExpiryDays : 7;
  if (prevExpiry !== plannedVisitExpiryDays) {
    broadcastPolicyNotification({
      icon: "🗓️",
      badgeClass: "bg-info",
      title: "تحديث سياسة انتهاء الزيارات المخططة",
      titleEn: "Planned Visits Expiry Policy Update",
      message: `تنبيه: تم تعديل مدة انتهاء صلاحية الزيارات المخططة غير المنفذة إلى: ${plannedVisitExpiryDays} يوم.`,
      messageEn: `Notice: Unexecuted planned visits will automatically expire after ${plannedVisitExpiryDays} days.`,
      link: "visits.html",
    });
  }

  // 3. GPS Validation Change
  const prevGps = prevSettings.requireGpsValidation !== undefined ? !!prevSettings.requireGpsValidation : true;
  if (prevGps !== requireGpsValidation) {
    broadcastPolicyNotification({
      icon: "📍",
      badgeClass: requireGpsValidation ? "bg-primary" : "bg-warning",
      title: "تحديث سياسة التحقق الجغرافي (GPS)",
      titleEn: "GPS Location Policy Update",
      message: requireGpsValidation
        ? "تنبيه: تم تفعيل إلزامية التحقق من الموقع الجغرافي (GPS) عند تسجيل الزيارات الميدانية."
        : "تنبيه: تم تعطيل إلزامية التحقق من الموقع الجغرافي (GPS) عند تسجيل الزيارات مؤقتاً.",
      messageEn: requireGpsValidation
        ? "Notice: GPS geofence verification is now strictly required when recording field visits."
        : "Notice: Mandatory GPS verification has been temporarily relaxed.",
      link: "visits.html",
    });
  }

  // 4. Geofence Radius Change
  const prevRadius = prevSettings.gpsMaxDistanceMeters !== undefined ? prevSettings.gpsMaxDistanceMeters : 200;
  if (prevRadius !== gpsMaxDistanceMeters) {
    broadcastPolicyNotification({
      icon: "🎯",
      badgeClass: "bg-info",
      title: "تحديث نطاق التواجد الجغرافي (Geofence)",
      titleEn: "Geofence Radius Policy Update",
      message: `تنبيه: تم تعديل أقصى نطاق مسموح به لتسجيل الزيارات حول العيادة/المستشفى إلى: ${gpsMaxDistanceMeters} متر.`,
      messageEn: `Notice: Clinic geofence validation radius has been updated to: ${gpsMaxDistanceMeters} meters.`,
      link: "visits.html",
    });
  }

  // 5. Min PM Visits Target Change
  const prevMinPm = prevSettings.minPmVisitsPerDay !== undefined ? prevSettings.minPmVisitsPerDay : 4;
  if (prevMinPm !== minPmVisitsPerDay) {
    broadcastPolicyNotification({
      icon: "🩺",
      badgeClass: "bg-primary",
      title: "تحديث الحد الأدنى للزيارات المسائية",
      titleEn: "Daily PM Visits Target Policy Update",
      message: `تنبيه: تم تعديل الحد الأدنى المطلوب للزيارات المسائية اليومية إلى: ${minPmVisitsPerDay} زيارات/يوم.`,
      messageEn: `Notice: Daily minimum required evening clinic visits has been updated to: ${minPmVisitsPerDay} visits/day.`,
      link: "dashboard.html",
    });
  }

  // 6. Thursday Weekend Status Change
  const prevThursday = !!prevSettings.isThursdayWeekend;
  if (prevThursday !== isThursdayWeekend) {
    broadcastPolicyNotification({
      icon: "📅",
      badgeClass: "bg-info",
      title: "تحديث سياسة أيام العمل والعطلات",
      titleEn: "Work Schedule Policy Update",
      message: isThursdayWeekend
        ? "تنبيه: تم اعتماد يوم الخميس عطلة أسبوعية رسمية للشركة (الخميس والجمعة)."
        : "تنبيه: تم إلغاء عطلة يوم الخميس واعتباره يوم عمل رسمي للشركة.",
      messageEn: isThursdayWeekend
        ? "Notice: Thursday has been officially designated as a weekly day off (Thursday & Friday)."
        : "Notice: Thursday is now designated as an official working day.",
      link: "profile.html",
    });
  }

  // 7. Leave Rollover Policy Change
  const prevRollover = prevSettings.allowLeaveRollover !== undefined ? !!prevSettings.allowLeaveRollover : true;
  const prevMaxDays = prevSettings.leaveRolloverMaxDays !== undefined ? prevSettings.leaveRolloverMaxDays : 5;
  if (prevRollover !== allowLeaveRollover || (allowLeaveRollover && prevMaxDays !== leaveRolloverMaxDays)) {
    broadcastPolicyNotification({
      icon: "🏖️",
      badgeClass: "bg-info",
      title: "تحديث سياسة ترحيل رصيد الإجازات",
      titleEn: "Leave Balance Rollover Policy Update",
      message: allowLeaveRollover
        ? `تنبيه: تم تفعيل ترحيل رصيد الإجازات السنوية بحد أقصى ${leaveRolloverMaxDays} يوم.`
        : "تنبيه: تم إلغاء ترحيل رصيد الإجازات السنوية للعام القادم.",
      messageEn: allowLeaveRollover
        ? `Notice: Annual leave rollover is enabled up to ${leaveRolloverMaxDays} days.`
        : "Notice: Annual leave balance rollover to next year has been disabled.",
      link: "leaves.html",
    });
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = profileTranslations[lang] || profileTranslations.en;
  const msg = t.companyPoliciesSaved || "Company field policies updated successfully!";

  if (typeof showToast === "function") {
    showToast(msg, "success");
  } else {
    alert(msg);
  }
}

window.handleSaveCompanySettings = handleSaveCompanySettings;

let currentBrandLogoData = null;

function handleBrandLogoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const msg = lang === "ar" ? "يرجى اختيار ملف صورة صالح (PNG, JPG, SVG)." : "Please select a valid image file (PNG, JPG, SVG).";
    if (typeof showToast === "function") showToast(msg, "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 256;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const optimizedBase64 = canvas.toDataURL("image/png");
      currentBrandLogoData = optimizedBase64;

      const previewEl = document.getElementById("brandLogoPreview");
      if (previewEl) previewEl.src = optimizedBase64;

      const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
      const msg = lang === "ar" ? "تم ضبط وتصغير الشعار تلقائياً بنجاح!" : "Logo auto-scaled and optimized successfully!";
      if (typeof showToast === "function") showToast(msg, "info");
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

function resetBrandLogoToDefault() {
  currentBrandLogoData = "images/pharma-icon-192.png";
  const previewEl = document.getElementById("brandLogoPreview");
  if (previewEl) previewEl.src = currentBrandLogoData;
  const fileInput = document.getElementById("brandLogoFileInput");
  if (fileInput) fileInput.value = "";
}

function selectGradientPreset(btn) {
  document.querySelectorAll(".gradient-preset-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const grad = btn.getAttribute("data-gradient");
  const hiddenInput = document.getElementById("brandGradientValue");
  if (hiddenInput) hiddenInput.value = grad;

  const previewBox = document.getElementById("brandLogoPreviewContainer");
  if (previewBox) previewBox.style.background = grad;
}

function handleSaveBrandingSettings(e) {
  if (e) e.preventDefault();
  const user = (window.checkAuth && window.checkAuth()) || {};
  const isUserAdmin = typeof window.isAdmin === "function" ? window.isAdmin(user) : (user && String(user.role).toLowerCase() === "admin");
  if (!isUserAdmin) {
    if (typeof showToast === "function") showToast("Access Denied: Admins only.", "error");
    return;
  }

  const taglineEn = (document.getElementById("brandTaglineEn")?.value || "").trim();
  const taglineAr = (document.getElementById("brandTaglineAr")?.value || "").trim();
  const descEn = (document.getElementById("brandDescEn")?.value || "").trim();
  const descAr = (document.getElementById("brandDescAr")?.value || "").trim();
  const gradient = document.getElementById("brandGradientValue")?.value || "linear-gradient(135deg, #0d6efd 0%, #4dabf7 100%)";

  const brandingObj = {
    logoUrl: currentBrandLogoData || "images/pharma-icon-192.png",
    taglineEn: taglineEn || "Empowering Medical Representatives",
    taglineAr: taglineAr || "نمكّن المناديب الطبيين",
    descEn: descEn || "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
    descAr: descAr || "قم بتبسيط سير عملك وإدارة علاقاتك وتعزيز الأداء مع حل إدارة علاقات العملاء الشامل لدينا.",
    gradient: gradient
  };

  if (window.store && window.store.companySettings) {
    const updatedSettings = window.store.companySettings.update({
      branding: brandingObj
    });
    try {
      localStorage.setItem("pharma_company_settings", JSON.stringify(updatedSettings));
    } catch (e) {}
  }

  if (typeof window.pushLocalToCloud === "function") {
    window.pushLocalToCloud(true);
  }
  if (typeof window.applyBrandSettings === "function") {
    try { window.applyBrandSettings(); } catch (e) {}
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = profileTranslations[lang] || profileTranslations.en;
  const msg = t.brandingSettingsSaved || "Company branding & login appearance saved successfully!";

  if (typeof showToast === "function") {
    showToast(msg, "success");
  } else {
    alert(msg);
  }
}

window.handleBrandLogoUpload = handleBrandLogoUpload;
window.resetBrandLogoToDefault = resetBrandLogoToDefault;
window.selectGradientPreset = selectGradientPreset;
window.handleSaveBrandingSettings = handleSaveBrandingSettings;