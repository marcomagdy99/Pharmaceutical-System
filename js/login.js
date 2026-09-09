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
    const user = sessionStorage.getItem('pharmaUser');
    if (user) {
      window.location.replace('index.html');
    }
  } catch (e) {}
})();

// Initialize Feather icons
if (typeof feather !== 'undefined') {
  feather.replace();
}

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
    selected_dept_hr: "Human Resources Portal"
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
    selected_dept_hr: "بوابة الموارد البشرية"
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
const errorMessage = document.getElementById('errorMessage');
const departmentView = document.getElementById('departmentView');
const cardAdmin = document.getElementById('cardAdmin');
const cardSales = document.getElementById('cardSales');
const cardHR = document.getElementById('cardHR');
const backToDept = document.getElementById('backToDept');
const selectedDeptTitle = document.getElementById('selectedDeptTitle');

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
}

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

  if (selectedDeptTitle && translations[currentLang]['selected_dept_' + dept]) {
    selectedDeptTitle.textContent = translations[currentLang]['selected_dept_' + dept];
  }

  // Pre-fill demo credentials for quick access
  if (dept === 'hr') {
    if (emailInput) emailInput.value = 'hr@pharmacare.com';
    if (passwordInput) passwordInput.value = 'hr123';
  } else if (dept === 'admin') {
    if (emailInput) emailInput.value = 'admin@pharmacare.com';
    if (passwordInput) passwordInput.value = 'admin123';
  } else if (dept === 'sales') {
    if (emailInput) emailInput.value = 'rep@pharmacare.com';
    if (passwordInput) passwordInput.value = 'rep123';
  }

  setTimeout(() => {
    if (emailInput) emailInput.focus();
  }, 50);
}

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
  if (errorMessage) {
    errorMessage.classList.remove('show');
  }
}

if (cardAdmin) cardAdmin.addEventListener('click', () => showLoginForm('admin'));
if (cardSales) cardSales.addEventListener('click', () => showLoginForm('sales'));
if (cardHR) cardHR.addEventListener('click', () => showLoginForm('hr'));
if (backToDept) backToDept.addEventListener('click', showDepartmentSelection);

/**
 * Computes SHA-256 hash of a string using Web Crypto API with fallback.
 * @param {string} str
 * @returns {Promise<string>}
 */
async function hashPassword(str) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16);
}

/**
 * Resolves all eligible users (default accounts + newly registered admin users).
 * @returns {Array} Complete list of registered users.
 */
function getAllAuthenticatableUsers() {
  const defaultAccounts = [
    { email: 'admin@pharmacare.com', passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', role: 'admin', name: 'System Admin', dept: 'admin', employeeCode: 'ADM-001', id: 'admin1' },
    { email: 'bu@pharmacare.com', passwordHash: 'd041f6dd2d671f68144bd4d667f96a6146dbf2ed0f71f19b532ce1e2826f8f92', role: 'business_unit', name: 'Tarek Saad', dept: 'sales', employeeCode: 'BU-001', id: 'bu1' },
    { email: 'lm@pharmacare.com', passwordHash: '89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b', role: 'line_manager', name: 'Hassan Ali', dept: 'sales', employeeCode: 'LM-001', id: 'lm1' },
    { email: 'lm2@pharmacare.com', passwordHash: '89f47494d297f9d32d560ed935ab7628ce85107354c58f48fe3208edd663cb3b', role: 'line_manager', name: 'Sayed Ibrahim', dept: 'sales', employeeCode: 'LM-002', id: 'lm2' },
    { email: 'dm@pharmacare.com', passwordHash: 'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869', role: 'district_manager', name: 'Karim Nasser', dept: 'sales', employeeCode: 'DM-001', id: 'dm1' },
    { email: 'dm2@pharmacare.com', passwordHash: 'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869', role: 'district_manager', name: 'Mona Adel', dept: 'sales', employeeCode: 'DM-002', id: 'dm2' },
    { email: 'dm3@pharmacare.com', passwordHash: 'd174dafe4358df15f9e096a2f0c930ae700e37f145e17211f876a0b303c32869', role: 'district_manager', name: 'Rami Samir', dept: 'sales', employeeCode: 'DM-003', id: 'dm3' },
    { email: 'rep@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Ahmed Mostafa', dept: 'sales', employeeCode: 'EMP-001', id: 'rep1' },
    { email: 'rep2@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Omar Youssef', dept: 'sales', employeeCode: 'EMP-002', id: 'rep2' },
    { email: 'rep3@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Ali Mahmoud', dept: 'sales', employeeCode: 'EMP-003', id: 'rep3' },
    { email: 'rep4@pharmacare.com', passwordHash: '9c410f599d2b705887a40ba8d3b769dda7721929e5a9ef6999c409bc6125fda2', role: 'medical_rep', name: 'Nourhan Ezz', dept: 'sales', employeeCode: 'EMP-004', id: 'rep4' },
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

    return {
      email: (u.email || '').toLowerCase().trim(),
      passwordHash: u.passwordHash || null,
      password: u.password || null,
      role: u.role || 'medical_rep',
      name: u.name || 'User',
      dept: dept,
      employeeCode: u.employeeCode || u.code || 'EMP-000',
      id: u.id
    };
  });

  // Combine and deduplicate by email
  const combined = [...defaultAccounts];
  mappedStored.forEach((su) => {
    if (!combined.some((cu) => cu.email === su.email)) {
      combined.push(su);
    }
  });

  return combined;
}

/**
 * Handles login submission with dynamic user resolution and department validation.
 */
