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
    secondaryWeekendDayLabel: "Secondary Rest Day (Alongside Friday)",
    secondaryWeekendDayHint: "Friday is statutory rest day. Choose additional day off if applicable.",
    secondaryWeekendModeLabel: "Rest Day Coverage Mode",
    secondaryWeekendModeHint: "Full Day: complete day off. PM Only: morning work allowed, evening clinic quota exempted.",
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
    taglineEnLabel: "Slogan / Tagline",
    descEnLabel: "Description",
    bannerThemeLabel: "Login Panel Theme Color & Gradient",
    saveBrandingSettings: "Save Branding Settings",
    brandingSettingsSaved: "Company branding & login appearance saved successfully!",
    approvalSequenceTitle: "Approval Sequence & Multi-Tier Workflows",
    approvalSequenceDesc: "Configure multi-tier authorization chains, manager escalations, and budget thresholds across operational modules.",
    wfCommTitle: "1. Commercial & Sales Services Workflow",
    wfMktTitle: "2. Marketing & Scientific Services Workflow",
    wfExpTitle: "3. Monthly Expense Claims Workflow",
    wfLeaveTitle: "4. Leaves & Vacations Workflow",
    wfPlansTitle: "5. Visit Plans Approval Workflow",
    wfRelocTitle: "6. Clinic GPS Relocation Workflow",
    btnSaveApprovalWorkflows: "Save Approval Sequence Workflows",
    approvalWorkflowsSaved: "Approval sequence workflows updated successfully!",
    sysMgmtTitle: "System Lifecycle & Data Management",
    sysMgmtDesc: "Manage system backups, database snapshots, and production launch transitions for organizational onboarding.",
    backupSectionTitle: "Database Snapshots & Disaster Recovery",
    backupSectionDesc: "Export a complete JSON archive of all catalog and operational data, or restore from a previous verified snapshot.",
    exportBackupBtn: "Export Full Database (JSON)",
    restoreBackupBtn: "Restore Database from Backup",
    goLiveCardTitle: "Official Production Launch (Go-Live)",
    goLiveCardDesc: "Transition the system from test/demo mode to real operational production. This will archive test records, prepare a clean slate for the company, and lock the system into active production mode.",
    launchProdBtn: "Launch Production",
    goLiveModalTitle: "Production Launch & Clean Slate",
    goLiveModalSubtitle: "Transition to Live Enterprise Environment",
    goLiveSafetyNotice: "Automatic Safety Net: A full backup JSON file of all current database records will be automatically downloaded to your computer before any data is cleared.",
    selectLaunchMode: "Select Launch Transition Mode:",
    optionKeepTitle: "Option A: Clear Test Records & Keep Company Setup (Recommended)",
    optionKeepDesc: "Use this if you already configured your real company employees, lines, products, and doctors, and want to wipe only test transactions before going live.",
    optionBlankTitle: "Option B: Complete Clean Slate for New Company (Blank Canvas)",
    optionBlankDesc: "Use this when delivering the software to a completely new client who wants to start from 0 records and upload their own rosters.",
    goLiveWarning: "Permanent Action: Once launched, this button will disappear forever and the system will remain in Active Production mode.",
    confirmLaunchBtn: "Confirm & Launch Production",
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
        if (!file.type.startsWith("image/")) {
          const msg = "Please select a valid image file.";
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
              "Profile photo updated successfully!";
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
    
    const currentPass = document.getElementById("currentPassword")?.value || "";
    const newPass = document.getElementById("newPassword").value;
    const confirmPass = document.getElementById("confirmPassword").value;

    if (newPass.length < 8) {
      const msg = "Password must be at least 8 characters.";
      if (typeof showToast === "function") showToast(msg, "warning");
      return;
    }

    if (!/[A-Z]/.test(newPass)) {
      const msg = "Password must contain at least one uppercase letter (A-Z).";
      if (typeof showToast === "function") showToast(msg, "warning");
      return;
    }

    if (!/[0-9]/.test(newPass)) {
      const msg = "Password must contain at least one number (0-9).";
      if (typeof showToast === "function") showToast(msg, "warning");
      return;
    }

    if (newPass !== confirmPass) {
      const msg = "New password and confirmation do not match.";
      if (typeof showToast === "function") showToast(msg, "error");
      return;
    }

    const currentUser = (window.checkAuth && window.checkAuth());
    if (currentUser && window.store && window.store.users) {
      const userObj = window.store.users.getById(currentUser.id);
      if (userObj) {
        if (currentPass && userObj.passwordHash) {
          const checkHash = await window.hashPassword(currentPass);
          if (checkHash !== userObj.passwordHash && (!userObj.password || userObj.password !== currentPass)) {
            const msg = "Current password is incorrect.";
            if (typeof showToast === "function") showToast(msg, "error");
            return;
          }
        }
        userObj.passwordHash = await window.hashPassword(newPass);
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

    const successMsg = "Password updated successfully!";
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
 * Computes employee rollover balance dynamically using centralized utility in app.js.
 * @param {string} userId - Employee ID.
 * @param {number} [targetYear] - Target year.
 * @returns {object} Rollover summary and balances.
 */
var getEmployeeLeaveRollover = (typeof window !== "undefined" && window.getEmployeeLeaveRollover) || function (userId, targetYear) {
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
  if (empCodeInput) empCodeInput.value = user.employeeCode || user.code || "REP-001";
  if (hireDateInput) hireDateInput.value = user.hireDate || "2024-01-15";

  const profileRoleBadge = document.getElementById("profileRoleBadge");
  const profileEmpBadge = document.getElementById("profileEmpBadge");
  const profileAreaBadge = document.getElementById("profileAreaBadge");

  if (profileEmpBadge) profileEmpBadge.textContent = user.employeeCode || user.code || "REP-001";

  const roleLabels = {
    medical_rep: "Medical Rep",
    district_manager: "District Manager",
    line_manager: "Line Manager",
    business_unit: "Business Unit Head",
    admin: "System Admin",
    hr: "HR Manager"
  };
  if (profileRoleBadge) {
    profileRoleBadge.textContent = user.title || roleLabels[user.role] || user.role;
  }

  const area = allAreas.find((a) => a.id === user.areaId || a.repId === user.id);
  if (profileAreaBadge) {
    profileAreaBadge.textContent = area ? `${area.name} (${area.code})` : "Headquarters";
  }

  const line = allLines.find((l) => l.id === user.lineId || (l.products && user.lineIds && user.lineIds.includes(l.id)));
  if (productLineInput) {
    productLineInput.value = line ? line.name : ("All Product Lines");
  }

  const freshUser = allUsers.find((u) => u.id === user.id) || user;
  const activeManagerId = freshUser.managerId || user.managerId;
  const manager = activeManagerId ? allUsers.find((u) => u.id === activeManagerId) : null;
  if (managerInput) {
    if (manager) {
      const managerRole = roleLabels[manager.role] || manager.title || manager.role || "";
      const managerLine = allLines.find((l) => l.id === manager.lineId || (l.products && manager.lineIds && manager.lineIds.includes(l.id)));
      const lineSuffix = managerLine ? ` - ${managerLine.name}` : "";
      const roleText = managerRole ? ` (${managerRole}${lineSuffix})` : "";
      managerInput.value = `${manager.name}${roleText}`;
    } else {
      managerInput.value = "Executive Management";
    }
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
  const currentYearStr = String(new Date().getFullYear());
  const approvedLeaves = allLeaves.filter((l) => {
    if (l.userId !== user.id || l.status !== "approved") return false;
    const leaveYear = l.startDate ? String(l.startDate).slice(0, 4) : "";
    return !leaveYear || leaveYear === currentYearStr;
  });
  const used = { annual: 0, sick: 0, emergency: 0, unpaid: 0 };
  approvedLeaves.forEach((l) => {
    const d = parseFloat(l.days) || 1;
    if (l.type === "annual") used.annual += d;
    else if (l.type === "sick") used.sick += d;
    else if (l.type === "emergency" || l.type === "casual") used.emergency += d;
    else if (l.type === "unpaid") used.unpaid += d;
  });

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
  const daysSuffix = "Days";

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
    ? ` <span class="badge bg-success-subtle text-success border ms-1" style="font-size:0.75rem; vertical-align:middle;">+${rollover.carriedOver} Rollover</span>`
    : "";

  updateLeaveEl("annualLeaveText", "annualLeaveProgress", used.annual, totals.annual, rolloverBadge);
  updateLeaveEl("sickLeaveText", "sickLeaveProgress", used.sick, totals.sick);
  updateLeaveEl("emergencyLeaveText", "emergencyLeaveProgress", used.emergency, totals.emergency);

  const unpaidText = document.getElementById("unpaidLeaveText");
  const unpaidProg = document.getElementById("unpaidLeaveProgress");
  if (unpaidText) unpaidText.innerHTML = `${used.unpaid} <span>${daysSuffix}</span>`;
  if (unpaidProg) unpaidProg.style.width = used.unpaid > 0 ? "100%" : "0%";

  const adminSysCard = document.getElementById("adminSystemManagementCard");
  if (adminSysCard) {
    const isUserAdmin = typeof window.isAdmin === "function" ? window.isAdmin(user) : (user && String(user.role).toLowerCase() === "admin");
    if (isUserAdmin) {
      adminSysCard.style.display = "block";
      renderSystemManagementCard();
    } else {
      adminSysCard.style.display = "none";
    }
  }

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

      const secondaryDaySelect = document.getElementById("secondaryWeekendDaySelect");
      const secondaryModeSelect = document.getElementById("secondaryWeekendModeSelect");
      const secondaryModeGroup = document.getElementById("secondaryWeekendModeGroup");

      if (toggleInput) toggleInput.checked = !!currentSettings.requireGpsValidation;
      if (radiusInput) radiusInput.value = currentSettings.gpsMaxDistanceMeters || 200;
      if (minPmInput) minPmInput.value = currentSettings.minPmVisitsPerDay || 4;

      // Weekend Policy: backwards compatibility with isThursdayWeekend
      let secDay = currentSettings.secondaryWeekendDay;
      if (!secDay) {
        secDay = currentSettings.isThursdayWeekend ? "thursday" : "none";
      }
      if (secondaryDaySelect) secondaryDaySelect.value = secDay;
      if (secondaryModeSelect) secondaryModeSelect.value = currentSettings.secondaryWeekendMode || "full_day";
      if (secondaryModeGroup) secondaryModeGroup.style.display = secDay === "none" ? "none" : "block";

      if (thursdayToggle) thursdayToggle.checked = secDay === "thursday";
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
        
        descEn: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
        
        gradient: "linear-gradient(135deg, #0d6efd 0%, #4dabf7 100%)"
      };

      currentBrandLogoData = branding.logoUrl || "images/pharma-icon-192.png";
      const previewEl = document.getElementById("brandLogoPreview");
      if (previewEl) previewEl.src = currentBrandLogoData;

      const previewBox = document.getElementById("brandLogoPreviewContainer");
      if (previewBox && branding.gradient) previewBox.style.background = branding.gradient;

      const taglineEn = document.getElementById("brandTaglineEn");
      const descEn = document.getElementById("brandDescEn");
      const gradInput = document.getElementById("brandGradientValue");

      if (taglineEn) taglineEn.value = branding.taglineEn || branding.taglineAr || "";
      if (descEn) descEn.value = branding.descEn || branding.descAr || "";
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

  const adminApprovalCard = document.getElementById("adminApprovalSequenceCard");
  if (adminApprovalCard) {
    const isUserAdmin = typeof window.isAdmin === "function" ? window.isAdmin(user) : (user && String(user.role).toLowerCase() === "admin");
    if (isUserAdmin) {
      adminApprovalCard.style.display = "block";
      loadApprovalWorkflows();
    } else {
      adminApprovalCard.style.display = "none";
    }
  }

  // Render Direct Reports & Supervisory Team section
  renderDirectReports(freshUser, allUsers, allAreas, allLines, roleLabels);
}

/**
 * Renders direct subordinates / team members for supervisory roles (DM, LM, BU, Admin, HR).
 */
function renderDirectReports(activeUser, allUsers, allAreas, allLines, roleLabels) {
  const card = document.getElementById("directReportsCard");
  const container = document.getElementById("directReportsContainer");
  const countBadge = document.getElementById("directReportsCountBadge");
  if (!card || !container) return;

  const esc = (s) => (window.escapeHtml ? window.escapeHtml(s) : String(s || ""));

  // Identify direct reports whose managerId matches the active user
  const directReports = allUsers.filter((u) => {
    if (!u || !u.id || u.id === activeUser.id) return false;
    if (u.status === "Inactive" || u.status === "inactive") return false;
    return u.managerId === activeUser.id;
  });

  if (!directReports.length) {
    card.style.display = "none";
    return;
  }

  card.style.display = "block";
  if (countBadge) {
    countBadge.textContent = `${directReports.length} ${directReports.length === 1 ? "Member" : "Members"}`;
  }

  container.innerHTML = directReports.map((rep) => {
    const repName = rep.name || "Team Member";
    const nameParts = repName.trim().split(/\s+/);
    let inits = nameParts[0] ? nameParts[0][0] : "U";
    if (nameParts.length > 1) inits += nameParts[nameParts.length - 1][0];
    inits = inits.toUpperCase();

    const roleName = roleLabels[rep.role] || rep.title || rep.role || "Representative";
    const area = allAreas.find((a) => a.id === rep.areaId || a.repId === rep.id);
    const areaName = area ? `${area.name} (${area.code})` : "Territory Unassigned";
    const line = allLines.find((l) => l.id === rep.lineId || (l.products && rep.lineIds && rep.lineIds.includes(l.id)));
    const lineName = line ? line.name : "All Lines";
    const code = rep.employeeCode || rep.code || "EMP";
    const phone = rep.phone || "";
    const email = rep.email || "";

    return `
      <div class="direct-report-card">
        <div class="direct-report-top">
          <div class="direct-report-avatar">${esc(inits)}</div>
          <div class="direct-report-info">
            <div class="direct-report-name" title="${esc(repName)}">${esc(repName)}</div>
            <div class="direct-report-meta">
              <span class="badge badge-role" style="font-size: 0.72rem; padding: 2px 7px;">${esc(roleName)}</span>
              <span class="badge bg-light text-dark border" style="font-size: 0.72rem; padding: 2px 7px;">${esc(code)}</span>
            </div>
          </div>
        </div>
        <div class="direct-report-details">
          <div class="direct-report-row">
            <span>Area:</span>
            <span style="font-weight: 500; text-align: right;">${esc(areaName)}</span>
          </div>
          <div class="direct-report-row">
            <span>Line:</span>
            <span style="font-weight: 500; text-align: right;">${esc(lineName)}</span>
          </div>
          ${phone ? `
            <div class="direct-report-row">
              <span>Phone:</span>
              <a href="tel:${esc(phone)}" class="direct-report-link">${esc(phone)}</a>
            </div>
          ` : ""}
          ${email ? `
            <div class="direct-report-row">
              <span>Email:</span>
              <a href="mailto:${esc(email)}" class="direct-report-link" title="${esc(email)}">${esc(email)}</a>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");
}

function loadApprovalWorkflows() {
  const workflows = (window.WorkflowEngine && typeof window.WorkflowEngine.getWorkflows === "function")
    ? window.WorkflowEngine.getWorkflows()
    : ((window.store && window.store.companySettings && window.store.companySettings.get().approvalWorkflows) || {});

  const comm = workflows.commercialServices || {};
  const mkt = workflows.marketingServices || {};
  const exp = workflows.expenses || {};
  const lvs = workflows.leaves || {};
  const pln = workflows.plans || {};
  const rel = workflows.relocation || {};

  // Commercial Services
  const wfCommDm = document.getElementById("wf_comm_dm");
  const wfCommLm = document.getElementById("wf_comm_lm");
  const wfCommBu = document.getElementById("wf_comm_bu");
  const wfCommThreshold = document.getElementById("wf_comm_bu_threshold");
  const wfCommSkip = document.getElementById("wf_comm_skip");

  if (wfCommDm) wfCommDm.checked = comm.requireDm !== false;
  if (wfCommLm) wfCommLm.checked = comm.requireLm !== false;
  if (wfCommBu) wfCommBu.checked = comm.requireBu !== false;
  if (wfCommThreshold) wfCommThreshold.value = comm.buThresholdAmount || 5000;
  if (wfCommSkip) wfCommSkip.checked = comm.autoSkipSubmitterRole !== false;

  const commMode = comm.buThresholdMode || "all";
  const commRadios = document.querySelectorAll('input[name="wf_comm_bu_mode"]');
  commRadios.forEach((r) => { r.checked = (r.value === commMode); });

  // Marketing Services
  const wfMktPm = document.getElementById("wf_mkt_pm");
  const wfMktDm = document.getElementById("wf_mkt_dm");
  const wfMktLm = document.getElementById("wf_mkt_lm");
  const wfMktBu = document.getElementById("wf_mkt_bu");
  const wfMktThreshold = document.getElementById("wf_mkt_bu_threshold");

  if (wfMktPm) wfMktPm.checked = mkt.requirePm !== false;
  if (wfMktDm) wfMktDm.checked = !!mkt.requireDm;
  if (wfMktLm) wfMktLm.checked = !!mkt.requireLm;
  if (wfMktBu) wfMktBu.checked = mkt.requireBu !== false;
  if (wfMktThreshold) wfMktThreshold.value = mkt.buThresholdAmount || 10000;

  const mktMode = mkt.buThresholdMode || "all";
  const mktRadios = document.querySelectorAll('input[name="wf_mkt_bu_mode"]');
  mktRadios.forEach((r) => { r.checked = (r.value === mktMode); });

  // Expenses
  const wfExpDm = document.getElementById("wf_exp_dm");
  const wfExpLm = document.getElementById("wf_exp_lm");
  const wfExpHr = document.getElementById("wf_exp_hr");
  const wfExpDisburse = document.getElementById("wf_exp_disburse");
  const wfExpBuEnabled = document.getElementById("wf_exp_bu_threshold_enabled");
  const wfExpThreshold = document.getElementById("wf_exp_bu_threshold");

  if (wfExpDm) wfExpDm.checked = exp.requireDm !== false;
  if (wfExpLm) wfExpLm.checked = exp.requireLm !== false;
  if (wfExpHr) wfExpHr.checked = exp.requireHr !== false;
  if (wfExpDisburse) wfExpDisburse.checked = exp.requireDisbursement !== false;
  if (wfExpBuEnabled) wfExpBuEnabled.checked = !!exp.requireBuThreshold;
  if (wfExpThreshold) wfExpThreshold.value = exp.buThresholdAmount || 10000;

  // Leaves
  const wfLeaveDm = document.getElementById("wf_leave_dm");
  const wfLeaveLm = document.getElementById("wf_leave_lm");
  const wfLeaveBu = document.getElementById("wf_leave_bu");
  const wfLeaveHr = document.getElementById("wf_leave_hr");

  if (wfLeaveDm) wfLeaveDm.checked = lvs.requireDm !== false;
  if (wfLeaveLm) wfLeaveLm.checked = lvs.requireLm !== false;
  if (wfLeaveBu) wfLeaveBu.checked = !!lvs.requireBu;
  if (wfLeaveHr) wfLeaveHr.checked = lvs.requireHr !== false;

  // Plans
  const wfPlanDm = document.getElementById("wf_plan_dm");
  const wfPlanLm = document.getElementById("wf_plan_lm");
  const wfPlanBu = document.getElementById("wf_plan_bu");

  if (wfPlanDm) wfPlanDm.checked = pln.requireDm !== false;
  if (wfPlanLm) wfPlanLm.checked = !!pln.requireLm;
  if (wfPlanBu) wfPlanBu.checked = !!pln.requireBu;

  // Relocation
  const wfRelocDm = document.getElementById("wf_reloc_dm");
  const wfRelocLm = document.getElementById("wf_reloc_lm");
  const wfRelocBu = document.getElementById("wf_reloc_bu");

  if (wfRelocDm) wfRelocDm.checked = rel.requireDm !== false;
  if (wfRelocLm) wfRelocLm.checked = !!rel.requireLm;
  if (wfRelocBu) wfRelocBu.checked = !!rel.requireBu;

  if (typeof window.toggleCommBuOptions === "function") window.toggleCommBuOptions();
  if (typeof window.onCommBuModeChange === "function") window.onCommBuModeChange();
  if (typeof window.toggleMktBuOptions === "function") window.toggleMktBuOptions();
  if (typeof window.onMktBuModeChange === "function") window.onMktBuModeChange();
  if (typeof window.toggleExpBuThreshold === "function") window.toggleExpBuThreshold();
}

window.loadApprovalWorkflows = loadApprovalWorkflows;

window.toggleCommBuOptions = function() {
  const chk = document.getElementById("wf_comm_bu");
  const container = document.getElementById("commBuOptionsContainer");
  if (container) container.style.display = (chk && chk.checked) ? "block" : "none";
};

window.onCommBuModeChange = function() {
  const checked = document.querySelector('input[name="wf_comm_bu_mode"]:checked');
  const wrap = document.getElementById("commBuThresholdWrap");
  if (wrap) wrap.style.display = (checked && checked.value === "threshold") ? "inline-flex" : "none";
};

window.toggleMktBuOptions = function() {
  const chk = document.getElementById("wf_mkt_bu");
  const container = document.getElementById("mktBuOptionsContainer");
  if (container) container.style.display = (chk && chk.checked) ? "block" : "none";
};

window.onMktBuModeChange = function() {
  const checked = document.querySelector('input[name="wf_mkt_bu_mode"]:checked');
  const wrap = document.getElementById("mktBuThresholdWrap");
  if (wrap) wrap.style.display = (checked && checked.value === "threshold") ? "inline-flex" : "none";
};

window.toggleExpBuThreshold = function() {
  const chk = document.getElementById("wf_exp_bu_threshold_enabled");
  const wrap = document.getElementById("expBuThresholdWrap");
  if (wrap) wrap.style.display = (chk && chk.checked) ? "inline-flex" : "none";
};

window.handleSaveApprovalWorkflows = function(e) {
  if (e) e.preventDefault();
  const user = (window.checkAuth && window.checkAuth()) || {};
  const isUserAdmin = typeof window.isAdmin === "function" ? window.isAdmin(user) : (user && String(user.role).toLowerCase() === "admin");
  if (!isUserAdmin) {
    if (typeof showToast === "function") showToast("Access Denied: Admins only.", "error");
    return;
  }

  const commBuModeRadio = document.querySelector('input[name="wf_comm_bu_mode"]:checked');
  const mktBuModeRadio = document.querySelector('input[name="wf_mkt_bu_mode"]:checked');

  const approvalWorkflows = {
    commercialServices: {
      requireDm: !!document.getElementById("wf_comm_dm")?.checked,
      requireLm: !!document.getElementById("wf_comm_lm")?.checked,
      requireBu: !!document.getElementById("wf_comm_bu")?.checked,
      buThresholdMode: commBuModeRadio ? commBuModeRadio.value : "all",
      buThresholdAmount: Math.max(0, parseInt(document.getElementById("wf_comm_bu_threshold")?.value, 10) || 5000),
      autoSkipSubmitterRole: !!document.getElementById("wf_comm_skip")?.checked,
    },
    marketingServices: {
      requirePm: !!document.getElementById("wf_mkt_pm")?.checked,
      requireDm: !!document.getElementById("wf_mkt_dm")?.checked,
      requireLm: !!document.getElementById("wf_mkt_lm")?.checked,
      requireBu: !!document.getElementById("wf_mkt_bu")?.checked,
      buThresholdMode: mktBuModeRadio ? mktBuModeRadio.value : "all",
      buThresholdAmount: Math.max(0, parseInt(document.getElementById("wf_mkt_bu_threshold")?.value, 10) || 10000),
      autoSkipSubmitterRole: true,
    },
    expenses: {
      requireDm: !!document.getElementById("wf_exp_dm")?.checked,
      requireLm: !!document.getElementById("wf_exp_lm")?.checked,
      requireHr: !!document.getElementById("wf_exp_hr")?.checked,
      requireDisbursement: !!document.getElementById("wf_exp_disburse")?.checked,
      requireBuThreshold: !!document.getElementById("wf_exp_bu_threshold_enabled")?.checked,
      buThresholdAmount: Math.max(0, parseInt(document.getElementById("wf_exp_bu_threshold")?.value, 10) || 10000),
      autoSkipSubmitterRole: true,
    },
    leaves: {
      requireDm: !!document.getElementById("wf_leave_dm")?.checked,
      requireLm: !!document.getElementById("wf_leave_lm")?.checked,
      requireBu: !!document.getElementById("wf_leave_bu")?.checked,
      requireHr: !!document.getElementById("wf_leave_hr")?.checked,
      autoSkipSubmitterRole: true,
    },
    plans: {
      requireDm: !!document.getElementById("wf_plan_dm")?.checked,
      requireLm: !!document.getElementById("wf_plan_lm")?.checked,
      requireBu: !!document.getElementById("wf_plan_bu")?.checked,
    },
    relocation: {
      requireDm: !!document.getElementById("wf_reloc_dm")?.checked,
      requireLm: !!document.getElementById("wf_reloc_lm")?.checked,
      requireBu: !!document.getElementById("wf_reloc_bu")?.checked,
    },
  };

  if (window.store && window.store.companySettings) {
    const updatedSettings = window.store.companySettings.update({
      approvalWorkflows: approvalWorkflows,
    });
    try {
      localStorage.setItem("pharma_company_settings", JSON.stringify(updatedSettings));
    } catch (err) {}
  }

  if (typeof window.pushLocalToCloud === "function") {
    window.pushLocalToCloud(true);
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = profileTranslations[lang] || profileTranslations.en;
  const msg = t.approvalWorkflowsSaved || "Approval sequence workflows updated successfully!";

  showToast(msg, "success");
};

window.onToggleLeaveRolloverChange = function() {
  const toggle = document.getElementById("toggleLeaveRollover");
  const opts = document.getElementById("leaveRolloverOptionsContainer");
  if (toggle && opts) {
    opts.style.display = toggle.checked ? "block" : "none";
  }
};

window.onSecondaryWeekendChange = function() {
  const daySelect = document.getElementById("secondaryWeekendDaySelect");
  const modeGroup = document.getElementById("secondaryWeekendModeGroup");
  if (daySelect && modeGroup) {
    modeGroup.style.display = daySelect.value === "none" ? "none" : "block";
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
  const secondaryDaySelect = document.getElementById("secondaryWeekendDaySelect");
  const secondaryModeSelect = document.getElementById("secondaryWeekendModeSelect");
  const backlogSelect = document.getElementById("visitBacklogLimitSelect");
  const expirySelect = document.getElementById("plannedVisitExpirySelect");

  const requireGpsValidation = toggleInput ? toggleInput.checked : true;
  const gpsMaxDistanceMeters = radiusInput ? (parseInt(radiusInput.value, 10) || 200) : 200;
  const minPmVisitsPerDay = minPmInput ? (parseInt(minPmInput.value, 10) || 4) : 4;
  const allowLeaveRollover = rolloverToggle ? rolloverToggle.checked : true;
  const leaveRolloverGraceMonths = rolloverGrace ? (parseInt(rolloverGrace.value, 10) || 3) : 3;
  const leaveRolloverMaxDays = rolloverMax ? Math.max(0, parseInt(rolloverMax.value, 10) || 0) : 5;

  const secondaryWeekendDay = secondaryDaySelect ? secondaryDaySelect.value : "saturday";
  const secondaryWeekendMode = secondaryModeSelect ? secondaryModeSelect.value : "full_day";
  const isThursdayWeekend = secondaryWeekendDay === "thursday";

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
      secondaryWeekendDay,
      secondaryWeekendMode,
      visitBacklogLimitDays,
      plannedVisitExpiryDays,
    });
  }

  // Broadcast policy update notifications to all employees
  function broadcastPolicyNotification(notifData) {
    if (typeof window.addWorkflowNotification !== "function") return;
    const userMap = new Map();
    const sourceUsers = (window.store && window.store.users)
      ? window.store.users.getAll()
      : (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    sourceUsers.forEach((u) => { if (u && u.id) userMap.set(u.id, u); });
    if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) {
      window.DEMO_DATA.users.forEach((u) => { if (u && u.id) userMap.set(u.id, u); });
    }
    userMap.forEach((u) => {
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
    const backlogLabelsAr = {};
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
    
    const bEn = backlogLabelsEn[visitBacklogLimitDays] || `${visitBacklogLimitDays} day(s)`;

    broadcastPolicyNotification({
      icon: "⏱️",
      badgeClass: "bg-warning",
      title: "Visit Logging Limit Policy Update",
      message: `Notice: Past visit logging grace period is now set to: ${bEn}. Visits beyond this window cannot be logged.`,
      link: "visits.html",
    });
  }

  // 2. Planned Visit Expiry Change
  const prevExpiry = prevSettings.plannedVisitExpiryDays !== undefined ? prevSettings.plannedVisitExpiryDays : 7;
  if (prevExpiry !== plannedVisitExpiryDays) {
    broadcastPolicyNotification({
      icon: "🗓️",
      badgeClass: "bg-info",
      title: "Planned Visits Expiry Policy Update",
      message: `Notice: Unexecuted planned visits will automatically expire after ${plannedVisitExpiryDays} days.`,
      link: "visits.html",
    });
  }

  // 3. GPS Validation Change (strictly on state change)
  const prevGps = prevSettings.requireGpsValidation !== undefined ? !!prevSettings.requireGpsValidation : true;
  if (prevGps !== requireGpsValidation) {
    broadcastPolicyNotification({
      icon: "📍",
      badgeClass: requireGpsValidation ? "bg-primary" : "bg-warning",
      title: "GPS Location Policy Update",
      message: requireGpsValidation
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
      title: "Geofence Radius Policy Update",
      message: `Notice: Clinic geofence validation radius has been updated to: ${gpsMaxDistanceMeters} meters.`,
      link: "visits.html",
    });
  }

  // 5. Min PM Visits Target Change
  const prevMinPm = prevSettings.minPmVisitsPerDay !== undefined ? prevSettings.minPmVisitsPerDay : 4;
  if (prevMinPm !== minPmVisitsPerDay) {
    broadcastPolicyNotification({
      icon: "🩺",
      badgeClass: "bg-primary",
      title: "Daily PM Visits Target Policy Update",
      message: `Notice: Daily minimum required evening clinic visits has been updated to: ${minPmVisitsPerDay} visits/day.`,
      link: "dashboard.html",
    });
  }

  // 6. Thursday Weekend Status Change
  const prevThursday = !!prevSettings.isThursdayWeekend;
  if (prevThursday !== isThursdayWeekend) {
    broadcastPolicyNotification({
      icon: "📅",
      badgeClass: "bg-info",
      title: "Work Schedule Policy Update",
      message: isThursdayWeekend
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
      title: "Leave Balance Rollover Policy Update",
      message: allowLeaveRollover
        ? `Notice: Annual leave rollover is enabled up to ${leaveRolloverMaxDays} days.`
        : "Notice: Annual leave balance rollover to next year has been disabled.",
      link: "leaves.html",
    });
  }

  const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
  const t = profileTranslations[lang] || profileTranslations.en;
  const msg = t.companyPoliciesSaved || "Company field policies updated successfully!";

  showToast(msg, "success");
}

window.handleSaveCompanySettings = handleSaveCompanySettings;

let currentBrandLogoData = null;

function handleBrandLogoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    const lang = (window.getCurrentLang && window.getCurrentLang()) || "en";
    const msg = "Please select a valid image file (PNG, JPG, SVG).";
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
      const msg = "Logo auto-scaled and optimized successfully!";
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

  const tagline = (document.getElementById("brandTaglineEn")?.value || "").trim();
  const desc = (document.getElementById("brandDescEn")?.value || "").trim();
  const gradient = document.getElementById("brandGradientValue")?.value || "linear-gradient(135deg, #0d6efd 0%, #4dabf7 100%)";

  const brandingObj = {
    logoUrl: currentBrandLogoData || "images/pharma-icon-192.png",
    taglineEn: tagline || "Empowering Medical Representatives",
    taglineAr: tagline || "Empowering Medical Representatives",
    descEn: desc || "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
    descAr: desc || "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
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

  showToast(msg, "success");
}

window.handleBrandLogoUpload = handleBrandLogoUpload;
window.resetBrandLogoToDefault = resetBrandLogoToDefault;
window.selectGradientPreset = selectGradientPreset;
window.handleSaveBrandingSettings = handleSaveBrandingSettings;

// =============================================================================
// System Lifecycle & Data Management Engine (Go-Live & Backup/Restore)
// =============================================================================

function renderSystemManagementCard() {
  const bannerEl = document.getElementById("systemStatusBanner");
  const launchSectionEl = document.getElementById("goLiveLaunchSection");
  if (!bannerEl) return;

  const currentSettings = (window.store && window.store.companySettings)
    ? window.store.companySettings.get()
    : ((window.DEMO_DATA && window.DEMO_DATA.companySettings) || {});

  const isLaunched = Boolean(currentSettings.isProductionLaunched);
  const launchDate = currentSettings.productionLaunchDate
    ? new Date(currentSettings.productionLaunchDate).toLocaleDateString()
    : "";
  const isAr = (localStorage.getItem("pharmaLang") || "en") === "ar";

  if (isLaunched) {
    bannerEl.className = "sys-mgmt-banner sys-mgmt-banner-prod";
    bannerEl.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <div class="sys-mgmt-icon-prod">
          🛡️
        </div>
        <div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <strong class="sys-mgmt-status-title-prod">Active Production Environment (Live)</strong>
            <span class="badge sys-mgmt-tag-prod">Official Live</span>
          </div>
          <small class="text-muted d-block mt-1">
            Officially launched on: <strong>${launchDate || "Active"}</strong> — Transactional resets are permanently locked.
          </small>
        </div>
      </div>
      <div>
        <span class="sys-mgmt-status-pill-prod">
          <span class="sys-mgmt-dot-prod"></span>
          Production 100%
        </span>
      </div>
    `;

    // Permanently remove/hide the Go-Live Launch section!
    if (launchSectionEl) {
      launchSectionEl.style.display = "none";
    }
  } else {
    bannerEl.className = "sys-mgmt-banner sys-mgmt-banner-demo";
    bannerEl.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <div class="sys-mgmt-icon-demo">
          ⚠️
        </div>
        <div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <strong class="sys-mgmt-status-title-demo">Demo & Staging Environment</strong>
            <span class="badge sys-mgmt-tag-demo">Pre-Launch</span>
          </div>
          <small class="text-muted d-block mt-1">
            The system is running with test records. Use the Launch button below when ready to go live.
          </small>
        </div>
      </div>
      <div>
        <span class="sys-mgmt-status-pill-demo">
          <span class="sys-mgmt-dot-demo"></span>
          Demo Mode
        </span>
      </div>
    `;

    // Show the Go-Live Launch section
    if (launchSectionEl) {
      launchSectionEl.style.display = "block";
    }
  }
}

window.renderSystemManagementCard = renderSystemManagementCard;

window.exportDatabaseBackup = function () {
  try {
    const isAr = (localStorage.getItem("pharmaLang") || "en") === "ar";
    const masterData = window.DEMO_DATA ? JSON.parse(JSON.stringify(window.DEMO_DATA)) : {};
    let salesData = [];
    if (window.store && window.store.distributorSales && typeof window.store.distributorSales.getAll === "function") {
      salesData = window.store.distributorSales.getAll();
    } else {
      salesData = masterData.distributorSales || [];
    }

    const fullSnapshot = {
      pharmaCareVersion: "v230",
      exportedAt: new Date().toISOString(),
      exportedBy: (window.currentUser && (window.currentUser.email || window.currentUser.name)) || "Admin",
      masterData: masterData,
      salesData: salesData,
    };

    const jsonString = JSON.stringify(fullSnapshot, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `PharmaCare_Database_Backup_${dateStr}.json`;

    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    }, 150);

    if (typeof showToast === "function") {
      showToast("Database backup exported successfully!", "success");
    }
    return fullSnapshot;
  } catch (err) {
    console.error("Backup export error:", err);
    if (typeof showToast === "function") {
      showToast("Failed to export database backup: " + (err.message || err), "error");
    }
  }
};

window.handleDatabaseRestore = function (event) {
  const file = event && event.target && event.target.files && event.target.files[0];
  if (!file) return;

  const isAr = (localStorage.getItem("pharmaLang") || "en") === "ar";
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid backup JSON format.");
      }

      // Support both structured snapshots { masterData, salesData } and raw masterData dumps
      const restoredMaster = parsed.masterData || parsed;
      const restoredSales = parsed.salesData || restoredMaster.distributorSales || [];

      if (!restoredMaster.users && !restoredMaster.doctors && !restoredMaster.companySettings) {
        throw new Error("Backup file does not contain recognized PharmaCare database tables.");
      }

      // Update in-memory DEMO_DATA
      window.DEMO_DATA = Object.assign(window.DEMO_DATA || {}, restoredMaster);
      window.DEMO_DATA.distributorSales = restoredSales;

      // Update local storage
      if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
      if (typeof window.saveSalesDataToStorage === "function") window.saveSalesDataToStorage();

      try {
        localStorage.setItem("pharma_sales_data", JSON.stringify(restoredSales));
      } catch (err) {}

      // Sync to cloud
      if (typeof window.pushLocalToCloud === "function") {
        try { window.pushLocalToCloud(true); } catch (e) {}
      }
      if (typeof window.pushSalesToCloud === "function") {
        try { window.pushSalesToCloud(true); } catch (e) {}
      }

      if (typeof showToast === "function") {
        showToast("Database restored successfully! Refreshing...", "success");
      }

      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err) {
      console.error("Restore error:", err);
      if (typeof showToast === "function") {
        showToast("Failed to restore backup: " + (err.message || err), "error");
      }
    } finally {
      if (event.target) event.target.value = "";
    }
  };
  reader.readAsText(file);
};

window.openGoLiveModal = function () {
  const modal = document.getElementById("goLiveModal");
  if (modal) {
    modal.style.display = "flex";
    selectGoLiveOption("keep_setup");
  }
};

window.closeGoLiveModal = function () {
  const modal = document.getElementById("goLiveModal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.selectGoLiveOption = function (optionValue) {
  const radioKeep = document.getElementById("radioKeepSetup");
  const radioBlank = document.getElementById("radioBlankSlate");
  const labelKeep = document.getElementById("labelOptionKeep");
  const labelBlank = document.getElementById("labelOptionBlank");

  if (optionValue === "keep_setup") {
    if (radioKeep) radioKeep.checked = true;
    if (radioBlank) radioBlank.checked = false;
    if (labelKeep) {
      labelKeep.classList.add("active");
      labelKeep.style.border = "2px solid #0d6efd";
    }
    if (labelBlank) {
      labelBlank.classList.remove("active");
      labelBlank.style.border = "2px solid var(--border-color, #e2e8f0)";
      labelBlank.style.background = "transparent";
    }
  } else {
    if (radioKeep) radioKeep.checked = false;
    if (radioBlank) radioBlank.checked = true;
    if (labelBlank) {
      labelBlank.classList.add("active");
      labelBlank.style.border = "2px solid #0d6efd";
    }
    if (labelKeep) {
      labelKeep.classList.remove("active");
      labelKeep.style.border = "2px solid var(--border-color, #e2e8f0)";
      labelKeep.style.background = "transparent";
    }
  }
};

window.confirmAndExecuteGoLive = async function () {
  const confirmBtn = document.getElementById("btnConfirmGoLive");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span>⏳ Processing Go-Live...</span>`;
  }

  try {
    const selectedMode = document.querySelector('input[name="goLiveOption"]:checked')?.value || "keep_setup";

    // 1. Mandatory Auto-Backup before doing anything destructive
    if (typeof window.exportDatabaseBackup === "function") {
      window.exportDatabaseBackup();
    }

    // 2. Wipe transactional records
    if (!window.DEMO_DATA) window.DEMO_DATA = {};
    window.DEMO_DATA.visits = [];
    window.DEMO_DATA.leaves = [];
    window.DEMO_DATA.sales = [];
    window.DEMO_DATA.notifications = [];
    window.DEMO_DATA.workflowNotifications = [];
    window.DEMO_DATA.dailyActivities = [];
    window.DEMO_DATA.requestExpenses = [];
    window.DEMO_DATA.requestServices = [];
    window.DEMO_DATA.accountLocationRequests = [];
    window.DEMO_DATA.importBatches = [];

    // Wipe distributor sales in memory and storage
    window.DEMO_DATA.distributorSales = [];
    try {
      localStorage.setItem("pharma_sales_data", "[]");
    } catch (e) {}

    if (selectedMode === "keep_setup") {
      // Reset each user's leave balance to clean yearly balance
      if (Array.isArray(window.DEMO_DATA.users)) {
        window.DEMO_DATA.users.forEach((u) => {
          u.leaveBalance = {
            annual: 21,
            sick: 7,
            emergency: 6,
            unpaid: 0,
            maternity: 90,
          };
        });
      }
    } else if (selectedMode === "blank_slate") {
      // White-label fresh start: keep only the Super Admin account
      const authUser = (window.checkAuth && window.checkAuth()) || window.currentUser || {};
      let activeAdmin = (Array.isArray(window.DEMO_DATA.users)
        ? window.DEMO_DATA.users.find((u) => u.id === authUser.id || u.role === "admin")
        : null);
      if (!activeAdmin) {
        activeAdmin = {
          id: "u1790626000010",
          name: "System Admin",
          
          role: "admin",
          email: "admin@pharmacare.com",
          employeeCode: "ADM-001",
        };
      }
      activeAdmin.areaIds = [];
      activeAdmin.areaId = null;
      activeAdmin.area = null;
      activeAdmin.leaveBalance = { annual: 21, sick: 7, emergency: 6, unpaid: 0, maternity: 90 };

      window.DEMO_DATA.users = [activeAdmin];
      window.DEMO_DATA.doctors = [];
      window.DEMO_DATA.pharmacies = [];
      window.DEMO_DATA.hospitals = [];
      window.DEMO_DATA.areas = [];
      window.DEMO_DATA.productLines = [];
      window.DEMO_DATA.distributors = [];
      window.DEMO_DATA.bulkWeights = [];
      window.DEMO_DATA.pharmacyOverrides = [];
      window.DEMO_DATA.targets = [];
    }

    // 3. Mark production launch in company settings
    const currentSettings = (window.store && window.store.companySettings && typeof window.store.companySettings.get === "function")
      ? window.store.companySettings.get()
      : ((window.DEMO_DATA && window.DEMO_DATA.companySettings) || {});

    currentSettings.isProductionLaunched = true;
    currentSettings.productionLaunchDate = new Date().toISOString();
    currentSettings.productionLaunchMode = selectedMode;

    if (window.store && window.store.companySettings && typeof window.store.companySettings.update === "function") {
      window.store.companySettings.update(currentSettings);
    } else {
      window.DEMO_DATA.companySettings = currentSettings;
      try {
        localStorage.setItem("pharma_company_settings", JSON.stringify(currentSettings));
      } catch (e) {}
    }

    // 4. Persist to storage & push to Firebase Firestore Cloud
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    if (typeof window.saveSalesDataToStorage === "function") window.saveSalesDataToStorage();

    if (typeof window.pushLocalToCloud === "function") {
      try { window.pushLocalToCloud(true); } catch (e) {}
    }
    if (typeof window.pushSalesToCloud === "function") {
      try { window.pushSalesToCloud(true); } catch (e) {}
    }

    closeGoLiveModal();

    const isAr = (localStorage.getItem("pharmaLang") || "en") === "ar";
    if (typeof showToast === "function") {
      showToast("Congratulations! Production launched successfully!", "success");
    }

    renderSystemManagementCard();

    setTimeout(() => {
      window.location.reload();
    }, 1500);

  } catch (err) {
    console.error("Go-Live execution error:", err);
    if (typeof showToast === "function") {
      showToast("Production launch failed: " + (err.message || err), "error");
    }
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<span>🚀 Confirm & Launch Production</span>`;
    }
  }
};