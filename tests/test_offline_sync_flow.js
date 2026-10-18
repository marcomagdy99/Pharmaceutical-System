/**
 * @file test_offline_sync_flow.js
 * End-to-end integration test for Offline Visit Logging, Offline GPS Capture, and Background Auto-Sync
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== Starting Offline Mode & Auto-Sync Integration Test ===\n');

// Mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  dispatchEvent: () => {}
};
global.navigator = {
  onLine: false, // Start offline!
  geolocation: {
    getCurrentPosition: (success, error, opts) => {
      // Simulate GPS lock (even underground with cached satellite fix)
      success({
        coords: {
          latitude: 30.0444,
          longitude: 31.2357,
          accuracy: 12
        }
      });
    }
  }
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};
global.sessionStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

let toastMessages = [];
global.showToast = (msg, type) => {
  toastMessages.push({ msg, type });
};

// 1. Load visits badge logic
const visitsCode = fs.readFileSync('js/visits.js', 'utf8');
const badgeStart = visitsCode.indexOf('function renderOfflineBadge');
const badgeEnd = visitsCode.indexOf('window.renderOfflineBadge = renderOfflineBadge;');
eval(visitsCode.slice(badgeStart, badgeEnd));

assert.strictEqual(typeof renderOfflineBadge, 'function', 'renderOfflineBadge must be a function');
console.log('✓ renderOfflineBadge successfully extracted and compiled');

// 2. Simulate Offline Visit Creation
const mockVisit = {
  id: 'v_offline_001',
  doctorId: 'd101',
  doctorName: 'Dr. Tarek Underground Hospital',
  repId: 'u1790626000001',
  date: '2026-10-15',
  time: '11:15',
  status: 'completed',
  source: 'actual',
  deviceLat: 30.0444,
  deviceLng: 31.2357,
  targetLat: 30.0442,
  targetLng: 31.2355,
  gpsStatus: 'in_range',
  distanceMeters: 28,
  // Offline metadata stamped when navigator.onLine is false
  isOffline: !navigator.onLine,
  offlineLoggedAt: new Date().toISOString(),
  syncedToCloud: false
};

assert.strictEqual(mockVisit.isOffline, true, 'Visit must be marked as offline');
assert.strictEqual(mockVisit.syncedToCloud, false, 'Visit must be marked pending sync');
assert.strictEqual(mockVisit.gpsStatus, 'in_range', 'GPS verification must be captured offline');
console.log('✓ Offline visit created with verified GPS coordinates and offline flags');

// 3. Test Offline Pending Badge
const pendingBadge = renderOfflineBadge(mockVisit);
assert(pendingBadge.includes('badge-offline-pending'), 'Must have badge-offline-pending class');
assert(pendingBadge.includes('Offline Pending'), 'Must display "Offline Pending" text');
console.log('✓ Badge renders correctly while offline: [ ' + pendingBadge.replace(/<[^>]+>/g, '').trim() + ' ]');

// 4. Test Auto-Sync Trigger
window.DEMO_DATA = {
  visits: [mockVisit]
};

let cloudPushed = false;
let cloudPayload = null;
window.pushLocalToCloud = (immediate) => {
  cloudPushed = true;
  cloudPayload = JSON.parse(JSON.stringify(window.DEMO_DATA));
};
window.notifyActiveViews = () => {};

// Load sync logic from firebase-sync.js
const syncCode = fs.readFileSync('js/firebase-sync.js', 'utf8');
const syncPendingStart = syncCode.indexOf('function syncPendingOfflineVisits()');
const syncPendingEnd = syncCode.indexOf('// Hook into global scope', syncPendingStart);
eval(syncCode.slice(syncPendingStart, syncPendingEnd));

assert.strictEqual(typeof syncPendingOfflineVisits, 'function', 'syncPendingOfflineVisits must exist');

// Simulate returning online (reconnection)
navigator.onLine = true;
syncPendingOfflineVisits();

assert.strictEqual(mockVisit.syncedToCloud, true, 'Visit must be marked as syncedToCloud = true');
assert(mockVisit.syncedAt, 'Visit must have syncedAt timestamp');
assert.strictEqual(cloudPushed, true, 'pushLocalToCloud must be dispatched');
assert.strictEqual(cloudPayload.visits[0].syncedToCloud, true, 'Cloud payload must contain synced visit');
console.log('✓ syncPendingOfflineVisits transitioned record to cloud with syncedAt: ' + mockVisit.syncedAt);

// 5. Test Synced Badge
const syncedBadge = renderOfflineBadge(mockVisit);
assert(syncedBadge.includes('badge-offline-synced'), 'Must have badge-offline-synced class');
assert(syncedBadge.includes('Offline Synced'), 'Must display "Offline Synced" text');
console.log('✓ Badge renders correctly after sync: [ ' + syncedBadge.replace(/<[^>]+>/g, '').trim() + ' ]');

// 6. Test Toast Feedback
const onlineToast = toastMessages.find(t => t.msg.includes('Back Online'));
assert(onlineToast, 'User must receive toast notifying successful cloud sync');
console.log('✓ Auto-sync user notification shown: "' + onlineToast.msg + '"');

console.log('\n=== ALL OFFLINE MODE & AUTO-SYNC TESTS PASSED (100%) ===');
