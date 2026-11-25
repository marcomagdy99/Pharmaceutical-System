const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function runStoreHardeningTests() {
  const localStore = {};
  const saveEvents = [];
  let storageWriteCount = 0;
  let salesWriteCount = 0;

  const users = [
    { id: 'admin1', name: 'Admin', role: 'admin', status: 'Active' },
    { id: 'bu1', name: 'BU Head', role: 'business_unit', status: 'Active' },
    { id: 'lm1', name: 'LM One', role: 'line_manager', managerId: 'bu1', lineId: 'l1', status: 'Active' },
    { id: 'dm1', name: 'DM One', role: 'district_manager', managerId: 'lm1', lineId: 'l1', status: 'Active' },
    { id: 'rep_direct', name: 'Direct Rep', role: 'medical_rep', managerId: 'lm1', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'rep_orphan', name: 'Orphan Rep', role: 'medical_rep', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'rep_active', name: 'Active Rep', role: 'medical_rep', managerId: 'dm1', lineId: 'l1', lineIds: ['l1'], status: 'Active' },
    { id: 'u1790626000001', name: 'Rep One', role: 'medical_rep', managerId: 'dm1', lineId: 'l1', status: 'Active' }
  ];

  const areas = [
    { id: 'a_direct', name: 'Direct Area', lineId: 'l1', repId: 'rep_direct' },
    { id: 'a_active', name: 'Active Area', lineId: 'l1', repId: 'rep_active' },
    { id: 'a_vacant', name: 'Vacant Area', lineId: 'l1', repId: null, dmId: 'dm1' }
  ];

  const productLines = [
    {
      id: 'l1',
      name: 'Cardio Line',
      lineManagerId: 'lm1',
      products: [
        {
          id: 'p1',
          name: 'Atorva',
          aliases: [{ distributorId: 'dist_1790626000001', rawText: 'ATORVA 20' }]
        }
      ]
    }
  ];

  const sandbox = {
    console,
    Date,
    Math,
    JSON,
    DEMO_DATA: {
      users,
      areas,
      productLines,
      doctors: [],
      pharmacies: [],
      hospitals: [],
      visits: [],
      targets: [],
      bulkWeights: [],
      pharmacyOverrides: [],
      distributorSales: [],
      notifications: [],
      accountLocationRequests: [],
      companySettings: { gpsMaxDistanceMeters: 200 }
    },
    localStorage: {
      getItem: (k) => (k in localStore ? localStore[k] : null),
      setItem: (k, v) => { localStore[k] = String(v); }
    },
    document: {
      dispatchEvent: (evt) => {
        if (evt && evt.detail) saveEvents.push(evt.detail);
      }
    },
    CustomEvent: function (type, opts) {
      this.type = type;
      this.detail = opts && opts.detail;
    },
    saveDataToStorage: () => { storageWriteCount++; },
    saveSalesDataToStorage: () => { salesWriteCount++; },
    normalizeRole: (r) => {
      const v = String(r || '').toLowerCase().trim();
      if (v === 'gm') return 'general_manager';
      if (v === 'lm') return 'line_manager';
      if (v === 'dm') return 'district_manager';
      if (v === 'bu') return 'business_unit';
      if (v === 'rep') return 'medical_rep';
      return v;
    },
    isRepRole: (u) => sandbox.normalizeRole(u && u.role) === 'medical_rep',
    addWorkflowNotification: (n) => sandbox.store.notifications.add(n)
  };
  sandbox.window = sandbox;

  const ctx = vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(process.cwd(), 'js/store.js'), 'utf8');
  vm.runInContext(code, ctx, { filename: 'js/store.js' });

  const s = ctx.store;

  console.log('=== Store Hardening Regression Tests ===');

  // 1. Direct-to-LM hierarchy resolution (dmId MUST be null, lmId MUST be lm1, NOT dmId=lm1 & lmId=bu1)
  const docSaved = s.doctors.save({ name: 'Dr. Direct', areaId: 'a_direct', repId: 'rep_direct' });
  assert.strictEqual(docSaved.dmId || null, null, 'Doctor under direct-to-LM rep must have dmId = null');
  assert.strictEqual(docSaved.lmId, 'lm1', 'Doctor under direct-to-LM rep must have lmId = lm1');

  const pharmSaved = s.pharmacies.save({ name: 'Pharm Direct', areaId: 'a_direct', repId: 'rep_direct' });
  assert.strictEqual(pharmSaved.dmId || null, null, 'Pharmacy under direct-to-LM rep must have dmId = null');
  assert.strictEqual(pharmSaved.lmId, 'lm1', 'Pharmacy under direct-to-LM rep must have lmId = lm1');

  const hospSaved = s.hospitals.save({ name: 'Hosp Direct', areaId: 'a_direct', repId: 'rep_direct' });
  assert.strictEqual(hospSaved.dmId || null, null, 'Hospital under direct-to-LM rep must have dmId = null');
  assert.strictEqual(hospSaved.lmId, 'lm1', 'Hospital under direct-to-LM rep must have lmId = lm1');

  // 2. unmatchProductAliasRows uses row.product & legacyDistMap
  salesWriteCount = 0;
  s.distributorSales.addBatch([
    {
      id: 'dsale_' + Date.now() + '_1',
      distributorId: 'dist1',
      month: '2026-11',
      product: 'ATORVA 20',
      areaRaw: 'Unknown Area',
      pharmacyCode: 'PH1',
      pharmacyName: 'Pharm One',
      quantity: 10,
      value: 500,
      repId: null,
      dmId: null,
      lmId: null,
      lineId: null,
      areaId: null
    }
  ]);
  assert.strictEqual(salesWriteCount, 1, 'addBatch must trigger saveSalesDataToStorage only once (no double autoSave)');
  assert.strictEqual(s.distributorSales.getAll()[0].productId, 'p1', 'Batch matched product via legacy dist1 alias');

  const removedProdAlias = s.productLines.removeProductAlias('l1', 'p1', 'dist_1790626000001', 'ATORVA 20');
  assert.strictEqual(removedProdAlias, true);
  assert.strictEqual(s.distributorSales.getAll()[0].productId, null, 'unmatchProductAliasRows must clear productId matched on row.product');
  assert.strictEqual(s.distributorSales.getAll()[0].lineId, null, 'unmatchProductAliasRows must clear lineId');

  // 3. addAlias / removeAlias handle legacyDistMap
  s.areas.addAlias('a_direct', 'dist1', 'DIRECT RAW');
  assert.strictEqual(s.areas.getById('a_direct').aliases[0].distributorId, 'dist_1790626000001', 'addAlias normalizes dist1');
  const remAreaAlias = s.areas.removeAlias('a_direct', 'dist_1790626000001', 'DIRECT RAW');
  assert.strictEqual(remAreaAlias, true, 'removeAlias matches normalized distributorId');

  // 4. getPendingAreaTexts ignores vacant area matched via pharmacyOverride, and future_only timestamp honored in applyAreaMatching
  const oldTs = Date.now() - 100000;
  const ovTime = new Date(Date.now() - 50000).toISOString();
  s.pharmacyOverrides.save({
    id: 'ov_future',
    distributorId: 'dist_1790626000001',
    pharmacyCode: 'VAC_PH',
    pharmacyName: 'Vacant Pharm',
    areaId: 'a_vacant',
    effectiveScope: 'future_only',
    createdMonth: '2026-11',
    createdAt: ovTime
  });
  ctx.DEMO_DATA.distributorSales.push(
    {
      id: `dsale_${oldTs}_old`,
      distributorId: 'dist_1790626000001',
      month: '2026-11',
      product: 'P',
      areaRaw: 'Unlinked Raw Old',
      pharmacyCode: 'VAC_PH',
      pharmacyName: 'Vacant Pharm',
      value: 100,
      areaId: null,
      repId: null
    },
    {
      id: `dsale_${Date.now()}_new`,
      distributorId: 'dist_1790626000001',
      month: '2026-11',
      product: 'P',
      areaRaw: 'Unlinked Raw New',
      pharmacyCode: 'VAC_PH',
      pharmacyName: 'Vacant Pharm',
      value: 100,
      areaId: null,
      repId: null
    }
  );
  s.distributorSales.applyAreaMatching(true, false);
  const oldRow = s.distributorSales.getAll().find((r) => r.id.endsWith('_old'));
  const newRow = s.distributorSales.getAll().find((r) => r.id.endsWith('_new'));
  assert.strictEqual(oldRow.areaId, null, 'future_only override must NOT apply to older import in applyAreaMatching');
  assert.strictEqual(newRow.areaId, 'a_vacant', 'future_only override MUST apply to newer import');
  const pending = s.distributorSales.getPendingAreaTexts();
  assert(!pending.some((p) => p.areaRaw === 'Unlinked Raw New'), 'Vacant area matched by override (areaId set) must not stay in getPendingAreaTexts');

  // 5. Fail-Closed activities & notifications (no u1790626000001 fallback)
  const actNull = s.activities.save(null, '2026-11-15', 'AM', { type: 'office' });
  assert.strictEqual(actNull, null, 'activities.save(null) must fail closed');
  assert.strictEqual(Object.keys(s.activities.getAllForUser(null)).length, 0, 'activities.getAllForUser(null) fails closed');
  assert.strictEqual(Object.keys(s.activities.getAllForUser('u1790626000001')).length, 0, 'u1790626000001 must not receive null-user activity writes');
  const notifNoUser = s.notifications.add({ title: 'Sys' });
  assert.strictEqual(notifNoUser.userId, null, 'notifications.add without userId must default to null, not u1790626000001');

  // 6. accountLocationRequests routes orphan rep to admin (not "all") and supports 'gm' role
  const locReq = s.accountLocationRequests.submit({
    targetId: docSaved.id,
    targetType: 'doctor',
    targetName: 'Dr. Direct',
    newLat: 30.0,
    newLng: 31.0,
    repId: 'rep_orphan',
    repName: 'Orphan Rep'
  });
  const locNotif = s.notifications.getAll()[0];
  assert.strictEqual(locNotif.userId, 'admin1', 'Orphan rep location request notification must route to admin, not all');
  const gmAttempt = s.accountLocationRequests.advanceApproval(locReq.id, { id: 'gm1', name: 'GM', role: 'gm' }, 'no-op');
  assert.strictEqual(gmAttempt, null, 'GM is view-only and must not approve location requests');
  assert.notStrictEqual(s.accountLocationRequests.getById(locReq.id).status, 'approved', 'Location request remains pending after GM attempt');
  s.accountLocationRequests.advanceApproval(locReq.id, { id: 'admin1', name: 'Admin', role: 'admin' }, 'ok');
  assert.strictEqual(s.accountLocationRequests.getById(locReq.id).status, 'approved', 'admin role must approve location request');

  // 7. targets.save prevents overwriting a different target id when composite key collides
  const t1 = s.targets.save({ areaId: 'a_active', productId: 'p1', month: '2026-11', target: 100 });
  const t2 = s.targets.save({ areaId: 'a_direct', productId: 'p1', month: '2026-11', target: 200 });
  s.targets.save({ id: t2.id, areaId: 'a_active', productId: 'p1', month: '2026-11', target: 999 });
  assert.strictEqual(s.targets.getById(t1.id).target, 100, 't1 must not be overwritten by colliding edit on t2');
  assert.strictEqual(s.targets.getById(t2.id).areaId, 'a_direct', 't2 must retain original areaId on collision');

  // 8. areas.save returns persisted id & users.save syncs stale area when rep becomes Inactive
  const newArea = s.areas.save({ name: 'New Brand Area', lineId: 'l1' });
  assert(newArea && newArea.id && newArea.id.startsWith('area_'), 'areas.save returns created area with generated id');
  const activeDoc = s.doctors.save({ name: 'Dr. Active', areaId: 'a_active', repId: 'rep_active' });
  assert.strictEqual(activeDoc.dmId, 'dm1', 'Initially Dr. Active has dmId=dm1');
  s.users.save({ id: 'rep_active', status: 'Inactive' });
  assert.strictEqual(s.areas.getById('a_active').repId, null, 'Setting rep Inactive via store.users.save must unassign their stale area');
  // 9. reassignAreaCustomers / syncAreasFromStore update dmId/lmId (not frozen to old rep's manager)
  assert.strictEqual(s.doctors.getById(activeDoc.id).dmId, null, 'Vacant area without DM binding clears dmId on customers');
  s.areas.save({ id: 'a_active', repId: 'u1790626000001' }); // reassign back to dm1's rep
  assert.strictEqual(s.doctors.getById(activeDoc.id).dmId, 'dm1', 'Reassigning area rep refreshes dmId on customers');
  assert.strictEqual(s.doctors.getById(activeDoc.id).lmId, 'lm1', 'Reassigning area rep refreshes lmId on customers');

  // 10. Vacant brick bulk rows receive dmId/lmId from area manager binding
  ctx.DEMO_DATA.productLines[0].products[0].cutPoint = 5;
  s.bulkWeights.saveAll('p1', [{ areaId: 'a_vacant', weight: 100, lineId: 'l1' }]);
  ctx.DEMO_DATA.distributorSales.push({
    id: 'dsale_bulk_src',
    distributorId: 'dist_1790626000001',
    month: '2026-11',
    product: 'Atorva',
    productId: 'p1',
    lineId: 'l1',
    pharmacyCode: 'BULK_PH',
    pharmacyName: 'Bulk Pharm',
    areaId: 'a_active',
    repId: 'u1790626000001',
    quantity: 20,
    value: 2000
  });
  s.distributorSales.applyCutPointAndBulk(false);
  const vacantBulkRow = s.distributorSales.getAll().find((r) => r.salesType === 'bulk' && r.areaId === 'a_vacant');
  assert(vacantBulkRow, 'Bulk row generated for vacant area');
  assert.strictEqual(vacantBulkRow.dmId, 'dm1', 'Vacant brick bulk row must inherit area dmId');
  assert.strictEqual(vacantBulkRow.lmId, 'lm1', 'Vacant brick bulk row must inherit area lmId');

  // 11. Notifications broadcast protection (markAllAsRead uses readBy, clearAll preserves "all" for non-admin)
  ctx.DEMO_DATA.notifications = [];
  const broadcastNotif = s.notifications.add({ userId: 'all', title: 'Company Announcement' });
  const personalNotif = s.notifications.add({ userId: 'rep_direct', title: 'Personal Alert' });
  assert.strictEqual(s.notifications.getUnreadCount('rep_direct'), 2);
  assert.strictEqual(s.notifications.getUnreadCount('u1790626000001'), 1);
  s.notifications.markAllAsRead('rep_direct');
  assert.strictEqual(s.notifications.getUnreadCount('rep_direct'), 0, 'rep_direct read all their notifications');
  assert.strictEqual(s.notifications.getUnreadCount('u1790626000001'), 1, 'Broadcast must remain unread for other users');
  s.notifications.clearAll('rep_direct'); // non-admin
  assert(s.notifications.getAll().some((n) => n.id === broadcastNotif.id), 'Non-admin clearAll must NOT delete broadcast notification');
  assert(!s.notifications.getAll().some((n) => n.id === personalNotif.id), 'Personal notification cleared');

  // 12. areas.delete clears customer areaId and cleans bulkWeights
  const docTempArea = s.doctors.save({ name: 'Dr. Temp', areaId: newArea.id });
  s.bulkWeights.saveAll('p1', [{ areaId: newArea.id, weight: 50, lineId: 'l1' }, { areaId: 'a_vacant', weight: 50, lineId: 'l1' }]);
  s.areas.delete(newArea.id);
  assert.strictEqual(s.doctors.getById(docTempArea.id).areaId, null, 'Deleting area must clear areaId on linked doctors');
  assert(!s.bulkWeights.getAll().some((w) => w.areaId === newArea.id), 'Deleting area must remove orphan bulkWeights');

  // 13. revertPharmacyOverride & addProductAlias/removeProductAlias normalize legacy dist1 ID
  ctx.DEMO_DATA.distributorSales.push({
    id: 'dsale_rev_legacy',
    distributorId: 'dist1',
    month: '2026-11',
    product: 'Atorva',
    productId: 'p1',
    lineId: 'l1',
    pharmacyCode: 'VAC_PH',
    pharmacyName: 'Vacant Pharm',
    areaId: 'a_vacant',
    repId: null,
    value: 100
  });
  const revCount = s.distributorSales.revertPharmacyOverride({
    distributorId: 'dist_1790626000001',
    pharmacyCode: 'VAC_PH',
    pharmacyName: 'Vacant Pharm',
    areaId: 'a_vacant'
  });
  assert(revCount >= 1, 'revertPharmacyOverride must normalize legacy dist1 distributorId');
  s.productLines.addProductAlias('l1', 'p1', 'dist1', 'ATORVA LEGACY');
  assert(s.productLines.removeProductAlias('l1', 'p1', 'dist_1790626000001', 'ATORVA LEGACY'), 'removeProductAlias must match across dist1 and normalized ID');

  // 14. store.leaves.save upsert support
  const lv1 = s.leaves.save({ userId: 'rep_direct', startDate: '2026-11-20', endDate: '2026-11-20', status: 'pending' });
  assert(lv1 && lv1.id && lv1.id.startsWith('lv_'), 'store.leaves.save creates leave with id');
  const lv1Upd = s.leaves.save({ id: lv1.id, status: 'approved' });
  assert.strictEqual(lv1Upd.status, 'approved', 'store.leaves.save updates existing leave');
  assert.strictEqual(s.leaves.getAll().length, 1, 'store.leaves.save does not duplicate on update');

  // 15. accountLocationRequests.advanceApproval & reject enforce RBAC & block self-approval
  const locReq2 = s.accountLocationRequests.submit({
    targetId: docSaved.id,
    targetType: 'doctor',
    targetName: 'Dr. Direct',
    newLat: 30.1,
    newLng: 31.1,
    repId: 'rep_orphan',
    repName: 'Orphan Rep'
  });
  assert.strictEqual(s.accountLocationRequests.advanceApproval(locReq2.id, null), null, 'Null actor rejected');
  assert.strictEqual(s.accountLocationRequests.advanceApproval(locReq2.id, { id: 'rep_orphan', role: 'medical_rep' }), null, 'Self-approval by rep blocked');
  assert.strictEqual(s.accountLocationRequests.reject(locReq2.id, { id: 'pm1', role: 'product_manager' }), null, 'Unauthorized PM role blocked');
  const approvedByDm = s.accountLocationRequests.advanceApproval(locReq2.id, { id: 'dm1', name: 'DM One', role: 'dm' }, 'verified');
  assert.strictEqual(approvedByDm.status, 'approved', 'Authorized DM can approve');

  console.log('ALL 15 STORE HARDENING ASSERTIONS PASSED!');
}

runStoreHardeningTests();
