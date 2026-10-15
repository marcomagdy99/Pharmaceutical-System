const fs = require('fs');

console.log('=== Starting Migration of All Demo Entities to Modern IDs ===');

// Mapping definitions
const lineMap = {
  line1: 'line_1790626000001',
  line2: 'line_1790626000002',
  line3: 'line_1790626000003'
};

const areaMap = {
  area1: 'area_1790626000001',
  area2: 'area_1790626000002',
  area3: 'area_1790626000003',
  area4: 'area_1790626000004'
};

const prodMap = {
  prod1: 'prod_1790626000001',
  prod2: 'prod_1790626000002',
  prod3: 'prod_1790626000003',
  prod4: 'prod_1790626000004',
  prod5: 'prod_1790626000005',
  prod6: 'prod_1790626000006'
};

const pharmMap = {
  p1: 'ph_1790626000001',
  p2: 'ph_1790626000002',
  p3: 'ph_1790626000003',
  p4: 'ph_1790626000004',
  p5: 'ph_1790626000005',
  p6: 'ph_1790626000006',
  p7: 'ph_1790626000007'
};

const distMap = {
  dist1: 'dist_1790626000001',
  dist2: 'dist_1790626000002',
  dist3: 'dist_1790626000003'
};

const annMap = {
  ann1: 'ann_1790626000001',
  ann2: 'ann_1790626000002',
  ann3: 'ann_1790626000003',
  ann4: 'ann_1790626000004',
  ann5: 'ann_1790626000005',
  ann6: 'ann_1790626000006',
  ann7: 'ann_1790626000007',
  ann8: 'ann_1790626000008'
};

const notifMap = {
  notif_rep_1: 'notif_1790626000001',
  notif_rep_2: 'notif_1790626000002',
  notif_rep_3: 'notif_1790626000003',
  notif_dm_1: 'notif_1790626000004',
  notif_dm_2: 'notif_1790626000005',
  notif_hr_1: 'notif_1790626000006'
};

// 1. Update js/app.js
let app = fs.readFileSync('js/app.js', 'utf8');

// Replace lines, areas, products, dists, anns, notifs in quotes
for (const [oldId, newId] of Object.entries(lineMap)) {
  app = app.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(areaMap)) {
  app = app.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(prodMap)) {
  app = app.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(distMap)) {
  app = app.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(annMap)) {
  app = app.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(notifMap)) {
  app = app.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}

// Pharmacies in app.js: only replace "id": "p1", etc.
for (const [oldId, newId] of Object.entries(pharmMap)) {
  app = app.replace(new RegExp(`"id":\\s*"${oldId}"`, 'g'), `"id": "${newId}"`);
}

// Update auto-migration in loadDataFromStorage() in app.js
const autoMigrateTarget = `      // Auto-migrate any legacy rep1-rep5 IDs in cached localStorage
      const legacyIdMap = {
        rep1: "u1790626000001",
        rep2: "u1790626000002",
        rep3: "u1790626000003",
        rep4: "u1790626000004",
        rep5: "u1790626000005"
      };
      if (Array.isArray(data.users)) {
        data.users.forEach((u) => {
          if (legacyIdMap[u.id]) u.id = legacyIdMap[u.id];
        });
      }
      if (Array.isArray(data.areas)) {
        data.areas.forEach((a) => {
          if (legacyIdMap[a.repId]) a.repId = legacyIdMap[a.repId];
        });
      }
      if (Array.isArray(data.visits)) {
        data.visits.forEach((v) => {
          if (legacyIdMap[v.repId]) v.repId = legacyIdMap[v.repId];
        });
      }`;

