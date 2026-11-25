/**
 * @file login.js
 * @description Authentication and department verification engine for PharmaCare CRM.
 * Validates default demo users and dynamically checks newly added users from localStorage.
 */

// Immediate redirect if session already authenticated
(function() {
  try {
    if (sessionStorage.getItem('pharma_logged_out') === 'true') {
      return;
    }
    const rawUser = sessionStorage.getItem('pharmaUser') || localStorage.getItem('pharmaUser');
    if (rawUser) {
      let parsed = null;
      try {
        parsed = JSON.parse(rawUser);
      } catch (err) {
        // Corrupted session string, purge to avoid infinite redirect loop
        sessionStorage.removeItem('pharmaUser');
        localStorage.removeItem('pharmaUser');
        return;
      }
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
        window.location.replace('index.html');
      } else {
        // Malformed session object, purge to avoid loop
        sessionStorage.removeItem('pharmaUser');
        localStorage.removeItem('pharmaUser');
      }
    }
  } catch (e) {}
})();

// Initialize Feather icons safely
try {
  if (typeof feather !== 'undefined' && typeof feather.replace === 'function') {
    feather.replace();
  }
} catch (e) {
  console.warn("Feather replace skipped:", e);
}

(function (window, document) {
  "use strict";

  const translations = {
  en: {
    login_subtitle: "Pharmaceutical CRM System",
    select_department: "Select Your Department",
    dept_admin: "Admin",
    dept_admin_desc: "System Administrators",
    dept_sales: "Sales & Marketing",
    dept_sales_desc: "BU, LM, DM, Medical Rep",
    dept_hr: "Human Resources",
    dept_hr_desc: "HR & Personnel",
    back: "Back to Selection",
    email_label: "Email Address",
    email_placeholder: "Enter your email address",
    password_label: "Password",
    password_placeholder: "Enter your password",
    remember_me: "Remember me",
    forgot_password: "Forgot password?",
    login_btn: "Login",
    footer_text: "© 2026 PharmaCare. All rights reserved.",
    brand_tagline: "Empowering Medical Representatives",
    brand_desc: "Streamline your workflow, manage relationships, and drive performance with our comprehensive CRM solution.",
    error_invalid: "Invalid email or password.",
    error_empty: "Please fill in all fields.",
    error_wrong_dept: "This account does not belong to the selected department.",
    error_inactive: "This account has been deactivated. Please contact HR or System Administrator.",
    lang_toggle_text: "English",
    demo_accounts_title: "Quick Demo Accounts:",
    selected_dept_admin: "Admin Portal",
    selected_dept_sales: "Sales & Marketing Portal",
    selected_dept_hr: "Human Resources Portal",
    dark_mode: "Dark",
    light_mode: "Light",
    forgot_title: "Password Assistance",
    forgot_desc: "For enterprise security, please contact your System Administrator (Admin) or HR Department to verify your identity and reset your credentials.",
    close_btn: "Close"
  }
};

let currentLang = 'en';
try {
  localStorage.setItem('pharmaLang', 'en');
  localStorage.setItem('lang', 'en');
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
} catch (e) {}
let selectedDepartment = null;

// DOM References
const langToggle = document.getElementById('langToggle');
const langText = document.getElementById('langText');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const loginBtn = document.getElementById('loginBtn');
const loginBox = document.getElementById('loginBox');
const departmentView = document.getElementById('departmentView');
const cardAdmin = document.getElementById('cardAdmin');
const cardSales = document.getElementById('cardSales');
const cardHR = document.getElementById('cardHR');
const backToDept = document.getElementById('backToDept');
const selectedDeptTitle = document.getElementById('selectedDeptTitle');

  function showLoginError(msg) {
    const errEl = document.getElementById('errorMessage');
    if (!errEl) return;
    const textEl = document.getElementById('errorMessageText') || errEl;
    textEl.textContent = msg;
    errEl.style.display = 'flex';
    errEl.classList.add('show');
  }

  function hideLoginError() {
    const errEl = document.getElementById('errorMessage');
    if (!errEl) return;
    errEl.style.display = 'none';
    errEl.classList.remove('show');
  }

function setLanguage(lang) {
  currentLang = 'en';
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (translations['en'] && translations['en'][key]) {
      el.textContent = translations['en'][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations['en'] && translations['en'][key]) {
      el.placeholder = translations['en'][key];
    }
  });

  if (selectedDepartment && selectedDeptTitle && translations['en']['selected_dept_' + selectedDepartment]) {
    selectedDeptTitle.textContent = translations['en']['selected_dept_' + selectedDepartment];
  }

  if (typeof window.updateLoginThemeUI === 'function') {
    const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
    window.updateLoginThemeUI(curTheme);
  }

  applyBrandSettings();
}

function openForgotPasswordModal(e) {
  if (e && e.preventDefault) e.preventDefault();
  const m = document.getElementById('forgotPasswordModal');
  if (m) m.style.display = 'flex';
}
window.openForgotPasswordModal = openForgotPasswordModal;

function closeForgotPasswordModal() {
  const m = document.getElementById('forgotPasswordModal');
  if (m) m.style.display = 'none';
}
window.closeForgotPasswordModal = closeForgotPasswordModal;

function applyBrandSettings() {
  let settings = null;
  try {
    const raw = localStorage.getItem("pharma_company_settings");
    if (raw) settings = JSON.parse(raw);
  } catch (e) {}

  if (!settings && window.DEMO_DATA && window.DEMO_DATA.companySettings) {
    settings = window.DEMO_DATA.companySettings;
  }

  if (!settings) {
    try {
      const rawMaster = localStorage.getItem("pharma_master_data");
      if (rawMaster) {
        const parsed = JSON.parse(rawMaster);
        if (parsed && parsed.companySettings) settings = parsed.companySettings;
      }
    } catch (e) {}
  }

  const brand = settings && settings.branding;
  if (!brand) return;

  // Persist locally for immediate availability on subsequent paints
  try {
    localStorage.setItem("pharma_company_settings", JSON.stringify(settings));
  } catch (e) {}

  // Helper to validate logo URL protocol safely against XSS or invalid protocols
  const isSafeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    return (
      trimmed.startsWith('https://') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('./')
    );
  };

  // 1. Update all logo instances (Right panel & Left panel logos)
  if (brand.logoUrl && isSafeImageUrl(brand.logoUrl)) {
    document.querySelectorAll(".login-logo-img, .brand-panel-logo").forEach((img) => {
      img.src = brand.logoUrl;
    });
  }

  // 2. Update Tagline
  const taglineText = brand.taglineEn || brand.taglineAr;
  const brandTagline = document.getElementById("brandTagline");
  if (brandTagline && taglineText) {
    brandTagline.textContent = taglineText;
  }

  // 3. Update Description
  const descText = brand.descEn || brand.descAr;
  const brandDesc = document.getElementById("brandDesc");
  if (brandDesc && descText) {
    brandDesc.textContent = descText;
  }

  // 4. Update Right Panel Background Gradient
  const loginRight = document.getElementById("loginRightPanel") || document.querySelector(".login-right");
  if (loginRight && brand.gradient) {
    loginRight.style.background = brand.gradient;
  }
}

