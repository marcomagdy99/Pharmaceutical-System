const fs = require('fs');
const assert = require('assert');
const crypto = require('crypto');

global.window = global;
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
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
global.checkAuth = () => ({ id: 'admin1', role: 'admin', name: 'System Admin' });
let resetEmailSentTo = null;
global.navigator = { onLine: true };
global.firebase = {
  apps: [{}],
  auth: () => ({
    sendPasswordResetEmail: async (em) => { resetEmailSentTo = em; }
  })
};

  // Simulate clicking the reset key button on user u1790626000001
  window.userMgmt.users = window.store.users.getAll();
  window.userMgmt.openResetPwdModal('u1790626000001');

  // Simulate clicking confirm reset
  await window.userMgmt.confirmResetPassword();

  const userAfter = window.store.users.getById('u1790626000001');
  console.log('2. User after reset:', {
    name: userAfter.name,
    mustChangePassword: userAfter.mustChangePassword,
    resetEmailSentTo
  });

  assert.strictEqual(resetEmailSentTo, 'ahmed@pharmacare.com', 'Firebase sendPasswordResetEmail must be triggered for target user email');
  assert.strictEqual(userAfter.mustChangePassword, true, 'mustChangePassword must be true');
  assert.strictEqual(userAfter.password, undefined, 'No plaintext password may remain');

  console.log('🎉 100% SUCCESS: The real userMgmt.confirmResetPassword() triggers Firebase Auth reset email and updates metadata!');
})();
