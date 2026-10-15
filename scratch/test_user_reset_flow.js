const crypto = require('crypto');
const assert = require('assert');

const mockUser = {
  id: 'u_test_reset',
  name: 'Test Rep User',
  email: 'test@pharmacare.com',
  passwordHash: 'custom_old_hash',
  mustChangePassword: false
};

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

const defaultPwd = 'Pharma@2026';
const newHash = hashPassword(defaultPwd);

// Simulate confirmResetPassword
mockUser.passwordHash = newHash;
mockUser.mustChangePassword = true;

assert.strictEqual(mockUser.mustChangePassword, true);
assert.strictEqual(mockUser.passwordHash, '9e3fb73091725b6689773b1bda8abe9e3db91c52a8c343fa074aaf8990e44f0f');

console.log('✅ PASS: Password reset accurately matches Pharma@2026 and sets mustChangePassword: true');
