const fs = require('fs');
const assert = require('assert');
const crypto = require('crypto');

global.window = global;
global.CustomEvent = class CustomEvent {};
global.document = {
  getElementById: (id) => ({
    textContent: '',
    innerText: '',
    value: '',
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {},
    reset() {}
  }),
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {}
};

global.showToast = (msg, type) => {
  console.log(`[Toast ${type}]: ${msg}`);
};

global.hashPassword = async (pwd) => {
  return crypto.createHash('sha256').update(pwd).digest('hex');
};

// Mock user in DEMO_DATA
window.DEMO_DATA = {
  users: [
    {
      id: 'u1790626000001',
      name: 'Ahmed Mahmoud',
      email: 'ahmed@pharmacare.com',
      role: 'medical_rep',
      passwordHash: 'custom_employee_password_hash_xyz',
      mustChangePassword: false
    }
  ]
};

// Evaluate store.js
const storeJs = fs.readFileSync('js/store.js', 'utf8');
eval(storeJs);

// Evaluate users.js
const usersJs = fs.readFileSync('js/users.js', 'utf8');
eval(usersJs);

// Verify user before reset
const userBefore = window.store.users.getById('u1790626000001');
console.log('1. User before reset:', {
  name: userBefore.name,
  mustChangePassword: userBefore.mustChangePassword,
  passwordHash: userBefore.passwordHash
});

(async () => {
  // Simulate clicking the reset key button on user u1790626000001
  window.userMgmt.users = window.store.users.getAll();
  window.userMgmt.openResetPwdModal('u1790626000001');

  // Simulate clicking confirm reset
  await window.userMgmt.confirmResetPassword();

  const userAfter = window.store.users.getById('u1790626000001');
  console.log('2. User after reset:', {
    name: userAfter.name,
    mustChangePassword: userAfter.mustChangePassword,
    passwordHash: userAfter.passwordHash
  });

  const expectedHash = await hashPassword('Pharma@2026');
  assert.strictEqual(userAfter.mustChangePassword, true, 'mustChangePassword must be true');
  assert.strictEqual(userAfter.passwordHash, expectedHash, 'passwordHash must match Pharma@2026 hash');

  console.log('🎉 100% SUCCESS: The real userMgmt.confirmResetPassword() function works perfectly end-to-end!');
})();