window.applyBrandSettings = applyBrandSettings;

// Listen for cross-tab or Firebase cloud sync updates to instantly reflect branding changes
document.addEventListener("pharma:storage:synced", () => {
  applyBrandSettings();
});
document.addEventListener("pharma:store:changed", () => {
  applyBrandSettings();
});
window.addEventListener("storage", (e) => {
  if (e.key === "pharma_company_settings" || e.key === "pharma_master_data") {
    applyBrandSettings();
  }
});

if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    togglePassword.innerHTML =
      type === 'password'
        ? '<i data-feather="eye" id="eyeIcon"></i>'
        : '<i data-feather="eye-off" id="eyeIcon"></i>';
    if (typeof feather !== 'undefined') feather.replace();
  });
}

function showLoginForm(dept) {
  selectedDepartment = dept;
  if (departmentView) departmentView.style.display = 'none';
  if (loginBox) loginBox.style.display = 'block';

  if (selectedDeptTitle && translations[currentLang] && translations[currentLang]['selected_dept_' + dept]) {
    selectedDeptTitle.textContent = translations[currentLang]['selected_dept_' + dept];
  }

  // Keep inputs empty for clean user entry
  if (emailInput) {
    emailInput.value = '';
    emailInput.classList.remove('is-invalid');
  }
  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.classList.remove('is-invalid');
  }
  hideLoginError();

  setTimeout(() => {
    if (emailInput) emailInput.focus();
  }, 50);
}

