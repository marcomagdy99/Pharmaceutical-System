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
    const user = sessionStorage.getItem('pharmaUser') || localStorage.getItem('pharmaUser');
    if (user) {
      window.location.replace('index.html');
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
    email_placeholder: "Enter your email",
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
    lang_toggle_text: "عربي",
    demo_accounts_title: "Quick Demo Accounts:",
    selected_dept_admin: "Admin Portal",
    selected_dept_sales: "Sales & Marketing Portal",
    selected_dept_hr: "Human Resources Portal",
    dark_mode: "Dark",
    light_mode: "Light"
  },
  ar: {
    login_subtitle: "نظام إدارة علاقات العملاء الصيدلانية",
    select_department: "اختر القسم الخاص بك",
    dept_admin: "الإدارة",
    dept_admin_desc: "مسؤولي النظام",
    dept_sales: "المبيعات والتسويق",
    dept_sales_desc: "مديري الوحدات والخطوط والمندوبين",
    dept_hr: "الموارد البشرية",
    dept_hr_desc: "شؤون الموظفين",
    back: "العودة للاختيار",
    email_label: "البريد الإلكتروني",
    email_placeholder: "أدخل بريدك الإلكتروني",
    password_label: "كلمة المرور",
    password_placeholder: "أدخل كلمة المرور",
    remember_me: "تذكرني",
    forgot_password: "هل نسيت كلمة المرور؟",
    login_btn: "تسجيل الدخول",
    footer_text: "© 2026 PharmaCare. جميع الحقوق محفوظة.",
    brand_tagline: "نمكّن المناديب الطبيين",
    brand_desc: "قم بتبسيط سير عملك وإدارة علاقاتك وتعزيز الأداء مع حل إدارة علاقات العملاء الشامل لدينا.",
    error_invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    error_empty: "يرجى ملء جميع الحقول.",
    error_wrong_dept: "هذا الحساب لا ينتمي للقسم المختار. يرجى اختيار القسم الصحيح.",
    lang_toggle_text: "English",
    demo_accounts_title: "تسجيل تجريبي سريع:",
    selected_dept_admin: "بوابة الإدارة",
    selected_dept_sales: "بوابة المبيعات والتسويق",
    selected_dept_hr: "بوابة الموارد البشرية",
    dark_mode: "داكن",
    light_mode: "فاتح"
  }
};

let currentLang = localStorage.getItem('pharmaLang') || 'en';
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
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  if (langText) {
    langText.textContent = translations[lang].lang_toggle_text;
  }

  if (selectedDepartment && selectedDeptTitle) {
    selectedDeptTitle.textContent = translations[lang]['selected_dept_' + selectedDepartment];
  }

  if (typeof window.updateLoginThemeUI === 'function') {
    const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
    window.updateLoginThemeUI(curTheme);
  }

  applyBrandSettings();
}

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

  // 1. Update all logo instances (Right panel & Left panel logos)
  if (brand.logoUrl) {
    document.querySelectorAll(".login-logo-img, .brand-panel-logo").forEach((img) => {
      img.src = brand.logoUrl;
    });
  }

  // 2. Update Tagline (both right panel and left subtitle if customized)
  const isAr = currentLang === "ar";
  const taglineText = isAr ? (brand.taglineAr || brand.taglineEn) : (brand.taglineEn || brand.taglineAr);
  const brandTagline = document.getElementById("brandTagline");
  if (brandTagline && taglineText) {
    brandTagline.textContent = taglineText;
  }

  // 3. Update Description
  const descText = isAr ? (brand.descAr || brand.descEn) : (brand.descEn || brand.descAr);
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

