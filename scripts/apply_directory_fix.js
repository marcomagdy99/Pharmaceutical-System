const fs = require('fs');

console.log('=== STARTING DIRECTORY PERSISTENCE & HIERARCHY FIX ===');

function patchFile(filePath, searchBlock, replaceBlock, label) {
  let content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  
  const normContent = content.replace(/\r\n/g, '\n');
  const normSearch = searchBlock.replace(/\r\n/g, '\n');
  const normReplace = replaceBlock.replace(/\r\n/g, '\n');
  
  if (!normContent.includes(normSearch)) {
    console.error(`FAILED to find target for: ${label} in ${filePath}`);
    return false;
  }
  
  const updatedNorm = normContent.replace(normSearch, normReplace);
  const finalContent = isCrlf ? updatedNorm.replace(/\n/g, '\r\n') : updatedNorm;
  
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log(`SUCCESS: Patched ${label} in ${filePath}`);
  return true;
}

// ============================================================================
// 1. js/app.js: Replace destructive blanket startsWith purges
// ============================================================================
const oldAppPurge = `        if (!Array.isArray(data.doctors)) data.doctors = [];
        data.doctors = data.doctors.filter((d) => d && d.id && !d.id.startsWith("d"));

        if (!Array.isArray(data.pharmacies)) data.pharmacies = [];
        data.pharmacies = data.pharmacies.filter((p) => p && p.id && !p.id.startsWith("ph"));

        if (!Array.isArray(data.hospitals)) data.hospitals = [];
        data.hospitals = data.hospitals.filter((h) => h && h.id && !h.id.startsWith("h"));

        if (!Array.isArray(data.visits)) data.visits = [];
        data.visits = data.visits.filter((v) => v && v.id && !v.id.startsWith("v") && !v.id.startsWith("today_v"));

        if (!Array.isArray(data.sales)) data.sales = [];
        data.sales = data.sales.filter((s) => s && s.id && !s.id.startsWith("s") && !s.id.startsWith("ds_s"));

        if (!Array.isArray(data.leaves)) data.leaves = [];
        data.leaves = data.leaves.filter((l) => l && l.id && !l.id.startsWith("l"));`;

const newAppPurge = `        // Purge only ancient legacy single-digit demo mock IDs (e.g. d1, ph1, h1, v1, s1, l1).
        // NEVER purge legitimate system-generated entities (doc_*, pharm_*, hosp_*, visit_*, leave_*, etc.)!
        if (!Array.isArray(data.doctors)) data.doctors = [];
        data.doctors = data.doctors.filter((d) => d && d.id && !/^d\\d{1,4}$/.test(d.id));

        if (!Array.isArray(data.pharmacies)) data.pharmacies = [];
        data.pharmacies = data.pharmacies.filter((p) => p && p.id && !/^ph\\d{1,4}$/.test(p.id));

        if (!Array.isArray(data.hospitals)) data.hospitals = [];
        data.hospitals = data.hospitals.filter((h) => h && h.id && !/^h\\d{1,4}$/.test(h.id));

        if (!Array.isArray(data.visits)) data.visits = [];
        data.visits = data.visits.filter((v) => v && v.id && !/^v\\d{1,4}$/.test(v.id) && !/^today_v\\d+$/.test(v.id));

        if (!Array.isArray(data.sales)) data.sales = [];
        data.sales = data.sales.filter((s) => s && s.id && !/^s\\d{1,4}$/.test(s.id) && !/^ds_s\\d+$/.test(s.id));

        if (!Array.isArray(data.leaves)) data.leaves = [];
        data.leaves = data.leaves.filter((l) => l && l.id && !/^l\\d{1,4}$/.test(l.id));`;

patchFile('js/app.js', oldAppPurge, newAppPurge, 'Cure destructive purge in loadDataFromStorage');

// ============================================================================
// 2. js/store.js: doctors.save, pharmacies.save, hospitals.save
// ============================================================================
const oldStoreDoc = `      save(docObj) {
        if (!window.DEMO_DATA.doctors) window.DEMO_DATA.doctors = [];
        if (docObj.areaId && store.areas) {
          const a = store.areas.getById(docObj.areaId);
          if (a) {
            docObj.repId = a.repId || null;
            if (a.name) docObj.area = a.name;
            if (a.lineId) docObj.lineId = a.lineId;
          }
        }`;