window.showLoginForm = showLoginForm;
window.showDepartmentSelection = showDepartmentSelection;
window.onDeptSelected = function(dept) {
  showLoginForm(dept);
};

function showDepartmentSelection() {
  selectedDepartment = null;
  if (loginBox) loginBox.style.display = 'none';
  if (departmentView) departmentView.style.display = 'block';

  if (emailInput) {
    emailInput.value = '';
    emailInput.classList.remove('is-invalid');
  }
  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.classList.remove('is-invalid');
  }
  hideLoginError();
}

if (cardAdmin) cardAdmin.addEventListener('click', () => showLoginForm('admin'));
if (cardSales) cardSales.addEventListener('click', () => showLoginForm('sales'));
if (cardHR) cardHR.addEventListener('click', () => showLoginForm('hr'));
if (backToDept) backToDept.addEventListener('click', showDepartmentSelection);

/**
 * Resolves all eligible users (default accounts + newly registered admin users).
 * @returns {Array} Complete list of registered users.
 */
function getAllAuthenticatableUsers() {
  // Bootstrap Admin account only — all other accounts come live from Firebase / Admin database
  const defaultAccounts = [
    { email: 'admin@pharmacare.com', passwordHash: '9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f', role: 'admin', name: 'System Admin', dept: 'admin', employeeCode: 'ADM-001', id: 'u1790626000010', mustChangePassword: false }
  ];

  const isDemoMode = Boolean(window.DEMO_MODE || window.IS_DEMO_MODE);

  let storedUsers = [];
  try {
    const raw = localStorage.getItem('pharma_master_data');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        storedUsers = parsed.users;
      }
    }
  } catch (e) {}
  if (storedUsers.length <= 1 && window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users) && window.DEMO_DATA.users.length > storedUsers.length) {
    storedUsers = window.DEMO_DATA.users;
  }

  // Map dynamic users with appropriate department mapping
  const mappedStored = storedUsers.map((u) => {
    let dept = 'sales';
    if (u.role === 'admin') dept = 'admin';
    else if (u.role === 'hr') dept = 'hr';

    let uRole = u.role || 'medical_rep';
    let uId = u.id;
    let uEmail = (u.email || '').toLowerCase().trim();

    // Stale demo data repair: strictly confined to DEMO_MODE so production users are never altered
    if (isDemoMode && (uEmail === 'pm2@pharmacare.com' || uId === 'u1790626000019' || u.code === 'PM-002')) {
      if (u.employeeCode === 'REP-005' || u.employeeCode === 'EMP-005' || u.name === 'Mohamed Ramadan') {
        uId = 'u1790626000005';
        uEmail = 'rep5@pharmacare.com';
        uRole = 'medical_rep';
      } else {
        uRole = 'product_manager';
        uId = 'u1790626000019';
      }
    }

    const defaultAcc = defaultAccounts.find((da) => (da.email || '').toLowerCase() === uEmail || da.id === uId);
    let resolvedHash = u.passwordHash || (defaultAcc && isDemoMode ? defaultAcc.passwordHash : null);
    if (!resolvedHash && isDemoMode) {
      resolvedHash = '9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f';
    }

    return {
      ...u,
      email: uEmail,
      passwordHash: resolvedHash,
      password: u.password || null,
      role: uRole,
      name: u.name || 'User',
      dept: dept,
      employeeCode: u.employeeCode || u.code || 'REP-000',
      id: uId,
      status: u.status || 'Active',
      mustChangePassword: Boolean(u.mustChangePassword),
      managerId: u.managerId || null,
      areaId: u.areaId || null,
      areaIds: Array.isArray(u.areaIds) ? u.areaIds : (u.areaId ? [u.areaId] : []),
      phone: u.phone || null,
      hireDate: u.hireDate || null,
      leaveBalance: u.leaveBalance !== undefined ? u.leaveBalance : null,
      lineId: u.lineId || null,
      lineIds: Array.isArray(u.lineIds) ? u.lineIds : (u.lineId ? [u.lineId] : []),
      productIds: Array.isArray(u.productIds) ? u.productIds : []
    };
  });

  // Primary Source of Truth: LIVE ADMIN DATABASE (mappedStored)
  // Whatever the Admin creates or edits in the system MUST always take precedence!
  const combined = [...mappedStored];

  // Only fall back to defaultAccounts in DEMO_MODE or when database is completely empty (first run bootstrap)
  if (isDemoMode || storedUsers.length === 0) {
    defaultAccounts.forEach((da) => {
      const daEmail = (da.email || '').toLowerCase().trim();
      const exists = combined.some((u) => {
        const uEmail = (u.email || '').toLowerCase().trim();
        return (uEmail && uEmail === daEmail) || (u.id && u.id === da.id);
      });
      if (!exists) {
        combined.push(da);
      }
    });
  }

  return combined;
}

