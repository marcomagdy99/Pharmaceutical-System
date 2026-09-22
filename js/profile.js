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
    saveCompanyPolicies: "Save Company Policies",
    companyPoliciesSaved: "Company field policies updated successfully!",
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
    saveCompanyPolicies: "حفظ سياسات الشركة",
    companyPoliciesSaved: "تم حفظ وتطبيق سياسات الشركة بنجاح على جميع المستخدمين!",
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

    if (newPass.length < 6) {
      const msg = isAr ? "يجب ألا تقل كلمة المرور عن 6 أحرف." : "Password must be at least 6 characters.";
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

      if (toggleInput) toggleInput.checked = !!currentSettings.requireGpsValidation;
      if (radiusInput) radiusInput.value = currentSettings.gpsMaxDistanceMeters || 200;
      if (minPmInput) minPmInput.value = currentSettings.minPmVisitsPerDay || 4;

      const allowRollover = currentSettings.allowLeaveRollover !== false;
      if (rolloverToggle) rolloverToggle.checked = allowRollover;
      if (rolloverGrace) rolloverGrace.value = String(currentSettings.leaveRolloverGraceMonths || 3);
      if (rolloverMax) rolloverMax.value = currentSettings.leaveRolloverMaxDays !== undefined ? currentSettings.leaveRolloverMaxDays : 5;
      if (rolloverOpts) rolloverOpts.style.display = allowRollover ? "block" : "none";
    } else {
      adminCompanyCard.style.display = "none";
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

  const requireGpsValidation = toggleInput ? toggleInput.checked : true;
  const gpsMaxDistanceMeters = radiusInput ? (parseInt(radiusInput.value, 10) || 200) : 200;
  const minPmVisitsPerDay = minPmInput ? (parseInt(minPmInput.value, 10) || 4) : 4;
  const allowLeaveRollover = rolloverToggle ? rolloverToggle.checked : true;
  const leaveRolloverGraceMonths = rolloverGrace ? (parseInt(rolloverGrace.value, 10) || 3) : 3;
  const leaveRolloverMaxDays = rolloverMax ? Math.max(0, parseInt(rolloverMax.value, 10) || 0) : 5;

  if (window.store && window.store.companySettings) {
    window.store.companySettings.update({
      requireGpsValidation,
      gpsMaxDistanceMeters,
      minPmVisitsPerDay,
      allowLeaveRollover,
      leaveRolloverGraceMonths,
      leaveRolloverMaxDays,
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