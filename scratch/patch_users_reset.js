const fs = require('fs');

let content = fs.readFileSync('js/users.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Update line 1258: default password for newly added user
content = content.replace(
  'else if (!rawExistingUser) passwordHash = await window.hashPassword("123456");',
  'else if (!rawExistingUser) passwordHash = await window.hashPassword("Pharma@2026");'
);

// 2. Update openResetPwdModal and confirmResetPassword
const oldResetBlock = `  openResetPwdModal(id) {
    this.selectedUserId = id;
    this.showModal("resetPwd");
  },
  confirmResetPassword() {
    if (!this.selectedUserId) return;
    this.closeModal("resetPwd");
    showToast("Password reset link has been sent to user email.", "info");
  },`;

const newResetBlock = `  openResetPwdModal(id) {
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

if (!content.includes(oldResetBlock)) {
  console.error('ERROR: oldResetBlock not found');
  process.exit(1);
}

content = content.replace(oldResetBlock, newResetBlock);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/users.js', content, 'utf8');
console.log('js/users.js updated successfully!');