/**
 * Handles login submission with dynamic user resolution and department validation.
 */
async function handleLogin() {
  try {
    const rawInput = emailInput ? emailInput.value.trim() : '';
    const email = rawInput.toLowerCase();
    const rawPassword = passwordInput ? passwordInput.value : '';
    const password = rawPassword.trim();

    if (emailInput) emailInput.classList.remove('is-invalid');
    if (passwordInput) passwordInput.classList.remove('is-invalid');
    hideLoginError();
    if (loginBox) loginBox.classList.remove('shake');

    if (!email || !password) {
      if (!email && emailInput) emailInput.classList.add('is-invalid');
      if (!password && passwordInput) passwordInput.classList.add('is-invalid');

      const emptyMsg = (translations[currentLang] && translations[currentLang].error_empty) || "Please fill in all fields.";
      showLoginError(emptyMsg);

      if (loginBox) {
        void loginBox.offsetWidth;
        loginBox.classList.add('shake');
      }
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (emailInput) emailInput.classList.add('is-invalid');
      showLoginError("Please enter a valid company email address.");
      if (loginBox) {
        void loginBox.offsetWidth;
        loginBox.classList.add('shake');
      }
      return;
    }

    if (loginBtn) loginBtn.classList.add('loading');

    const rememberCheckbox = document.getElementById('remember') || document.getElementById('rememberMe');
    const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

    const hasFirebaseAuth = typeof firebase !== 'undefined' && typeof firebase.auth === 'function';
    if (!hasFirebaseAuth) {
      if (loginBtn) loginBtn.classList.remove('loading');
      showLoginError("Authentication service is not ready. Please refresh the page.");
      return;
    }

    try {
      if ((!firebase.apps || !firebase.apps.length) && window.firebaseConfig) {
        firebase.initializeApp(window.firebaseConfig);
      }
      const auth = firebase.auth();
      const persistence = rememberMe
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION;
      await auth.setPersistence(persistence);
      await auth.signInWithEmailAndPassword(email, password);
    } catch (authErr) {
      if (loginBtn) loginBtn.classList.remove('loading');
      const code = authErr && authErr.code ? String(authErr.code) : '';
      let msg = (translations[currentLang] && translations[currentLang].error_invalid) || "Invalid email or password.";
      if (code === 'auth/user-disabled') {
        msg = (translations[currentLang] && translations[currentLang].error_inactive) || "This account has been deactivated. Please contact HR or System Administrator.";
      } else if (code === 'auth/too-many-requests') {
        msg = "Too many failed login attempts. Please wait a few minutes and try again.";
      } else if (code === 'auth/network-request-failed') {
        msg = "Network error. Please check your internet connection and try again.";
      } else {
        if (emailInput) emailInput.classList.add('is-invalid');
        if (passwordInput) passwordInput.classList.add('is-invalid');
      }
      showLoginError(msg);
      if (loginBox) {
        void loginBox.offsetWidth;
        loginBox.classList.add('shake');
      }
      return;
    }

    // Fetch latest company users from Firestore now that Firebase Auth JWT is active
    if (typeof window.ensureFirebaseAuthSync === 'function') {
      try {
        await window.ensureFirebaseAuthSync();
      } catch (syncErr) {
        console.warn("Post-auth cloud sync warning:", syncErr);
      }
    }

    const enteredHash = typeof window.hashPassword === 'function' ? await window.hashPassword(password) : null;

    setTimeout(async () => {
      try {
        const allUsers = getAllAuthenticatableUsers();

        // Strict Email matching against authoritative directory
        let matchedUser = allUsers.find((u) => {
          if (!u) return false;
          const uEmail = (u.email || '').toLowerCase().trim();
          return uEmail === email;
        });

        if (!matchedUser) {
          if (loginBtn) loginBtn.classList.remove('loading');
          try { await firebase.auth().signOut(); } catch (e) {}
          if (emailInput) emailInput.classList.add('is-invalid');
          showLoginError("Your Firebase account is not linked to an employee profile. Please contact Admin.");
          if (loginBox) {
            void loginBox.offsetWidth;
            loginBox.classList.add('shake');
          }
          return;
        }

        // Sync local metadata hash silently if available
        let requiresPasswordUpgrade = false;
        if (enteredHash && matchedUser.password) {
          requiresPasswordUpgrade = true;
        }

        // Progressive Security Upgrade:
        // Automatically clear any legacy plaintext password
        if (requiresPasswordUpgrade && matchedUser && enteredHash) {
          matchedUser.passwordHash = enteredHash;
          delete matchedUser.password;
          matchedUser.mustChangePassword = true;

          try {
            if (window.store && window.store.users && typeof window.store.users.save === "function") {
              window.store.users.save(matchedUser);
            }
          } catch (upgradeErr) {}
        }

        // Account Status Check (Prevent suspended/inactive accounts from logging in)
        const userStatus = String(matchedUser.status || "active").toLowerCase();
        if (userStatus === "inactive" || userStatus === "suspended" || userStatus === "disabled") {
          if (loginBtn) loginBtn.classList.remove('loading');
          try { await firebase.auth().signOut(); } catch (e) {}
          const inactiveMsg = (translations[currentLang] && translations[currentLang].error_inactive) || "This account has been deactivated. Please contact HR or System Administrator.";
          showLoginError(inactiveMsg);
          if (loginBox) {
            void loginBox.offsetWidth;
            loginBox.classList.add('shake');
          }
          return;
        }

        // Department verification:
        // Admin has full system access and can log in through any portal
        // HR can ONLY log in through 'hr' portal
        // Sales & Marketing can ONLY log in through 'sales' portal
        const userDept = matchedUser.dept || (matchedUser.role === 'admin' ? 'admin' : (matchedUser.role === 'hr' ? 'hr' : 'sales'));
        if (selectedDepartment && userDept !== selectedDepartment && matchedUser.role !== 'admin') {
          if (loginBtn) loginBtn.classList.remove('loading');
          try { await firebase.auth().signOut(); } catch (e) {}
          if (emailInput) emailInput.classList.add('is-invalid');
          const deptMsg = (translations[currentLang] && translations[currentLang].error_wrong_dept) || "This account does not belong to the selected department.";
          showLoginError(deptMsg);
          if (loginBox) {
            void loginBox.offsetWidth;
            loginBox.classList.add('shake');
          }
          return;
        }

        const sessionData = {
          ...matchedUser,
          id: matchedUser.id,
          email: matchedUser.email,
          role: matchedUser.role,
          name: matchedUser.name,
          employeeCode: matchedUser.employeeCode || matchedUser.code,
          nameAr: matchedUser.nameAr || matchedUser.name,
          managerId: matchedUser.managerId || null,
          areaId: matchedUser.areaId || null,
          areaIds: Array.isArray(matchedUser.areaIds) ? matchedUser.areaIds : (matchedUser.areaId ? [matchedUser.areaId] : []),
          phone: matchedUser.phone || null,
          hireDate: matchedUser.hireDate || null,
          leaveBalance: matchedUser.leaveBalance !== undefined ? matchedUser.leaveBalance : null,
          lineId: matchedUser.lineId || null,
          lineIds: Array.isArray(matchedUser.lineIds) ? matchedUser.lineIds : (matchedUser.lineId ? [matchedUser.lineId] : []),
          productIds: Array.isArray(matchedUser.productIds) ? matchedUser.productIds : [],
          mustChangePassword: false,
          token: 'fb_auth_' + (firebase.auth().currentUser ? firebase.auth().currentUser.uid : Date.now()),
          _sig: (typeof window.computeSessionSignature === 'function') ? window.computeSessionSignature(matchedUser) : undefined,
          _signedAt: Date.now()
        };
        delete sessionData.password;
        delete sessionData.passwordHash;

        // First-Time Login / Security Reset Check
        if (matchedUser.mustChangePassword) {
          if (loginBtn) loginBtn.classList.remove('loading');
          showForcePasswordBox(matchedUser, sessionData);
          return;
        }

        sessionStorage.removeItem('pharma_logged_out');
        sessionStorage.setItem('pharma_remember_me', rememberMe ? 'true' : 'false');
        sessionStorage.setItem('pharmaUser', JSON.stringify(sessionData));
        sessionStorage.setItem('userRole', matchedUser.role);
        sessionStorage.setItem('userId', matchedUser.id);

        if (rememberMe) {
          localStorage.setItem('pharmaUser', JSON.stringify(sessionData));
          localStorage.setItem('userRole', matchedUser.role);
          localStorage.setItem('userId', matchedUser.id);
        } else {
          localStorage.removeItem('pharmaUser');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
        }
        window.currentUser = sessionData;

        window.location.replace('index.html');
      } catch (err) {
        console.error("Login processing error:", err);
        if (loginBtn) loginBtn.classList.remove('loading');
        showLoginError("An error occurred during login. Please try again.");
      }
    }, 150);
  } catch (outerErr) {
    console.error("handleLogin outer error:", outerErr);
    if (loginBtn) loginBtn.classList.remove('loading');
    showLoginError("An unexpected error occurred during login. Please refresh the page.");
  }
}

