const fs = require('fs');

console.log('=== Integrating Force Password Change ===');

// ==========================================
// 1. UPDATE js/login.js
// ==========================================
let loginCode = fs.readFileSync('js/login.js', 'utf8');

// A. Insert mustChangePassword check inside handleLogin() right before session creation
const sessionCreateTarget = `        const sessionData = {
          id: matchedUser.id,
          email: matchedUser.email,
          role: matchedUser.role,
          name: matchedUser.name,
          employeeCode: matchedUser.employeeCode,
          lineId: matchedUser.lineId || null,
          lineIds: matchedUser.lineIds || [],
          productIds: matchedUser.productIds || [],
          token: 'token_' + Date.now()
        };`;

const sessionCreateEnhanced = `        const sessionData = {
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

        // First-Time Login / Security Reset Check
        if (matchedUser.mustChangePassword) {
          if (loginBtn) loginBtn.classList.remove('loading');
          showForcePasswordBox(matchedUser, sessionData);
          return;
        }`;

loginCode = loginCode.replace(sessionCreateTarget, sessionCreateEnhanced);

// B. Append the Force Password Change handlers before the final window closure
const forcePasswordHandlers = `
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
        const isAr = currentLang === "ar";
        notice.textContent = isAr
          ? "مرحباً بك يا " + user.name + "! لدواعي الأمان والسرية، يجب تعيين كلمة مرور شخصية جديدة لحسابك للمتابعة."
          : "Welcome, " + user.name + "! For security, you must set a new personal password for your account to continue.";
      }
      const newPassInput = document.getElementById("forceNewPassword");
      if (newPassInput) {
        newPassInput.value = "";
        setTimeout(() => newPassInput.focus(), 150);
      }
      const confirmInput = document.getElementById("forceConfirmPassword");
      if (confirmInput) confirmInput.value = "";
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
    const isAr = currentLang === "ar";

    const showError = (msg) => {
      if (errBox && errText) {
        errText.textContent = msg;
        errBox.style.display = "flex";
      }
      if (submitBtn) submitBtn.classList.remove("loading");
    };

    if (p1.length < 8) {
      showError(isAr ? "يجب ألا تقل كلمة المرور عن 8 خانات." : "Password must be at least 8 characters long.");
      return;
    }
    if (!(/[a-zA-Z]/.test(p1) && /[0-9]/.test(p1))) {
      showError(isAr ? "يجب أن تحتوي كلمة المرور على حروف وأرقام معاً." : "Password must contain both letters and numbers.");
      return;
    }
    if (p1 !== p2) {
      showError(isAr ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      return;
    }

    if (errBox) errBox.style.display = "none";
    if (submitBtn) submitBtn.classList.add("loading");

    try {
      const hasher = window.hashPassword || (async (x) => x);
      const newHash = await hasher(p1);

      if (_pendingForceUser) {
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
        sessionStorage.removeItem("pharma_logged_out");
        sessionStorage.setItem("pharmaUser", JSON.stringify(_pendingForceSession));
        localStorage.setItem("pharmaUser", JSON.stringify(_pendingForceSession));
        localStorage.setItem("userRole", _pendingForceSession.role);
        localStorage.setItem("userId", _pendingForceSession.id);
        window.currentUser = _pendingForceSession;
      }

      window.location.replace("index.html");
    } catch (err) {
      console.error("Error saving new password:", err);
      showError(isAr ? "حدث خطأ أثناء حفظ كلمة المرور، يرجى المحاولة ثانية." : "Error saving password. Please try again.");
    }
  }
  window.submitForcePasswordChange = submitForcePasswordChange;
`;

loginCode = loginCode.replace('})(window, document);', forcePasswordHandlers + '\n})(window, document);');
fs.writeFileSync('js/login.js', loginCode, 'utf8');
console.log('✅ Updated js/login.js with Force Password Change engine');

// ==========================================
// 2. UPDATE js/users.js
// ==========================================
let usersCode = fs.readFileSync('js/users.js', 'utf8');

// A. In saveUser(), default mustChangePassword to true for new users
usersCode = usersCode.replace(
  'passwordHash,',
  'passwordHash,\n      mustChangePassword: id ? (rawExistingUser ? Boolean(rawExistingUser.mustChangePassword) : false) : true,'
);

// B. Update openResetPwdModal and confirmResetPassword
const oldResetMethods = `  openResetPwdModal(id) {
    this.selectedUserId = id;
    this.showModal("resetPwd");
  },
  confirmResetPassword() {
    if (!this.selectedUserId) return;
    this.closeModal("resetPwd");
    showToast("Password reset link has been sent to user email.", "info");
  },`;

const newResetMethods = `  openResetPwdModal(id) {
    this.selectedUserId = id;
    const user = this.users.find((u) => u.id === id);
    if (user && document.getElementById("resetPwdModalText")) {
      const isAr = (window.getCurrentLang && window.getCurrentLang() === "ar");
      document.getElementById("resetPwdModalText").textContent = isAr
        ? "هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم (" + user.name + ")؟ سيتم تعيين كلمة مرور مؤقتة ويُطلب منه تغييرها فور تسجيل دخوله."
        : "Are you sure you want to reset the password for (" + user.name + ")? A temporary password will be set and they will be required to change it on login.";
    }
    this.showModal("resetPwd");
  },
  async confirmResetPassword() {
    if (!this.selectedUserId) return;
    const user = this.users.find((u) => u.id === this.selectedUserId);
    if (!user) return;

    const tempPass = "Pharma@" + new Date().getFullYear();
    const hasher = window.hashPassword || (async (x) => x);
    user.passwordHash = await hasher(tempPass);
    delete user.password;
    user.mustChangePassword = true;

    if (window.store && window.store.users) {
      window.store.users.save(user);
    }

    this.closeModal("resetPwd");

    const isAr = (window.getCurrentLang && window.getCurrentLang() === "ar");
    const msg = isAr
      ? "تم تعيين كلمة المرور المؤقتة: [ " + tempPass + " ] للمستخدم (" + user.name + "). سيُطلب منه تغييرها عند أول تسجيل دخول."
      : "Temporary password set to: [ " + tempPass + " ] for (" + user.name + "). They must change it upon login.";

    if (typeof showToast === "function") {
      showToast(msg, "success");
    }
    this.renderTable();
  },`;

usersCode = usersCode.replace(oldResetMethods, newResetMethods);
fs.writeFileSync('js/users.js', usersCode, 'utf8');
console.log('✅ Updated js/users.js with reset password and mustChangePassword support');
