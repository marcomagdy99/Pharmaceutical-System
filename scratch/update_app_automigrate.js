const fs = require('fs');

let app = fs.readFileSync('js/app.js', 'utf8');

const regex = /\/\/ Auto-migrate any legacy rep1-rep5 IDs[\s\S]*?if \(Array\.isArray\(data\.visits\)\) \{\s*data\.visits\.forEach\(\(v\) => \{\s*if \(legacyIdMap\[v\.repId\]\) v\.repId = legacyIdMap\[v\.repId\];\s*\}\);\s*\}/;

const enhancedAutoMigrate = `// Auto-migrate any legacy IDs (users, lines, areas, products, pharmacies, dists, anns, notifs) in cached localStorage
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

if (regex.test(app)) {
  app = app.replace(regex, enhancedAutoMigrate);
  fs.writeFileSync('js/app.js', app, 'utf8');
  console.log('Successfully replaced auto-migration in js/app.js');
} else {
  console.error('Regex did not match in js/app.js');
}
