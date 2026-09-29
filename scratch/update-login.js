const fs = require('fs');
let html = fs.readFileSync('login.html', 'utf8');

// Normalize line endings to LF
html = html.replace(/\r\n/g, '\n');

// 1. Head injection
const oldHead = '<link rel="stylesheet" href="css/login.css">';
const newHead = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/login.css">
    <script>
      (function () {
        try {
          var theme = localStorage.getItem("pharmaTheme") || "light";
          document.documentElement.setAttribute("data-theme", theme);
        } catch (e) {}
      })();
    </script>`;

html = html.replace(oldHead, newHead);

// 2. Department cards
const oldCards = `<div class="dept-cards">
                    <div class="dept-card" data-dept="admin" id="cardAdmin">
                        <i data-feather="settings"></i>
                        <h3 data-i18n="dept_admin">Admin</h3>
                        <p data-i18n="dept_admin_desc">System Administrators</p>
                    </div>
                    <div class="dept-card" data-dept="sales" id="cardSales">
                        <i data-feather="users"></i>
                        <h3 data-i18n="dept_sales">Sales & Marketing</h3>
                        <p data-i18n="dept_sales_desc">BU, LM, DM, Medical Rep</p>
                    </div>
                    <div class="dept-card" data-dept="hr" id="cardHR">
                        <i data-feather="user"></i>
                        <h3 data-i18n="dept_hr">Human Resources</h3>
                        <p data-i18n="dept_hr_desc">HR & Personnel</p>
                    </div>
                </div>`;

const newCards = `<div class="dept-cards">
                    <div class="dept-card" data-dept="admin" id="cardAdmin" onclick="showLoginForm('admin')">
                        <div class="dept-icon-wrapper">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <h3 data-i18n="dept_admin">Admin</h3>
                        <p data-i18n="dept_admin_desc">System Administrators</p>
                    </div>
                    <div class="dept-card" data-dept="sales" id="cardSales" onclick="showLoginForm('sales')">
                        <div class="dept-icon-wrapper">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3 data-i18n="dept_sales">Sales & Marketing</h3>
                        <p data-i18n="dept_sales_desc">BU, LM, DM, Medical Rep</p>
                    </div>
                    <div class="dept-card" data-dept="hr" id="cardHR" onclick="showLoginForm('hr')">
                        <div class="dept-icon-wrapper">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <h3 data-i18n="dept_hr">Human Resources</h3>
                        <p data-i18n="dept_hr_desc">HR & Personnel</p>
                    </div>
                </div>`;

html = html.replace(oldCards, newCards);

// 3. Back button onclick
html = html.replace('id="backToDept">', 'id="backToDept" onclick="showDepartmentSelection()">');

// 4. Input icons
html = html.replace('<i data-feather="mail" class="input-icon"></i>', '<i class="fas fa-envelope input-icon" style="line-height: inherit; font-size: 16px;"></i>');
html = html.replace('<i data-feather="lock" class="input-icon"></i>', '<i class="fas fa-lock input-icon" style="line-height: inherit; font-size: 16px;"></i>');
html = html.replace('<i data-feather="eye" id="eyeIcon"></i>', '<i class="fas fa-eye" id="eyeIcon"></i>');
html = html.replace('<i data-feather="arrow-left"></i>', '<i class="fas fa-arrow-left"></i>');
html = html.replace('<i data-feather="globe" style="width: 16px; height: 16px;"></i>', '<i class="fas fa-globe"></i>');

// 5. Quick login section
html = html.replace(
  /<\/button>\s*<div class="login-footer">/m,
  `</button>

                <!-- Quick 1-Click Access Section -->
                <div id="quickLoginSection" class="quick-login-wrapper"></div>

                <div class="login-footer">`
);

fs.writeFileSync('login.html', html, 'utf8');
console.log('login.html updated successfully!');
