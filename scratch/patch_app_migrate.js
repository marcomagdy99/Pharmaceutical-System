const fs = require('fs');

let content = fs.readFileSync('js/app.js', 'utf8');
const isCrlf = content.includes('\r\n');
const normalize = s => s.replace(/\r\n/g, '\n');

const target = normalize(`      if (Array.isArray(data.targets)) {
        data.targets = data.targets.filter((t) => t && t.id && !t.id.startsWith("target_s"));
      }

      return data;`);

const replacement = normalize(`      if (Array.isArray(data.targets)) {
        data.targets = data.targets.filter((t) => t && t.id && !t.id.startsWith("target_s"));
      }

      // Auto-migrate any legacy rep1-rep5 IDs in cached localStorage
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
      }

      return data;`);

let norm = normalize(content);
if (!norm.includes(target)) {
  console.error('Target not found in js/app.js');
  process.exit(1);
}

norm = norm.replace(target, replacement);
const finalContent = isCrlf ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync('js/app.js', finalContent, 'utf8');
console.log('SUCCESS: Auto-migration added to loadDataFromStorage');
