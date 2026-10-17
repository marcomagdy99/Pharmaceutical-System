const assert = require('assert');

const STORAGE_KEYS = Object.freeze({
  // Session & Authentication
  USER: "pharmaUser",
  USER_ID: "userId",
  USER_ROLE: "userRole",
  LOGGED_OUT: "pharma_logged_out",
  IMPERSONATING_ADMIN: "impersonating_admin",

  // Preferences & Appearance
  THEME: "pharmaTheme",
  LANG: "pharmaLang",
  FALLBACK_LANG: "lang",

  // Master & Core Data Stores
  MASTER_DATA: "pharma_master_data",
  SALES_DATA: "pharma_sales_data",
  COMPANY_SETTINGS: "pharma_company_settings",
  SERVICES_DATA: "pharma_services_data",
  EXPENSES_DATA: "pharma_expenses_data",
  SALES_BUDGETS: "pharma_sales_budgets",
  ANNOUNCEMENTS: "pharmaAnnouncements",
  PUBLIC_HOLIDAYS: "pharma_public_holidays",
  DM_ACCOMPANIMENTS: "pharma_dm_accompaniments",
  ACTIVITIES_DATA: "pharma_activities_data",
  REPORTS_DATA: "pharma_reports_data",
  QUIZZES: "pharma_quizzes",
  QUIZ_SCORES: "pharma_quiz_scores",

  // Offline & Synchronization
  OFFLINE_QUEUE: "pharma_offline_queue",
  OFFLINE_SYNC_LOG: "pharma_offline_sync_log",
});

// Mock localStorage
const mockStorage = {};
const localStorage = {
  getItem: k => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: k => { delete mockStorage[k]; }
};

const StorageUtil = Object.freeze({
  get(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(key);
      if (val === null || val === undefined) return defaultValue;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    } catch (e) {
      console.warn("StorageUtil.get failed for key:", key, e);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      const str = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
      localStorage.setItem(key, str);
      return true;
    } catch (e) {
      console.warn("StorageUtil.set failed for key:", key, e);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn("StorageUtil.remove failed for key:", key, e);
      return false;
    }
  },
});

// Tests
// 1. Immutable
assert.strictEqual(Object.isFrozen(STORAGE_KEYS), true);
assert.strictEqual(Object.isFrozen(StorageUtil), true);

// 2. Default value when missing
assert.strictEqual(StorageUtil.get(STORAGE_KEYS.USER, null), null);
assert.strictEqual(StorageUtil.get(STORAGE_KEYS.THEME, 'light'), 'light');

// 3. String set and get
StorageUtil.set(STORAGE_KEYS.THEME, 'dark');
assert.strictEqual(StorageUtil.get(STORAGE_KEYS.THEME), 'dark');

// 4. Object set and get (auto JSON serialization/deserialization)
const testUser = { id: 'u123', name: 'Dr. Test', role: 'medical_rep' };
StorageUtil.set(STORAGE_KEYS.USER, testUser);
const retrievedUser = StorageUtil.get(STORAGE_KEYS.USER);
assert.deepStrictEqual(retrievedUser, testUser);

// 5. Remove
StorageUtil.remove(STORAGE_KEYS.USER);
assert.strictEqual(StorageUtil.get(STORAGE_KEYS.USER), null);

console.log('STORAGE_KEYS & StorageUtil: ALL 100% UNIT TESTS PASSED!');
