const fs = require('fs');

let content = fs.readFileSync('js/users.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. In table render, only show the key button if isRealAdmin is true
content = content.replace(
  '<button class="btn btn-sm btn-light text-warning me-1" onclick="userMgmt.openResetPwdModal(\'${u.id}\')"><i class="fas fa-key"></i></button>',
  '${isRealAdmin ? `<button class="btn btn-sm btn-light text-warning me-1" title="Reset Password" onclick="userMgmt.openResetPwdModal(\'${u.id}\')"><i class="fas fa-key"></i></button>` : ""}'
);

// 2. In openResetPwdModal and confirmResetPassword, enforce isRealAdmin check
const targetOpen = `  openResetPwdModal(id) {
    this.selectedUserId = id;
    const user = this.users.find((u) => u.id === id) || (window.store && window.store.users && window.store.users.getById(id));
    const nameEl = document.getElementById("resetPwdUserName");
    if (nameEl) nameEl.textContent = user ? user.name : "this user";
    this.showModal("resetPwd");
  },
  async confirmResetPassword() {
    if (!this.selectedUserId) return;
    const user = this.users.find((u) => u.id === this.selectedUserId) || (window.store && window.store.users && window.store.users.getById(this.selectedUserId));
    if (!user) {
      this.closeModal("resetPwd");
      return;
    }

    const defaultPwd = "Pharma@2026";
    const newHash = await window.hashPassword(defaultPwd);
    user.passwordHash = newHash;
    user.mustChangePassword = true;

    if (window.store && window.store.users && typeof window.store.users.save === "function") {
      window.store.users.save(user);
    } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) {
      const idx = window.DEMO_DATA.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) window.DEMO_DATA.users[idx] = { ...window.DEMO_DATA.users[idx], ...user };
    }

    this.closeModal("resetPwd");
    showToast(\`Password for \${user.name} reset to \${defaultPwd} successfully. User must set a new password on next login.\`, "success");
  },`;

const replacementOpen = `  openResetPwdModal(id) {
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    const normRole = (window.normalizeRole ? window.normalizeRole(authUser.role) : (authUser.role || "")).toLowerCase();
    const isRealAdmin = normRole === "admin" || (authUser.role || "").toLowerCase() === "admin" || Boolean(sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin"));
    if (!isRealAdmin) {
      if (typeof showToast === "function") showToast("Permission Denied: Only Administrator can reset passwords.", "error");
      return;
    }
    this.selectedUserId = id;
    const user = this.users.find((u) => u.id === id) || (window.store && window.store.users && window.store.users.getById(id));
    const nameEl = document.getElementById("resetPwdUserName");
    if (nameEl) nameEl.textContent = user ? user.name : "this user";
    this.showModal("resetPwd");
  },
  async confirmResetPassword() {
    if (!this.selectedUserId) return;
    const authUser = (window.checkAuth && window.checkAuth()) || {};
    const normRole = (window.normalizeRole ? window.normalizeRole(authUser.role) : (authUser.role || "")).toLowerCase();
    const isRealAdmin = normRole === "admin" || (authUser.role || "").toLowerCase() === "admin" || Boolean(sessionStorage.getItem("impersonating_admin") || localStorage.getItem("impersonating_admin"));
    if (!isRealAdmin) {
      this.closeModal("resetPwd");
      if (typeof showToast === "function") showToast("Permission Denied: Only Administrator can reset passwords.", "error");
      return;
    }

    const user = this.users.find((u) => u.id === this.selectedUserId) || (window.store && window.store.users && window.store.users.getById(this.selectedUserId));
    if (!user) {
      this.closeModal("resetPwd");
      return;
    }

    const defaultPwd = "Pharma@2026";
    const newHash = await window.hashPassword(defaultPwd);
    user.passwordHash = newHash;
    user.mustChangePassword = true;

    if (window.store && window.store.users && typeof window.store.users.save === "function") {
      window.store.users.save(user);
    } else if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users)) {
      const idx = window.DEMO_DATA.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) window.DEMO_DATA.users[idx] = { ...window.DEMO_DATA.users[idx], ...user };
    }

    this.closeModal("resetPwd");
    showToast(\`Password for \${user.name} reset to \${defaultPwd} successfully. User must set a new password on next login.\`, "success");
  },`;

if (!content.includes(targetOpen)) {
  console.error('ERROR: targetOpen not found');
  process.exit(1);
}

content = content.replace(targetOpen, replacementOpen);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/users.js', content, 'utf8');
console.log('js/users.js successfully updated with strict Admin-only security check!');
