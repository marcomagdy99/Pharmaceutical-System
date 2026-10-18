// Mock environment
global.window = global;
global.sessionStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.performance = {
  now() { return 12345.67; }
};

// Load app.js code
const fs = require('fs');
const appCode = fs.readFileSync('js/app.js', 'utf8');

// Test NetworkTime definition
eval(appCode.slice(appCode.indexOf('const NetworkTime = {'), appCode.indexOf('window.NetworkTime = NetworkTime;') + 34));

console.log('=== Testing NetworkTime Engine ===');
console.log('NetworkTime defined:', typeof window.NetworkTime === 'object');

// Simulate a sync event: Server says it is 12:00:00 (1790626000000)
// Local device is set 1 hour behind (11:00:00 -> 1790622400000)
const simulatedServerMs = 1790626000000;
window.NetworkTime._applySync(simulatedServerMs, 'origin');

console.log('Offset calculated:', window.NetworkTime.offsetMs, 'ms');
console.log('Is synced:', window.NetworkTime.isSynced);
console.log('Sync source:', window.NetworkTime.syncSource);

const tamperingCheck = window.NetworkTime.checkTampering(5);
console.log('Tampering check result:');
console.log('  isTampered:', tamperingCheck.isTampered);
console.log('  driftMinutes:', tamperingCheck.driftMinutes);
console.log('  serverTime:', tamperingCheck.serverTime.toISOString());
console.log('  deviceTime:', tamperingCheck.deviceTime.toISOString());

if (tamperingCheck.isTampered && Math.abs(tamperingCheck.driftMinutes) > 50) {
  console.log('🎉 SUCCESS: NetworkTime successfully caught the simulated 1-hour clock tampering!');
} else {
  console.error('❌ FAILED to detect tampering!');
  process.exit(1);
}