if (langToggle) {
  langToggle.addEventListener('click', () => {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem('pharmaLang', newLang);
    setLanguage(newLang);
  });
}

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
  const defaultAccounts = [
    { email: 'admin@pharmacare.com', passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'admin', name: 'System Admin', dept: 'admin', employeeCode: 'ADM-001', id: 'admin1' },
    { email: 'bu@pharmacare.com', passwordHash: 'd041f6dd2d671f68144bd4d667f96a6146dbf2ed0f71f19b532ce1e2826f8f92', role: 'business_unit', name: 'George Marzok', dept: 'sales', employeeCode: 'BU-001', id: 'bu1' },
    { email: 'lm@pharmacare.com', passwordHash: '89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b', role: 'line_manager', name: 'John Mahfouz', dept: 'sales', employeeCode: 'LM-001', id: 'lm1' },
    { email: 'lm2@pharmacare.com', passwordHash: '89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b', role: 'line_manager', name: 'Mario Magdy', dept: 'sales', employeeCode: 'LM-002', id: 'lm2' },
    { email: 'dm@pharmacare.com', passwordHash: 'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869', role: 'district_manager', name: 'Amir Ayoup', dept: 'sales', employeeCode: 'DM-001', id: 'dm1' },
    { email: 'dm2@pharmacare.com', passwordHash: 'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869', role: 'district_manager', name: 'Jonathan Erian', dept: 'sales', employeeCode: 'DM-002', id: 'dm2' },
    { email: 'dm3@pharmacare.com', passwordHash: 'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869', role: 'district_manager', name: 'Marian Magdy', dept: 'sales', employeeCode: 'DM-003', id: 'dm3' },
    { email: 'rep@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Marco Magdy', dept: 'sales', employeeCode: 'EMP-001', id: 'rep1' },
    { email: 'rep2@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Kerolos Boules', dept: 'sales', employeeCode: 'EMP-002', id: 'rep2' },
    { email: 'rep3@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Mina Mikhael', dept: 'sales', employeeCode: 'EMP-003', id: 'rep3' },
    { email: 'rep4@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'David Emad', dept: 'sales', employeeCode: 'EMP-004', id: 'rep4' },
    { email: 'rep5@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Mohamed Ramadan', dept: 'sales', employeeCode: 'EMP-005', id: 'rep5' },
    { email: 'pm@pharmacare.com', passwordHash: 'ae087349bb953601482c9c52169257c0cb0371cbac3d921b5896a9aba8cc8a43', role: 'product_manager', name: 'Mina Kadry', dept: 'sales', employeeCode: 'PM-001', id: 'pm1', lineId: 'line1', lineIds: ['line1'], productIds: ['prod1', 'prod2', 'prod3', 'prod4'] },
    { email: 'pm2@pharmacare.com', passwordHash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', role: 'product_manager', name: 'Fady Adel', dept: 'sales', employeeCode: 'PM-002', id: 'pm2', lineId: 'line2', lineIds: ['line2'], productIds: ['prod5', 'prod6'] },
    { email: 'hr@pharmacare.com', passwordHash: '070a3b5e8d4bd5c46acccb91c9c54614c0cd649e78c4c4719e3a64270bae5ddf', role: 'hr', name: 'Fatma El-Sherif', dept: 'hr', employeeCode: 'HR-001', id: 'hr1' }
  ];

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

  // Map dynamic users with appropriate department mapping
  const mappedStored = storedUsers.map((u) => {
    let dept = 'sales';
    if (u.role === 'admin') dept = 'admin';
    else if (u.role === 'hr') dept = 'hr';

    let uRole = u.role || 'medical_rep';
    let uId = u.id;
    let uEmail = (u.email || '').toLowerCase().trim();

    // Stale data repair: if pm2 was recorded as medical_rep or has EMP-005
    if (uEmail === 'pm2@pharmacare.com' || uId === 'pm2' || u.code === 'PM-002') {
      if (u.employeeCode === 'EMP-005' || u.name === 'Mohamed Ramadan') {
        uId = 'rep5';
        uEmail = 'rep5@pharmacare.com';
        uRole = 'medical_rep';
      } else {
        uRole = 'product_manager';
        uId = 'pm2';
      }
    }

    const defaultAcc = defaultAccounts.find((da) => (da.email || '').toLowerCase() === uEmail || da.id === uId);
    const resolvedHash = u.passwordHash || (defaultAcc ? defaultAcc.passwordHash : '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');

    return {
      email: uEmail,
      passwordHash: resolvedHash,
      password: u.password || null,
      role: uRole,
      name: u.name || 'User',
      dept: dept,
      employeeCode: u.employeeCode || u.code || 'EMP-000',
      id: uId,
      lineId: u.lineId || null,
      lineIds: u.lineIds || [],
      productIds: u.productIds || []
    };
  });

  // Primary Source of Truth: LIVE ADMIN DATABASE (mappedStored)
  // Whatever the Admin creates or edits in the system MUST always take precedence!
  const combined = [...mappedStored];

  // Only fall back to defaultAccounts for seed demo accounts that do not exist in the database
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

  return combined;
}

/**
 * Handles login submission with dynamic user resolution and department validation.
 */
async function handleLogin() {
  try {
    const rawInput = emailInput ? emailInput.value.trim() : '';
    const email = rawInput.toLowerCase();
    const password = passwordInput ? passwordInput.value : '';

    if (emailInput) emailInput.classList.remove('is-invalid');
    if (passwordInput) passwordInput.classList.remove('is-invalid');
    hideLoginError();
    if (loginBox) loginBox.classList.remove('shake');

    if (!email || !password) {
      if (!email && emailInput) emailInput.classList.add('is-invalid');
      if (!password && passwordInput) passwordInput.classList.add('is-invalid');

      const emptyMsg = (translations[currentLang] && translations[currentLang].error_empty) || 
                       (currentLang === 'ar' ? "يرجى ملء جميع الحقول." : "Please fill in all fields.");
      showLoginError(emptyMsg);

      if (loginBox) {
        void loginBox.offsetWidth;
        loginBox.classList.add('shake');
      }
      return;
    }

    if (loginBtn) loginBtn.classList.add('loading');

    const enteredHash = await window.hashPassword(password);

    setTimeout(() => {
      try {
        const allUsers = getAllAuthenticatableUsers();

        // Flexible user matching by email, id, employeeCode, name, or role shorthand
        let matchedUser = allUsers.find((u) => {
          if (!u) return false;
          const uEmail = (u.email || '').toLowerCase().trim();
          const uId = (u.id || '').toLowerCase().trim();
          const uRole = (u.role || '').toLowerCase().trim();
          const uName = (u.name || '').toLowerCase().trim();
          const uCode = (u.employeeCode || u.code || '').toLowerCase().trim();
          const emailPrefix = uEmail.split('@')[0];

          return (
            uEmail === email ||
            uId === email ||
            uCode === email ||
            emailPrefix === email ||
            uName === email ||
            (email === 'hr' && (uRole === 'hr' || uId === 'hr1')) ||
            (email === 'hr1' && (uRole === 'hr' || uId === 'hr1')) ||
            (email === 'fatma' && (uRole === 'hr' || uId === 'hr1')) ||
            (email === 'admin' && (uRole === 'admin' || uId === 'admin1')) ||
            (email === 'admin1' && (uRole === 'admin' || uId === 'admin1')) ||
            (email === 'rep' && (uRole === 'medical_rep' || uId === 'rep1')) ||
            (email === 'rep1' && (uRole === 'medical_rep' || uId === 'rep1')) ||
            (email === 'rep2' && (uRole === 'medical_rep' || uId === 'rep2')) ||
            (email === 'rep3' && (uRole === 'medical_rep' || uId === 'rep3')) ||
            (email === 'rep4' && (uRole === 'medical_rep' || uId === 'rep4')) ||
            (email === 'rep5' && (uRole === 'medical_rep' || uId === 'rep5')) ||
            (email === 'dm' && (uRole === 'district_manager' || uId === 'dm1')) ||
            (email === 'dm1' && (uRole === 'district_manager' || uId === 'dm1')) ||
            (email === 'lm' && (uRole === 'line_manager' || uId === 'lm1')) ||
            (email === 'lm1' && (uRole === 'line_manager' || uId === 'lm1')) ||
            (email === 'bu' && (uRole === 'business_unit' || uId === 'bu1')) ||
            (email === 'bu1' && (uRole === 'business_unit' || uId === 'bu1')) ||
            (email === 'pm' && (uRole === 'product_manager' || uId === 'pm1')) ||
            (email === 'pm1' && (uRole === 'product_manager' || uId === 'pm1')) ||
            (email === 'pm2' && (uRole === 'product_manager' || uId === 'pm2'))
          );
        });

        const isPasswordValid = Boolean(
          matchedUser && (
            (matchedUser.passwordHash && matchedUser.passwordHash === enteredHash) ||
            (matchedUser.password && (matchedUser.password === password || matchedUser.password === enteredHash))
          )
        );

        if (!matchedUser || !isPasswordValid) {
          if (loginBtn) loginBtn.classList.remove('loading');
          if (emailInput) emailInput.classList.add('is-invalid');
          if (passwordInput) passwordInput.classList.add('is-invalid');
          const invalidMsg = (translations[currentLang] && translations[currentLang].error_invalid) ||
                             (currentLang === 'ar' ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : "Invalid email or password.");
          showLoginError(invalidMsg);
          if (loginBox) {
            void loginBox.offsetWidth;
            loginBox.classList.add('shake');
          }
          return;
        }

        // Strict department verification:
        // Admin can ONLY log in through 'admin' portal
        // HR can ONLY log in through 'hr' portal
        // Sales & Marketing can ONLY log in through 'sales' portal
        const userDept = matchedUser.dept || (matchedUser.role === 'admin' ? 'admin' : (matchedUser.role === 'hr' ? 'hr' : 'sales'));
        if (selectedDepartment && userDept !== selectedDepartment) {
          if (loginBtn) loginBtn.classList.remove('loading');
          if (emailInput) emailInput.classList.add('is-invalid');
          const deptMsg = (translations[currentLang] && translations[currentLang].error_wrong_dept) ||
                          (currentLang === 'ar' ? "هذا الحساب لا ينتمي للقسم المختار. يرجى اختيار القسم الصحيح." : "This account does not belong to the selected department.");
          showLoginError(deptMsg);
          if (loginBox) {
            void loginBox.offsetWidth;
            loginBox.classList.add('shake');
          }
          return;
        }

        const sessionData = {
          id: matchedUser.id,
          email: matchedUser.email,
          role: matchedUser.role,
          name: matchedUser.name,
          employeeCode: matchedUser.employeeCode,
          lineId: matchedUser.lineId || null,
          lineIds: matchedUser.lineIds || [],
          productIds: matchedUser.productIds || [],
          token: 'token_' + Date.now()
        };

        sessionStorage.removeItem('pharma_logged_out');
        sessionStorage.setItem('pharmaUser', JSON.stringify(sessionData));
        localStorage.setItem('pharmaUser', JSON.stringify(sessionData));
        localStorage.setItem('userRole', matchedUser.role);
        localStorage.setItem('userId', matchedUser.id);
        window.currentUser = sessionData;

        window.location.replace('index.html');
      } catch (err) {
        console.error("Login processing error:", err);
        if (loginBtn) loginBtn.classList.remove('loading');
        showLoginError(currentLang === 'ar' ? "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً." : "An error occurred during login. Please try again.");
      }
    }, 300);
  } catch (outerErr) {
    console.error("handleLogin outer error:", outerErr);
    if (loginBtn) loginBtn.classList.remove('loading');
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
})(window, document);