const enhancedAutoMigrate = `      // Auto-migrate any legacy IDs (users, lines, areas, products, pharmacies) in cached localStorage
      const legacyIdMap = {
        rep1: "u1790626000001", rep2: "u1790626000002", rep3: "u1790626000003", rep4: "u1790626000004", rep5: "u1790626000005",
        admin1: "u1790626000010", bu1: "u1790626000011", lm1: "u1790626000012", lm2: "u1790626000013",
        dm1: "u1790626000014", dm2: "u1790626000015", dm3: "u1790626000016", hr1: "u1790626000017",
        pm1: "u1790626000018", pm2: "u1790626000019"
      };
      const legacyLineMap = { line1: "line_1790626000001", line2: "line_1790626000002", line3: "line_1790626000003" };
      const legacyAreaMap = { area1: "area_1790626000001", area2: "area_1790626000002", area3: "area_1790626000003", area4: "area_1790626000004" };
      const legacyProdMap = { prod1: "prod_1790626000001", prod2: "prod_1790626000002", prod3: "prod_1790626000003", prod4: "prod_1790626000004", prod5: "prod_1790626000005", prod6: "prod_1790626000006" };
      const legacyPharmMap = { p1: "ph_1790626000001", p2: "ph_1790626000002", p3: "ph_1790626000003", p4: "ph_1790626000004", p5: "ph_1790626000005", p6: "ph_1790626000006", p7: "ph_1790626000007" };
      const legacyDistMap = { dist1: "dist_1790626000001", dist2: "dist_1790626000002", dist3: "dist_1790626000003" };
      const legacyAnnMap = { ann1: "ann_1790626000001", ann2: "ann_1790626000002", ann3: "ann_1790626000003", ann4: "ann_1790626000004", ann5: "ann_1790626000005", ann6: "ann_1790626000006", ann7: "ann_1790626000007", ann8: "ann_1790626000008" };
      const legacyNotifMap = { notif_rep_1: "notif_1790626000001", notif_rep_2: "notif_1790626000002", notif_rep_3: "notif_1790626000003", notif_dm_1: "notif_1790626000004", notif_dm_2: "notif_1790626000005", notif_hr_1: "notif_1790626000006" };

      if (Array.isArray(data.users)) {
        data.users.forEach((u) => {
          if (legacyIdMap[u.id]) u.id = legacyIdMap[u.id];
          if (legacyIdMap[u.managerId]) u.managerId = legacyIdMap[u.managerId];
          if (legacyLineMap[u.lineId]) u.lineId = legacyLineMap[u.lineId];
          if (Array.isArray(u.lineIds)) u.lineIds = u.lineIds.map((l) => legacyLineMap[l] || l);
          if (legacyAreaMap[u.areaId]) u.areaId = legacyAreaMap[u.areaId];
          if (Array.isArray(u.areaIds)) u.areaIds = u.areaIds.map((a) => legacyAreaMap[a] || a);
          if (Array.isArray(u.productIds)) u.productIds = u.productIds.map((p) => legacyProdMap[p] || p);
        });
      }
      if (Array.isArray(data.areas)) {
        data.areas.forEach((a) => {
          if (legacyAreaMap[a.id]) a.id = legacyAreaMap[a.id];
          if (legacyLineMap[a.lineId]) a.lineId = legacyLineMap[a.lineId];
          if (legacyIdMap[a.repId]) a.repId = legacyIdMap[a.repId];
        });
      }
      if (Array.isArray(data.productLines)) {
        data.productLines.forEach((l) => {
          if (legacyLineMap[l.id]) l.id = legacyLineMap[l.id];
          if (legacyIdMap[l.lineManagerId]) l.lineManagerId = legacyIdMap[l.lineManagerId];
          if (Array.isArray(l.products)) {
            l.products.forEach((p) => {
              if (legacyProdMap[p.id]) p.id = legacyProdMap[p.id];
            });
          }
        });
      }
      if (Array.isArray(data.pharmacies)) {
        data.pharmacies.forEach((ph) => {
          if (legacyPharmMap[ph.id]) ph.id = legacyPharmMap[ph.id];
          if (legacyAreaMap[ph.areaId]) ph.areaId = legacyAreaMap[ph.areaId];
          if (legacyLineMap[ph.lineId]) ph.lineId = legacyLineMap[ph.lineId];
          if (legacyIdMap[ph.repId]) ph.repId = legacyIdMap[ph.repId];
        });
      }
      if (Array.isArray(data.distributors)) {
        data.distributors.forEach((d) => {
          if (legacyDistMap[d.id]) d.id = legacyDistMap[d.id];
        });
      }
      if (Array.isArray(data.announcements)) {
        data.announcements.forEach((an) => {
          if (legacyAnnMap[an.id]) an.id = legacyAnnMap[an.id];
        });
      }
      if (Array.isArray(data.notifications)) {
        data.notifications.forEach((n) => {
          if (legacyNotifMap[n.id]) n.id = legacyNotifMap[n.id];
          if (legacyIdMap[n.userId]) n.userId = legacyIdMap[n.userId];
        });
      }
      if (Array.isArray(data.visits)) {
        data.visits.forEach((v) => {
          if (legacyIdMap[v.repId]) v.repId = legacyIdMap[v.repId];
          if (legacyLineMap[v.lineId]) v.lineId = legacyLineMap[v.lineId];
          if (legacyAreaMap[v.areaId]) v.areaId = legacyAreaMap[v.areaId];
        });
      }`;

if (app.includes(autoMigrateTarget)) {
  app = app.replace(autoMigrateTarget, enhancedAutoMigrate);
  console.log('Updated app.js auto-migration successfully.');
} else {
  console.warn('Could not find exact autoMigrateTarget in app.js! Inspecting...');
}

fs.writeFileSync('js/app.js', app, 'utf8');
console.log('Saved js/app.js');

// 2. Update js/activities-core.js
let actCore = fs.readFileSync('js/activities-core.js', 'utf8');
// Replace line1: and line2: and inner unquoted allocations
const budgetOld = `        b = {
          line1: {
            totalBudget: 150000,
            lmAllocations: { lm1: 90000, lm2: 40000 },
            dmAllocations: { dm1: 50000, dm2: 30000 },
            repAllocations: { rep1: 25000, rep2: 20000 }
          },
          line2: {
            totalBudget: 100000,
            lmAllocations: { lm1: 60000, lm2: 40000 },
            dmAllocations: { dm3: 40000 },
            repAllocations: { rep4: 30000 }
          }
        };`;

