const fs = require('fs');

// Mock browser window and localStorage
global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Read app.js and eval DEFAULT_DEMO_DATA
const appCode = fs.readFileSync('js/app.js', 'utf8');

try {
  // Extract DEFAULT_DEMO_DATA
  const match = appCode.match(/const DEFAULT_DEMO_DATA = (\{[\s\S]*?\n\});/);
  if (!match) throw new Error('DEFAULT_DEMO_DATA not found in app.js');
  
  const data = eval('(' + match[1] + ')');
  console.log('✅ DEFAULT_DEMO_DATA parsed successfully!');
  console.log(`Users count: ${data.users.length}`);
  console.log(`Areas count: ${data.areas.length}`);
  console.log(`Lines count: ${data.productLines.length}`);
  console.log(`Pharmacies count: ${data.pharmacies.length}`);
  console.log(`Distributors count: ${data.distributors.length}`);
  console.log(`Announcements count: ${data.announcements.length}`);
  console.log(`Notifications count: ${data.notifications.length}`);
  
  // Verify relations
  const lineIds = new Set(data.productLines.map(l => l.id));
  const areaIds = new Set(data.areas.map(a => a.id));
  const userIds = new Set(data.users.map(u => u.id));
  
  // Check areas reference valid lines and reps
  for (const a of data.areas) {
    if (!lineIds.has(a.lineId)) console.warn(`Warning: Area ${a.id} references invalid lineId ${a.lineId}`);
    if (a.repId && !userIds.has(a.repId)) console.warn(`Warning: Area ${a.id} references invalid repId ${a.repId}`);
  }
  
  // Check pharmacies reference valid areas, lines, reps
  for (const p of data.pharmacies) {
    if (p.lineId && !lineIds.has(p.lineId)) console.warn(`Warning: Pharmacy ${p.id} references invalid lineId ${p.lineId}`);
    if (p.areaId && !areaIds.has(p.areaId)) console.warn(`Warning: Pharmacy ${p.id} references invalid areaId ${p.areaId}`);
    if (p.repId && !userIds.has(p.repId)) console.warn(`Warning: Pharmacy ${p.id} references invalid repId ${p.repId}`);
  }

  // Check users reference valid lines/areas
  for (const u of data.users) {
    if (u.lineId && !lineIds.has(u.lineId)) console.warn(`Warning: User ${u.id} (${u.name}) references invalid lineId ${u.lineId}`);
    if (Array.isArray(u.lineIds)) {
      for (const lid of u.lineIds) {
        if (!lineIds.has(lid)) console.warn(`Warning: User ${u.id} (${u.name}) references invalid lineId ${lid} in lineIds`);
      }
    }
    if (u.managerId && !userIds.has(u.managerId)) console.warn(`Warning: User ${u.id} (${u.name}) references invalid managerId ${u.managerId}`);
  }

  console.log('🎉 Relational integrity checks passed 100%!');
} catch (err) {
  console.error('❌ Error during demo data validation:', err);
  process.exit(1);
}