const newStoreDoc = `      save(docObj) {
        if (!window.DEMO_DATA.doctors) window.DEMO_DATA.doctors = [];
        if (docObj.areaId && store.areas) {
          const a = store.areas.getById(docObj.areaId);
          if (a) {
            if (!docObj.repId && a.repId) docObj.repId = a.repId;
            if (a.name) docObj.area = a.name;
            if (a.lineId && !docObj.lineId) docObj.lineId = a.lineId;
          }
        }
        if (docObj.repId && store.users) {
          const rep = store.users.getById(docObj.repId);
          if (rep && rep.managerId && !docObj.dmId) {
            docObj.dmId = rep.managerId;
            const dm = store.users.getById(rep.managerId);
            if (dm && dm.managerId && !docObj.lmId) docObj.lmId = dm.managerId;
          }
        }`;

patchFile('js/store.js', oldStoreDoc, newStoreDoc, 'doctors.save non-destructive repId');

const oldStorePharm = `      save(pharmObj) {
        if (!window.DEMO_DATA.pharmacies) window.DEMO_DATA.pharmacies = [];
        if (pharmObj.areaId && store.areas) {
          const a = store.areas.getById(pharmObj.areaId);
          if (a) {
            pharmObj.repId = a.repId || null;
            if (a.name) pharmObj.area = a.name;
            if (a.lineId) pharmObj.lineId = a.lineId;
          }
        }`;

const newStorePharm = `      save(pharmObj) {
        if (!window.DEMO_DATA.pharmacies) window.DEMO_DATA.pharmacies = [];
        if (pharmObj.areaId && store.areas) {
          const a = store.areas.getById(pharmObj.areaId);
          if (a) {
            if (!pharmObj.repId && a.repId) pharmObj.repId = a.repId;
            if (a.name) pharmObj.area = a.name;
            if (a.lineId && !pharmObj.lineId) pharmObj.lineId = a.lineId;
          }
        }
        if (pharmObj.repId && store.users) {
          const rep = store.users.getById(pharmObj.repId);
          if (rep && rep.managerId && !pharmObj.dmId) {
            pharmObj.dmId = rep.managerId;
            const dm = store.users.getById(rep.managerId);
            if (dm && dm.managerId && !pharmObj.lmId) pharmObj.lmId = dm.managerId;
          }
        }`;

patchFile('js/store.js', oldStorePharm, newStorePharm, 'pharmacies.save non-destructive repId');

const oldStoreHosp = `      save(hospObj) {
        if (!window.DEMO_DATA.hospitals) window.DEMO_DATA.hospitals = [];
        if (hospObj.areaId && store.areas) {
          const a = store.areas.getById(hospObj.areaId);
          if (a) {
            hospObj.repId = a.repId || null;
            if (a.name) hospObj.area = a.name;
            if (a.lineId) hospObj.lineId = a.lineId;
          }
        }`;

const newStoreHosp = `      save(hospObj) {
        if (!window.DEMO_DATA.hospitals) window.DEMO_DATA.hospitals = [];
        if (hospObj.areaId && store.areas) {
          const a = store.areas.getById(hospObj.areaId);
          if (a) {
            if (!hospObj.repId && a.repId) hospObj.repId = a.repId;
            if (a.name) hospObj.area = a.name;
            if (a.lineId && !hospObj.lineId) hospObj.lineId = a.lineId;
          }
        }
        if (hospObj.repId && store.users) {
          const rep = store.users.getById(hospObj.repId);
          if (rep && rep.managerId && !hospObj.dmId) {
            hospObj.dmId = rep.managerId;
            const dm = store.users.getById(rep.managerId);
            if (dm && dm.managerId && !hospObj.lmId) hospObj.lmId = dm.managerId;
          }
        }`;

patchFile('js/store.js', oldStoreHosp, newStoreHosp, 'hospitals.save non-destructive repId');

// ============================================================================
// 3. js/doctors-report.js
// ============================================================================
const oldDocSave = `  // Doctor strictly belongs to Area; representative is whoever is assigned to that Area
  const assignedRepId = areaObj ? (areaObj.repId || null) : null;

  const existingDocRecord = id ? (getDoctorsData().find((d) => d.id === id) || {}) : {};

  const doctorObj = {
    ...(existingDocRecord || {}),
    id: id || "doc_" + Date.now(),
    name,
    specialtyId,
    specialty,
    specialtyAr,
    class: docClass,
    address,
    clinicAddress: address,
    phone,
    repId: assignedRepId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
    visitsThisQuarter: existingDocRecord.visitsThisQuarter || 0
  };`;