const budgetNew = `        b = {
          line_1790626000001: {
            totalBudget: 150000,
            lmAllocations: { u1790626000012: 90000, u1790626000013: 40000 },
            dmAllocations: { u1790626000014: 50000, u1790626000015: 30000 },
            repAllocations: { u1790626000001: 25000, u1790626000002: 20000 }
          },
          line_1790626000002: {
            totalBudget: 100000,
            lmAllocations: { u1790626000012: 60000, u1790626000013: 40000 },
            dmAllocations: { u1790626000016: 40000 },
            repAllocations: { u1790626000004: 30000 }
          }
        };`;

if (actCore.includes(budgetOld)) {
  actCore = actCore.replace(budgetOld, budgetNew);
}
actCore = actCore.replace(/lineIds:\s*\["line1"\]/g, 'lineIds: ["line_1790626000001"]');
actCore = actCore.replace(/areaId:\s*"area1"/g, 'areaId: "area_1790626000001"');
actCore = actCore.replace(/\{ id:\s*"line1",\s*name:\s*"Cardio Line" \}/g, '{ id: "line_1790626000001", name: "Cardio Line" }');
actCore = actCore.replace(/\{ id:\s*"line2",\s*name:\s*"Neuro Line" \}/g, '{ id: "line_1790626000002", name: "Neuro Line" }');
fs.writeFileSync('js/activities-core.js', actCore, 'utf8');
console.log('Saved js/activities-core.js');

// 3. Update js/activities-tab-expenses.js
let actExp = fs.readFileSync('js/activities-tab-expenses.js', 'utf8');
actExp = actExp.replace(/"line1"/g, '"line_1790626000001"');
fs.writeFileSync('js/activities-tab-expenses.js', actExp, 'utf8');
console.log('Saved js/activities-tab-expenses.js');

// 4. Update js/login.js
let login = fs.readFileSync('js/login.js', 'utf8');
for (const [oldId, newId] of Object.entries(lineMap)) {
  login = login.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(prodMap)) {
  login = login.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
fs.writeFileSync('js/login.js', login, 'utf8');
console.log('Saved js/login.js');

// 5. Update js/products.js
let products = fs.readFileSync('js/products.js', 'utf8');
products = products.replace(/id:\s*"line1"/g, 'id: "line_1790626000001"');
products = products.replace(/id:\s*"line2"/g, 'id: "line_1790626000002"');
products = products.replace(/line\.id === "line1"/g, 'line.id === "line_1790626000001" || line.id === "line1"');
products = products.replace(/line\.id === "line2"/g, 'line.id === "line_1790626000002" || line.id === "line2"');
fs.writeFileSync('js/products.js', products, 'utf8');
console.log('Saved js/products.js');

// 6. Update js/shared-report.js
let sharedRep = fs.readFileSync('js/shared-report.js', 'utf8');
sharedRep = sharedRep.replace(/'line1'/g, "'line_1790626000001'");
fs.writeFileSync('js/shared-report.js', sharedRep, 'utf8');
console.log('Saved js/shared-report.js');

// 7. Update js/users.js
let users = fs.readFileSync('js/users.js', 'utf8');
users = users.replace(/id:\s*"line1"/g, 'id: "line_1790626000001"');
users = users.replace(/id:\s*"line2"/g, 'id: "line_1790626000002"');
users = users.replace(/id:\s*"line3"/g, 'id: "line_1790626000003"');
for (const [oldId, newId] of Object.entries(lineMap)) {
  users = users.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
fs.writeFileSync('js/users.js', users, 'utf8');
console.log('Saved js/users.js');

// 8. Update js/announcements.js
let announcements = fs.readFileSync('js/announcements.js', 'utf8');
for (const [oldId, newId] of Object.entries(annMap)) {
  announcements = announcements.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
fs.writeFileSync('js/announcements.js', announcements, 'utf8');
console.log('Saved js/announcements.js');

// 9. Update approval-test-suite.html
let apprTest = fs.readFileSync('approval-test-suite.html', 'utf8');
for (const [oldId, newId] of Object.entries(lineMap)) {
  apprTest = apprTest.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(areaMap)) {
  apprTest = apprTest.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
fs.writeFileSync('approval-test-suite.html', apprTest, 'utf8');
console.log('Saved approval-test-suite.html');

// 10. Update costing-test-suite.html
let costTest = fs.readFileSync('costing-test-suite.html', 'utf8');
for (const [oldId, newId] of Object.entries(lineMap)) {
  costTest = costTest.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
for (const [oldId, newId] of Object.entries(areaMap)) {
  costTest = costTest.replace(new RegExp(`(["'\`])${oldId}\\1`, 'g'), `$1${newId}$1`);
}
fs.writeFileSync('costing-test-suite.html', costTest, 'utf8');
console.log('Saved costing-test-suite.html');

console.log('=== All files updated successfully! ===');
