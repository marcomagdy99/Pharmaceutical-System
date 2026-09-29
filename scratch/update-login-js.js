const fs = require('fs');
let code = fs.readFileSync('js/login.js', 'utf8');

// Normalize line endings
code = code.replace(/\r\n/g, '\n');

// 1. Safe feather replacement
code = code.replace(
  `// Initialize Feather icons\nif (typeof feather !== 'undefined') {\n  feather.replace();\n}`,
  `// Initialize Feather icons safely\ntry {\n  if (typeof feather !== 'undefined' && typeof feather.replace === 'function') {\n    feather.replace();\n  }\n} catch (e) {\n  console.warn("Feather replace skipped:", e);\n}`
);

// 2. Render quick demo accounts & expose globals
const oldShowLoginForm = `function showLoginForm(dept) {
  selectedDepartment = dept;
  if (departmentView) departmentView.style.display = 'none';
  if (loginBox) loginBox.style.display = 'block';

  if (selectedDeptTitle && translations[currentLang]['selected_dept_' + dept]) {
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
  if (errorMessage) {
    errorMessage.classList.remove('show');
  }

  setTimeout(() => {
    if (emailInput) emailInput.focus();
  }, 50);
}`;

const newShowLoginForm = `function renderQuickDemoAccounts(dept) {
  const container = document.getElementById('quickLoginSection');
  if (!container) return;

  const isAr = currentLang === 'ar';
  let accounts = [];

  if (dept === 'admin') {
    accounts = [
      { name: isAr ? 'مسؤول النظام (Admin)' : 'System Administrator', role: 'System Admin', email: 'admin@pharmacare.com', pass: 'admin123', icon: 'fa-shield-alt' }
    ];
  } else if (dept === 'sales') {
    accounts = [
      { name: 'Marco Magdy', role: isAr ? 'مندوب دعاية - المهندسين' : 'Medical Rep - Mohndseen', email: 'rep@pharmacare.com', pass: 'rep123', icon: 'fa-user-md' },
      { name: 'Amir Ayoup', role: isAr ? 'مدير منطقة (District Manager)' : 'District Manager', email: 'dm@pharmacare.com', pass: 'dm123', icon: 'fa-user-tie' },
      { name: 'John Mahfouz', role: isAr ? 'مدير خط (Line Manager)' : 'Line Manager', email: 'lm@pharmacare.com', pass: 'lm123', icon: 'fa-briefcase' },
      { name: 'George Marzok', role: isAr ? 'مدير وحدة أعمال (Business Unit)' : 'Business Unit Head', email: 'bu@pharmacare.com', pass: 'bu123', icon: 'fa-building' }
    ];
  } else if (dept === 'hr') {
    accounts = [
      { name: 'Fatma El-Sherif', role: isAr ? 'مدير الموارد البشرية (HR)' : 'HR Director', email: 'hr@pharmacare.com', pass: 'hr123', icon: 'fa-user-check' }
    ];
  }

  const titleText = isAr ? 'دخول سريع تجريبي بضغطة واحدة:' : 'Quick 1-Click Demo Login:';

  let html = \`
    <div class="quick-login-title">
      <i class="fas fa-bolt text-warning"></i>
      <span>\${titleText}</span>
    </div>
    <div class="quick-chips-grid">
  \`;

  accounts.forEach((acc) => {
    html += \`
      <button type="button" class="quick-user-chip" onclick="quickLoginAs('\${acc.email}', '\${acc.pass}')">
        <div class="quick-chip-info">
          <span class="quick-chip-name"><i class="fas \${acc.icon} me-1 text-primary"></i> \${acc.name}</span>
          <span class="quick-chip-role">\${acc.role}</span>
        </div>
        <span class="quick-chip-arrow">\${isAr ? '←' : '→'}</span>
      </button>
    \`;
  });

  html += \`</div>\`;
  container.innerHTML = html;
}

window.quickLoginAs = function(email, pass) {
  if (emailInput) emailInput.value = email;
  if (passwordInput) passwordInput.value = pass;
  handleLogin();
};

function showLoginForm(dept) {
  selectedDepartment = dept;
  if (departmentView) departmentView.style.display = 'none';
  if (loginBox) loginBox.style.display = 'block';

  if (selectedDeptTitle && translations[currentLang] && translations[currentLang]['selected_dept_' + dept]) {
    selectedDeptTitle.textContent = translations[currentLang]['selected_dept_' + dept];
  }

  renderQuickDemoAccounts(dept);

  // Keep inputs empty for clean user entry
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

  setTimeout(() => {
    if (emailInput) emailInput.focus();
  }, 50);
}

window.showLoginForm = showLoginForm;
window.showDepartmentSelection = showDepartmentSelection;`;

code = code.replace(oldShowLoginForm, newShowLoginForm);

fs.writeFileSync('js/login.js', code, 'utf8');
console.log('js/login.js updated successfully!');