const newDocSave = `  // Read explicitly assigned rep from modal hierarchy, fallback to area rep
  const repSelectEl = document.getElementById("doctorRepInput");
  const modalRepId = (repSelectEl && repSelectEl.value && repSelectEl.value !== "all") ? repSelectEl.value : null;
  const assignedRepId = modalRepId || (areaObj ? (areaObj.repId || null) : null);

  const allUsersList = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  let assignedDmId = null;
  let assignedLmId = null;
  if (assignedRepId) {
    const repUserObj = allUsersList.find(u => u.id === assignedRepId);
    if (repUserObj && repUserObj.managerId) {
      assignedDmId = repUserObj.managerId;
      const dmUserObj = allUsersList.find(u => u.id === repUserObj.managerId);
      if (dmUserObj && dmUserObj.managerId) assignedLmId = dmUserObj.managerId;
    }
  }

  const existingDocRecord = id ? (getDoctorsData().find((d) => d.id === id) || {}) : {};

  const doctorObj = {
    ...(existingDocRecord || {}),
    id: id || "doc_" + Date.now(),
    name,
    specialtyId,
    specialty,
    specialtyAr,
    class: docClass,
    address,
    clinicAddress: address,
    phone,
    repId: assignedRepId,
    dmId: assignedDmId,
    lmId: assignedLmId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
    visitsThisQuarter: existingDocRecord.visitsThisQuarter || 0
  };`;

patchFile('js/doctors-report.js', oldDocSave, newDocSave, 'saveDoctor rep & hierarchy capture');

const oldDocRepScope = `    docs = docs.filter((d) =>
      (d.areaId && repAreaIds.includes(d.areaId)) ||
      (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim())) ||
      (!d.areaId && d.repId === currentUser.id)
    );`;

const newDocRepScope = `    docs = docs.filter((d) =>
      d.repId === currentUser.id ||
      (d.areaId && repAreaIds.includes(d.areaId)) ||
      (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
    );`;

patchFile('js/doctors-report.js', oldDocRepScope, newDocRepScope, 'getScopedDoctors rep scoping');

const oldDocMgrFilter = `          docs = docs.filter((d) =>
            d.repId === repId ||
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (!d.areaId && d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
          );`;

const newDocMgrFilter = `          docs = docs.filter((d) =>
            d.repId === repId ||
            (d.areaId && repAreaIds.includes(d.areaId)) ||
            (d.area && repAreaNames.includes(d.area.toLowerCase().trim()))
          );`;

patchFile('js/doctors-report.js', oldDocMgrFilter, newDocMgrFilter, 'getScopedDoctors manager rep filter');

// ============================================================================
// 4. js/pharmacies-report.js
// ============================================================================
const oldPharmSave = `  // Pharmacy strictly belongs to Area; representative is whoever is assigned to that Area
  const assignedRepId = areaObj ? (areaObj.repId || null) : null;
  const existingPharm = id ? ((window.store && window.store.pharmacies ? window.store.pharmacies.getById(id) : null) || (window.DEMO_DATA?.pharmacies?.find((p) => p.id === id))) : null;

  const pharmacyObj = {
    ...(existingPharm || {}),
    id: id || "pharm_" + Date.now(),
    name,
    address,
    contactPerson,
    phone,
    repId: assignedRepId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
  };`;

const newPharmSave = `  const repSelectEl = document.getElementById("pharmacyRepInput");
  const modalRepId = (repSelectEl && repSelectEl.value && repSelectEl.value !== "all") ? repSelectEl.value : null;
  const assignedRepId = modalRepId || (areaObj ? (areaObj.repId || null) : null);

  const allUsersList = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  let assignedDmId = null;
  let assignedLmId = null;
  if (assignedRepId) {
    const repUserObj = allUsersList.find(u => u.id === assignedRepId);
    if (repUserObj && repUserObj.managerId) {
      assignedDmId = repUserObj.managerId;
      const dmUserObj = allUsersList.find(u => u.id === repUserObj.managerId);
      if (dmUserObj && dmUserObj.managerId) assignedLmId = dmUserObj.managerId;
    }
  }

  const existingPharm = id ? ((window.store && window.store.pharmacies ? window.store.pharmacies.getById(id) : null) || (window.DEMO_DATA?.pharmacies?.find((p) => p.id === id))) : null;

  const pharmacyObj = {
    ...(existingPharm || {}),
    id: id || "pharm_" + Date.now(),
    name,
    address,
    contactPerson,
    phone,
    repId: assignedRepId,
    dmId: assignedDmId,
    lmId: assignedLmId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
  };`;

patchFile('js/pharmacies-report.js', oldPharmSave, newPharmSave, 'savePharmacy rep & hierarchy capture');

const oldPharmRepScope = `    pharms = pharms.filter((p) =>
      (p.areaId && repAreaIds.includes(p.areaId)) ||
      (!p.areaId && p.area && repAreaNames.includes(p.area.toLowerCase().trim())) ||
      (!p.areaId && p.repId === currentUser.id)
    );`;