if (loginBtn) {
  loginBtn.addEventListener('click', handleLogin);
}

[emailInput, passwordInput].forEach((input) => {
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  input.addEventListener('input', () => {
    input.classList.remove('is-invalid');
    hideLoginError();
  });
});

window.handleLogin = handleLogin;
window.showLoginForm = showLoginForm;
window.showDepartmentSelection = showDepartmentSelection;
window.applyBrandSettings = applyBrandSettings;
window.setLanguage = setLanguage;
window.showLoginError = showLoginError;
window.hideLoginError = hideLoginError;
window.getAllAuthenticatableUsers = getAllAuthenticatableUsers;

setLanguage(currentLang);

  // ============================================================================
  // Force Password Change on First Login Engine
  // ============================================================================
  let _pendingForceUser = null;
  let _pendingForceSession = null;

  function toggleForcePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = isPass ? "fas fa-eye-slash" : "fas fa-eye";
    }
  }
  window.toggleForcePasswordVisibility = toggleForcePasswordVisibility;

  function showForcePasswordBox(user, sessionData) {
    _pendingForceUser = user;
    _pendingForceSession = sessionData;

    const deptView = document.getElementById("departmentView");
    const logBox = document.getElementById("loginBox");
    const forceBox = document.getElementById("forcePasswordBox");

    if (deptView) deptView.style.display = "none";
    if (logBox) logBox.style.display = "none";
    if (forceBox) {
      forceBox.style.display = "block";

      const notice = document.getElementById("forcePassNoticeText");
      if (notice) {
        notice.textContent = "Welcome, " + user.name + "! For security, you must set a new personal password for your account to continue.";
      }

      const newPassInput = document.getElementById("forceNewPassword");
      if (newPassInput) {
        newPassInput.value = "";
        setTimeout(() => newPassInput.focus(), 150);
      }

      const confirmInput = document.getElementById("forceConfirmPassword");
      if (confirmInput) {
        confirmInput.value = "";
      }

      updateForcePasswordChecklist();
    }
  }
  window.showForcePasswordBox = showForcePasswordBox;

  function updateForcePasswordChecklist() {
    const p1 = document.getElementById("forceNewPassword")?.value || "";
    const p2 = document.getElementById("forceConfirmPassword")?.value || "";

    const hasLen = p1.length >= 8;
    const hasComplex = /[a-zA-Z]/.test(p1) && /[0-9]/.test(p1);
    const hasMatch = p1.length > 0 && p1 === p2;

    const setItem = (id, valid) => {
      const el = document.getElementById(id);
      if (!el) return;
      const icon = el.querySelector("i");
      if (icon) {
        icon.className = valid ? "fas fa-check-circle text-success me-1" : "fas fa-circle text-muted me-1";
      }
      el.style.color = valid ? "#198754" : "#64748b";
    };

    setItem("chkLength", hasLen);
    setItem("chkComplexity", hasComplex);
    setItem("chkMatch", hasMatch);

    const bar = document.getElementById("forceStrengthBar");
    if (bar) {
      let score = 0;
      if (p1.length >= 8) score += 35;
      if (p1.length >= 10) score += 15;
      if (hasComplex) score += 30;
      if (/[^A-Za-z0-9]/.test(p1)) score += 20;
      bar.style.width = Math.min(100, score) + "%";
      if (score < 50) {
        bar.className = "progress-bar bg-danger";
      } else if (score < 80) {
        bar.className = "progress-bar bg-warning";
      } else {
        bar.className = "progress-bar bg-success";
      }
    }
  }

  // Bind live checklist updates
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      const p1 = document.getElementById("forceNewPassword");
      const p2 = document.getElementById("forceConfirmPassword");
      if (p1) p1.addEventListener("input", updateForcePasswordChecklist);
      if (p2) p2.addEventListener("input", updateForcePasswordChecklist);
    });
  }

  async function submitForcePasswordChange() {
    const errBox = document.getElementById("forcePassError");
    const errText = document.getElementById("forcePassErrorText");
    const submitBtn = document.getElementById("btnSubmitForcePassword");
    const p1 = document.getElementById("forceNewPassword")?.value || "";
    const p2 = document.getElementById("forceConfirmPassword")?.value || "";

    const showError = (msg) => {
      if (errBox && errText) {
        errText.textContent = msg;
        errBox.style.display = "flex";
      }
      if (submitBtn) submitBtn.classList.remove("loading");
    };

    if (p1.length < 8) {
      showError("Password must be at least 8 characters long.");
      return;
    }
    if (!(/[a-zA-Z]/.test(p1) && /[0-9]/.test(p1))) {
      showError("Password must contain both letters and numbers.");
      return;
    }
    if (p1 !== p2) {
      showError("Passwords do not match.");
      return;
    }

    if (errBox) errBox.style.display = "none";
    if (submitBtn) submitBtn.classList.add("loading");

    try {
      if (typeof window.hashPassword !== "function") {
        showError("Security module unavailable. Please reload the page or contact administrator.");
        return;
      }
      const newHash = await window.hashPassword(p1);

      // Prevent reusing the same temporary / existing password
      if (_pendingForceUser) {
        if (_pendingForceUser.passwordHash && newHash === _pendingForceUser.passwordHash) {
          showError("New password cannot be the same as your temporary or current password.");
          return;
        }
        if (_pendingForceUser.password && (p1 === _pendingForceUser.password || newHash === _pendingForceUser.password)) {
          showError("New password cannot be the same as your temporary or current password.");
          return;
        }
        const isDefaultDemo = (
          newHash === '9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f' ||
          p1.toLowerCase() === 'password123' ||
          p1.toLowerCase() === 'pharmacare123'
        );
        if (isDefaultDemo) {
          showError("New password cannot be the default demo password.");
          return;
        }
      }

      if (_pendingForceUser) {
        if (typeof firebase !== "undefined" && typeof firebase.auth === "function" && firebase.auth().currentUser) {
          await firebase.auth().currentUser.updatePassword(p1);
        }

        _pendingForceUser.passwordHash = newHash;
        delete _pendingForceUser.password;
        _pendingForceUser.mustChangePassword = false;
        _pendingForceUser.passwordChangedAt = new Date().toISOString();

        // 1. Update in window.store if available
        if (window.store && window.store.users && typeof window.store.users.save === "function") {
          window.store.users.save(_pendingForceUser);
        }

        // 2. Update in pharma_master_data
        try {
          const rawMaster = localStorage.getItem("pharma_master_data");
          if (rawMaster) {
            const master = JSON.parse(rawMaster);
            if (Array.isArray(master.users)) {
              const idx = master.users.findIndex(u => u.id === _pendingForceUser.id);
              if (idx !== -1) {
                master.users[idx].passwordHash = newHash;
                delete master.users[idx].password;
                master.users[idx].mustChangePassword = false;
                master.users[idx].passwordChangedAt = _pendingForceUser.passwordChangedAt;
                localStorage.setItem("pharma_master_data", JSON.stringify(master));
              }
            }
          }
        } catch (e) {}

        // 3. Update in pharma_users_list
        try {
          const rawList = localStorage.getItem("pharma_users_list");
          if (rawList) {
            const list = JSON.parse(rawList);
            if (Array.isArray(list)) {
              const idx = list.findIndex(u => u.id === _pendingForceUser.id);
              if (idx !== -1) {
                list[idx].passwordHash = newHash;
                delete list[idx].password;
                list[idx].mustChangePassword = false;
                localStorage.setItem("pharma_users_list", JSON.stringify(list));
              }
            }
          }
        } catch (e) {}
      }

      // Complete authentication session
      if (_pendingForceSession) {
        _pendingForceSession.mustChangePassword = false;
        if (typeof window.computeSessionSignature === 'function') {
          _pendingForceSession._sig = window.computeSessionSignature(_pendingForceSession);
          _pendingForceSession._signedAt = Date.now();
        }
        const rememberCheckbox = document.getElementById('remember') || document.getElementById('rememberMe');
        const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

        sessionStorage.removeItem("pharma_logged_out");
        sessionStorage.setItem('pharma_remember_me', rememberMe ? 'true' : 'false');
        sessionStorage.setItem("pharmaUser", JSON.stringify(_pendingForceSession));
        sessionStorage.setItem("userRole", _pendingForceSession.role);
        sessionStorage.setItem("userId", _pendingForceSession.id);

        if (rememberMe) {
          localStorage.setItem("pharmaUser", JSON.stringify(_pendingForceSession));
          localStorage.setItem("userRole", _pendingForceSession.role);
          localStorage.setItem("userId", _pendingForceSession.id);
        } else {
          localStorage.removeItem("pharmaUser");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userId");
        }
        window.currentUser = _pendingForceSession;
      }

      window.location.replace("index.html");
    } catch (err) {
      console.error("Error saving new password:", err);
      showError("Error saving password. Please try again.");
    }
  }
  window.submitForcePasswordChange = submitForcePasswordChange;

})(window, document);