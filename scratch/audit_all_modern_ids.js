const fs = require('fs');
const path = require('path');

const checkList = {
  areas: ['area1', 'area2', 'area3', 'area4'],
  lines: ['line1', 'line2', 'line3'],
  products: ['prod1', 'prod2', 'prod3', 'prod4', 'prod5', 'prod6'],
  pharmacies: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'],
  distributors: ['dist1', 'dist2', 'dist3'],
  announcements: ['ann1', 'ann2', 'ann3', 'ann4', 'ann5', 'ann6', 'ann7', 'ann8'],
  notifications: ['notif_rep_1', 'notif_rep_2', 'notif_rep_3', 'notif_dm_1', 'notif_dm_2', 'notif_hr_1']
};

const remaining = {};

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'scratch' && f !== 'dist') scan(full);
    } else if (full.endsWith('.js') || full.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      
      for (const [cat, items] of Object.entries(checkList)) {
        for (const item of items) {
          // Check for exact quoted token: 'item' or "item" or `item`
          // Note: for auto-migrate mapping keys (e.g. line1: "line_17906..."), that's acceptable in app.js
          const r = new RegExp(`(["'\`])${item}\\1`, 'g');
          let m;
          while ((m = r.exec(content)) !== null) {
            // Check if this line is in the legacy mapping definition (which is expected)
            const lineStart = content.lastIndexOf('\n', m.index) + 1;
            const lineEnd = content.indexOf('\n', m.index);
            const lineText = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
            if (lineText.includes('legacyLineMap') || lineText.includes('legacyAreaMap') || lineText.includes('legacyProdMap') || lineText.includes('legacyPharmMap') || lineText.includes('legacyDistMap') || lineText.includes('legacyAnnMap') || lineText.includes('legacyNotifMap') || lineText.includes('line.id === "line1"') || lineText.includes('line.id === "line2"')) {
              continue;
            }
            if (!remaining[item]) remaining[item] = [];
            remaining[item].push(`${full}:${lineText.trim().slice(0, 80)}`);
          }
        }
      }
    }
  }
}

scan('.');
console.log('=== REMAINING LEGACY ENTITY USAGES (EXCLUDING MIGRATION DICTIONARIES) ===');
const keys = Object.keys(remaining);
if (keys.length === 0) {
  console.log('🎉 ZERO remaining legacy entity IDs found!');
} else {
  for (const k of keys) {
    console.log(`❌ ${k} (${remaining[k].length}):\n  ${remaining[k].join('\n  ')}`);
  }
}