const newPharmRepScope = `    pharms = pharms.filter((p) =>
      p.repId === currentUser.id ||
      (p.areaId && repAreaIds.includes(p.areaId)) ||
      (p.area && repAreaNames.includes(p.area.toLowerCase().trim()))
    );`;

patchFile('js/pharmacies-report.js', oldPharmRepScope, newPharmRepScope, 'getScopedPharmacies rep scoping');

const oldPharmMgrFilter = `          pharms = pharms.filter((p) =>
            p.repId === repId ||
            (p.areaId && repAreaIds.includes(p.areaId)) ||
            (!p.areaId && p.area && repAreaNames.includes(p.area.toLowerCase().trim()))
          );`;

const newPharmMgrFilter = `          pharms = pharms.filter((p) =>
            p.repId === repId ||
            (p.areaId && repAreaIds.includes(p.areaId)) ||
            (p.area && repAreaNames.includes(p.area.toLowerCase().trim()))
          );`;

patchFile('js/pharmacies-report.js', oldPharmMgrFilter, newPharmMgrFilter, 'getScopedPharmacies manager rep filter');

// ============================================================================
// 5. js/hospitals-report.js
// ============================================================================
const oldHospSave = `  // Hospital strictly belongs to Area; representative is whoever is assigned to that Area
  const assignedRepId = areaObj ? (areaObj.repId || null) : null;
  const existingHosp = id ? ((window.store && window.store.hospitals ? window.store.hospitals.getById(id) : null) || (window.DEMO_DATA?.hospitals?.find((h) => h.id === id))) : null;

  const hospitalObj = {
    ...(existingHosp || {}),
    id: id || "hosp_" + Date.now(),
    name,
    nameAr: nameAr || name,
    type: "hospital",
    address,
    phone,
    repId: assignedRepId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
  };`;

const newHospSave = `  const repSelectEl = document.getElementById("hospitalRepInput");
  const modalRepId = (repSelectEl && repSelectEl.value && repSelectEl.value !== "all") ? repSelectEl.value : null;
  const assignedRepId = modalRepId || (areaObj ? (areaObj.repId || null) : null);

  const allUsersList = (window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []);
  let assignedDmId = null;
  let assignedLmId = null;
  if (assignedRepId) {
    const repUserObj = allUsersList.find(u => u.id === assignedRepId);
    if (repUserObj && repUserObj.managerId) {
      assignedDmId = repUserObj.managerId;
      const dmUserObj = allUsersList.find(u => u.id === repUserObj.managerId);
      if (dmUserObj && dmUserObj.managerId) assignedLmId = dmUserObj.managerId;
    }
  }

  const existingHosp = id ? ((window.store && window.store.hospitals ? window.store.hospitals.getById(id) : null) || (window.DEMO_DATA?.hospitals?.find((h) => h.id === id))) : null;

  const hospitalObj = {
    ...(existingHosp || {}),
    id: id || "hosp_" + Date.now(),
    name,
    nameAr: nameAr || name,
    type: "hospital",
    address,
    phone,
    repId: assignedRepId,
    dmId: assignedDmId,
    lmId: assignedLmId,
    areaId: assignedAreaId,
    area: assignedAreaName,
    lineId: assignedLineId,
  };`;

patchFile('js/hospitals-report.js', oldHospSave, newHospSave, 'saveHospital rep & hierarchy capture');

const oldHospRepScope = `    hosps = hosps.filter((h) =>
      (h.areaId && repAreaIds.includes(h.areaId)) ||
      (!h.areaId && h.area && repAreaNames.includes(h.area.toLowerCase().trim())) ||
      (!h.areaId && h.repId === currentUser.id)
    );`;

const newHospRepScope = `    hosps = hosps.filter((h) =>
      h.repId === currentUser.id ||
      (h.areaId && repAreaIds.includes(h.areaId)) ||
      (h.area && repAreaNames.includes(h.area.toLowerCase().trim()))
    );`;

patchFile('js/hospitals-report.js', oldHospRepScope, newHospRepScope, 'getScopedHospitals rep scoping');

const oldHospMgrFilter = `          hosps = hosps.filter((h) =>
            h.repId === repId ||
            (h.areaId && repAreaIds.includes(h.areaId)) ||
            (!h.areaId && h.area && repAreaNames.includes(h.area.toLowerCase().trim()))
          );`;

const newHospMgrFilter = `          hosps = hosps.filter((h) =>
            h.repId === repId ||
            (h.areaId && repAreaIds.includes(h.areaId)) ||
            (h.area && repAreaNames.includes(h.area.toLowerCase().trim()))
          );`;

patchFile('js/hospitals-report.js', oldHospMgrFilter, newHospMgrFilter, 'getScopedHospitals manager rep filter');

console.log('=== FINISHED APPLYING DIRECTORY FIXES ===');
