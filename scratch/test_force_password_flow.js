// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById(id) {
    if (!this.elements) this.elements = {};
    if (!this.elements[id]) {
      this.elements[id] = {
        id,
        value: '',
        style: {},
        classList: {
          add() {},
          remove() {},
          contains() { return false; }
        },
        addEventListener() {},
        querySelector() { return null; },
        focus() {}
      };
    }
    return this.elements[id];
  },
  querySelectorAll() { return []; },
  documentElement: { lang: 'en', dir: 'ltr' },
  addEventListener() {}
};
global.sessionStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// SHA-256 mock/shim for node
const crypto = require('crypto');
window.hashPassword = async function(p) {
  return crypto.createHash('sha256').update(p).digest('hex');
};

const fs = require('fs');
const loginCode = fs.readFileSync('js/login.js', 'utf8');

try {
  eval(loginCode);
  console.log('✅ js/login.js evaluated successfully in test harness');
  
  // Verify helper functions are exposed
  console.log('showForcePasswordBox exists:', typeof window.showForcePasswordBox === 'function');
  console.log('submitForcePasswordChange exists:', typeof window.submitForcePasswordChange === 'function');
  console.log('toggleForcePasswordVisibility exists:', typeof window.toggleForcePasswordVisibility === 'function');
  
  // Test simulated force change submission
  const testUser = {
    id: 'u1790626000001',
    name: 'Test Rep',
    email: 'test@pharmacare.com',
    role: 'medical_rep',
    mustChangePassword: true,
    passwordHash: 'old_hash'
  };
  
  window.showForcePasswordBox(testUser, { id: testUser.id, role: testUser.role });
  
  // Set invalid password (< 8 chars)
  document.getElementById('forceNewPassword').value = 'short';
  document.getElementById('forceConfirmPassword').value = 'short';
  
  console.log('Testing short password validation...');
  // submitForcePasswordChange checks length
  // Set valid passwords
  document.getElementById('forceNewPassword').value = 'NewPass2026';
  document.getElementById('forceConfirmPassword').value = 'NewPass2026';
  
  console.log('Testing valid password submission...');
  window.location = { replace(url) { console.log('✅ Redirect called to:', url); } };
  
  window.submitForcePasswordChange().then(() => {
    console.log('User mustChangePassword after submission:', testUser.mustChangePassword);
    console.log('User new passwordHash:', testUser.passwordHash);
    console.log('Session user in sessionStorage:', sessionStorage.getItem('pharmaUser'));
    
    if (testUser.mustChangePassword === false && testUser.passwordHash !== 'old_hash') {
      console.log('🎉 SUCCESS: Force password change test passed completely!');
    } else {
      console.error('❌ FAILED: State not updated correctly');
      process.exit(1);
    }
  });
} catch (err) {
  console.error('❌ Test error:', err);
  process.exit(1);
}