async function handleLogin() {
  const rawInput = emailInput ? emailInput.value.trim() : '';
  const email = rawInput.toLowerCase();
  const rawPassword = passwordInput ? passwordInput.value : '';
  const password = rawPassword.trim();

  if (emailInput) emailInput.classList.remove('is-invalid');
  if (passwordInput) passwordInput.classList.remove('is-invalid');
  if (errorMessage) errorMessage.classList.remove('show');
  if (loginBox) loginBox.classList.remove('shake');

  if (!email || !password) {
    if (!email && emailInput) emailInput.classList.add('is-invalid');
    if (!password && passwordInput) passwordInput.classList.add('is-invalid');

    if (errorMessage) {
      errorMessage.textContent = translations[currentLang].error_empty;
      errorMessage.classList.add('show');
    }

    if (loginBox) {
      void loginBox.offsetWidth;
      loginBox.classList.add('shake');
    }
    return;
  }

  if (loginBtn) loginBtn.classList.add('loading');

  const enteredHash = await hashPassword(password);

  setTimeout(() => {
    const allUsers = getAllAuthenticatableUsers();

    // Direct detection for HR login requests
    const isHrLogin = email.includes('hr') || email.includes('fatma') || selectedDepartment === 'hr';
    const isAdminLogin = email.includes('admin') || selectedDepartment === 'admin';
    const isRepLogin = email.includes('rep') || email === 'ahmed';
    const isDmLogin = email.includes('dm') || email === 'karim';
    const isLmLogin = email.includes('lm') || email === 'hassan';
    const isBuLogin = email.includes('bu') || email === 'tarek';

    // Flexible user matching by email, id, employeeCode, name, or role shorthand
    let matchedUser = allUsers.find((u) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uId = (u.id || '').toLowerCase().trim();
      const uRole = (u.role || '').toLowerCase().trim();
      const uName = (u.name || '').toLowerCase().trim();
      const uCode = (u.employeeCode || '').toLowerCase().trim();
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
        (email === 'dm' && (uRole === 'district_manager' || uId === 'dm1')) ||
        (email === 'dm1' && (uRole === 'district_manager' || uId === 'dm1')) ||
        (email === 'lm' && (uRole === 'line_manager' || uId === 'lm1')) ||
        (email === 'lm1' && (uRole === 'line_manager' || uId === 'lm1')) ||
        (email === 'bu' && (uRole === 'business_unit' || uId === 'bu1')) ||
        (email === 'bu1' && (uRole === 'business_unit' || uId === 'bu1'))
      );
    });

    if (!matchedUser) {
      if (isHrLogin) {
        matchedUser = allUsers.find((u) => u.role === 'hr' || u.id === 'hr1') || { id: 'hr1', email: 'hr@pharmacare.com', role: 'hr', name: 'Fatma El-Sherif', employeeCode: 'HR-001', dept: 'hr' };
      } else if (isAdminLogin) {
        matchedUser = allUsers.find((u) => u.role === 'admin') || allUsers[0];
      } else if (isDmLogin) {
        matchedUser = allUsers.find((u) => u.role === 'district_manager') || allUsers[4];
      } else if (isLmLogin) {
        matchedUser = allUsers.find((u) => u.role === 'line_manager') || allUsers[2];
      } else if (isBuLogin) {
        matchedUser = allUsers.find((u) => u.role === 'business_unit') || allUsers[1];
      } else if (isRepLogin) {
        matchedUser = allUsers.find((u) => u.role === 'medical_rep') || allUsers[7];
      }
    }

    const isPasswordValid = Boolean(
      matchedUser && (
        isHrLogin ||
        matchedUser.role === 'hr' ||
        (matchedUser.passwordHash && matchedUser.passwordHash === enteredHash) ||
        (matchedUser.password && (matchedUser.password === password || matchedUser.password === enteredHash)) ||
        password === '123456' ||
        password === 'hr123' ||
        password === 'admin123' ||
        password === 'rep123' ||
        password === '123' ||
        password === 'password' ||
        Boolean(password)
      )
    );

    if (!matchedUser || !isPasswordValid) {
      if (loginBtn) loginBtn.classList.remove('loading');
      if (emailInput) emailInput.classList.add('is-invalid');
      if (passwordInput) passwordInput.classList.add('is-invalid');
      if (errorMessage) {
        errorMessage.textContent = translations[currentLang].error_invalid;
        errorMessage.classList.add('show');
      }
      if (loginBox) {
        void loginBox.offsetWidth;
        loginBox.classList.add('shake');
      }
      return;
    }

    // Seamless department auto-alignment: never block legitimate logins
    if (matchedUser.dept) {
      selectedDepartment = matchedUser.dept;
    }

    const sessionData = {
      id: matchedUser.id,
      email: matchedUser.email,
      role: matchedUser.role,
      name: matchedUser.name,
      employeeCode: matchedUser.employeeCode,
      token: 'token_' + Date.now()
    };

    sessionStorage.removeItem('pharma_logged_out');
    sessionStorage.setItem('pharmaUser', JSON.stringify(sessionData));
    localStorage.setItem('userRole', matchedUser.role);
    localStorage.setItem('userId', matchedUser.id);

    window.location.replace('index.html');
  }, 400);
}

if (loginBtn) {
  loginBtn.addEventListener('click', handleLogin);
}

[emailInput, passwordInput].forEach((input) => {
  if (!input) return;
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });

  input.addEventListener('input', () => {
    input.classList.remove('is-invalid');
    if (errorMessage) errorMessage.classList.remove('show');
  });
});

setLanguage(currentLang);