const assert = require('assert');

// Mock browser globals
global.window = global;
const mockNavigator = { geolocation: {} };
try {
  Object.defineProperty(global, 'navigator', {
    value: mockNavigator,
    writable: true,
    configurable: true
  });
} catch (e) {
  global.navigator = mockNavigator;
}
global.document = { dispatchEvent: () => {} };
global.CustomEvent = class CustomEvent {};

// Load GpsService
require('../js/gps-service.js');

console.log('Testing Retroactive GPS Resolution...');

// Setup Mock DEMO_DATA
window.DEMO_DATA = {
  doctors: [
    { id: 'doc-101', name: 'Dr. Sameh Bakhom', lat: null, lng: null }
  ],
  visits: [
    {
      id: 'v-001',
      doctorId: 'doc-101',
      doctorName: 'Dr. Sameh Bakhom',
      deviceLat: 30.0444,
      deviceLng: 31.2357,
      targetLat: null,
      targetLng: null,
      gpsStatus: 'no_target_coords',
      distanceMeters: null
    }
  ],
  companySettings: {
    requireGpsValidation: true,
    gpsMaxDistanceMeters: 200
  }
};

window.store = {
  companySettings: {
    get: () => window.DEMO_DATA.companySettings
  },
  doctors: {
    getAll: () => window.DEMO_DATA.doctors,
    getById: (id) => window.DEMO_DATA.doctors.find(d => d.id === id),
    save: (doc) => {
      const idx = window.DEMO_DATA.doctors.findIndex(d => d.id === doc.id);
      if (idx !== -1) window.DEMO_DATA.doctors[idx] = doc;
    }
  }
};

// 1. Initial State: doctor has no coordinates -> badge returns "No Target Coords"
const v1 = window.DEMO_DATA.visits[0];
let badgeHtml = window.GpsService.renderGpsBadge(v1);
assert.ok(badgeHtml.includes('badge-gps-no-coords'), 'Initial badge must be no-coords');
assert.strictEqual(v1.gpsStatus, 'no_target_coords');
console.log('PASS: Initial visit badge is correctly "No Target Coords".');

// 2. Doctor gets coordinates (e.g. pinned near rep: 30.0445, 31.2358 ~15m away)
window.DEMO_DATA.doctors[0].lat = 30.0445;
window.DEMO_DATA.doctors[0].lng = 31.2358;

// Re-render badge: should retroactively calculate distance and display Verified!
badgeHtml = window.GpsService.renderGpsBadge(v1);
assert.ok(badgeHtml.includes('badge-gps-in-range'), 'Badge should retroactively update to in_range');
assert.ok(badgeHtml.includes('Verified'), 'Badge should show Verified');
assert.strictEqual(v1.gpsStatus, 'in_range', 'v.gpsStatus should be updated to in_range');
assert.ok(typeof v1.distanceMeters === 'number' && v1.distanceMeters < 50, 'Distance should be calculated correctly');
console.log(`PASS: Retroactive resolution updated visit to: ${v1.gpsStatus} (${v1.distanceMeters}m).`);

// 3. Test store._applyCoordinates retroactive update
require('../js/store.js');

// Add a new visit with no target coordinates
const v2 = {
  id: 'v-002',
  doctorId: 'doc-102',
  doctorName: 'Dr. Tamer Hosny',
  deviceLat: 30.0500,
  deviceLng: 31.2400,
  targetLat: null,
  targetLng: null,
  gpsStatus: 'no_target_coords',
  distanceMeters: null
};
window.DEMO_DATA.visits.push(v2);
window.DEMO_DATA.doctors.push({ id: 'doc-102', name: 'Dr. Tamer Hosny', lat: null, lng: null });

// Simulate manager approving clinic location request
const requestItem = {
  targetType: 'doctor',
  targetId: 'doc-102',
  targetName: 'Dr. Tamer Hosny',
  newLat: 30.0501,
  newLng: 31.2401
};

window.store.accountLocationRequests._applyCoordinates(requestItem);

// Doctor coords should be updated
const updatedDoc = window.store.doctors.getById('doc-102');
assert.strictEqual(updatedDoc.lat, 30.0501);
assert.strictEqual(updatedDoc.lng, 31.2401);

// Visit v2 should be retroactively updated
assert.strictEqual(v2.targetLat, 30.0501);
assert.strictEqual(v2.targetLng, 31.2401);
assert.strictEqual(v2.gpsStatus, 'in_range');
assert.ok(typeof v2.distanceMeters === 'number' && v2.distanceMeters < 50);
console.log(`PASS: store._applyCoordinates retroactively updated past visit to ${v2.gpsStatus} (${v2.distanceMeters}m).`);

console.log('=== ALL RETROACTIVE GPS TESTS PASSED PERFECTLY! ===');
