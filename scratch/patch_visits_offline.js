const fs = require('fs');

let content = fs.readFileSync('js/visits.js', 'utf8');
const hasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Optimize captureVisitLocation timeout & maximumAge for offline basements
content = content.replace(
  `  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      callback({
        required: true,
        status: "permission_denied",
        reason: "Location timeout"
      });
    }
  }, 4000);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      callback({
        required: true,
        status: "obtained",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
    },
    (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      callback({
        required: true,
        status: "permission_denied",
        reason: err ? err.message : "Permission denied"
      });
    },
    { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
  );`,
  `  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      callback({
        required: true,
        status: "permission_denied",
        reason: "Location timeout"
      });
    }
  }, 5000);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      callback({
        required: true,
        status: "obtained",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
    },
    (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      callback({
        required: true,
        status: "permission_denied",
        reason: err ? err.message : "Permission denied"
      });
    },
    { enableHighAccuracy: true, timeout: 4500, maximumAge: 120000 }
  );`
);

// 2. Add renderOfflineBadge right after renderTimeTamperedBadge
const oldTamperedFunction = `function renderTimeTamperedBadge(v) {
  if (!v || !v.timeTampered) return "";
  const drift = v.clockDriftMinutes || 0;
  const sign = drift > 0 ? "+" : "";
  const text = \`⏰ Time Drift (\${sign}\${drift}m)\`;
  const title = \`Device clock differed from verified network time by \${sign}\${drift} minutes. Stamped with official network time.\`;
  return \`<span class="badge badge-clock-drift" title="\${title}">\${text}</span>\`;
}`;

const newTamperedAndOfflineFunction = `function renderTimeTamperedBadge(v) {
  if (!v || !v.timeTampered) return "";
  const drift = v.clockDriftMinutes || 0;
  const sign = drift > 0 ? "+" : "";
  const text = \`⏰ Time Drift (\${sign}\${drift}m)\`;
  const title = \`Device clock differed from verified network time by \${sign}\${drift} minutes. Stamped with official network time.\`;
  return \`<span class="badge badge-clock-drift" title="\${title}">\${text}</span>\`;
}

function renderOfflineBadge(v) {
  if (!v || !v.isOffline) return "";
  if (!v.syncedToCloud) {
    return '<span class="badge badge-offline-pending" title="Saved locally on device (offline) • Waiting for connection to sync">📱 Offline Pending</span>';
  }
  const syncTimeStr = v.syncedAt ? \` (Synced: \${new Date(v.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})\` : "";
  return \`<span class="badge badge-offline-synced" title="Logged offline on device and synced to cloud\${syncTimeStr}">📶 Offline Synced</span>\`;
}`;

content = content.replace(oldTamperedFunction, newTamperedAndOfflineFunction);

// 3. In timeline card rendering, insert renderOfflineBadge
content = content.replace(
  `          <div class="timeline-card-badges">
            \${renderGpsBadge(v, lang)}
            \${renderTimeTamperedBadge(v, lang)}`,
  `          <div class="timeline-card-badges">
            \${renderGpsBadge(v, lang)}
            \${renderOfflineBadge(v)}
            \${renderTimeTamperedBadge(v, lang)}`
);

// 4. In finalizeEdit, handle offline status
content = content.replace(
  `      const finalizeEdit = (gpsPayload) => {
        resetSaveBtn();
        if (gpsPayload) {
          visit.gpsStatus = gpsPayload.status;
          if (gpsPayload.distanceMeters != null) visit.distanceMeters = gpsPayload.distanceMeters;
          if (gpsPayload.deviceLat != null) visit.deviceLat = gpsPayload.deviceLat;
          if (gpsPayload.deviceLng != null) visit.deviceLng = gpsPayload.deviceLng;
          if (gpsPayload.targetLat != null) visit.targetLat = gpsPayload.targetLat;
          if (gpsPayload.targetLng != null) visit.targetLng = gpsPayload.targetLng;
        }
        persistVisits();
        closeVisitModal();
        renderVisits(true);
        const successMsg = "Visit saved successfully.";
        showToast(successMsg, "success");
      };`,
  `      const finalizeEdit = (gpsPayload) => {
        resetSaveBtn();
        const isCurrentlyOffline = !navigator.onLine;
        if (isCurrentlyOffline) {
          visit.isOffline = true;
          if (!visit.offlineLoggedAt) visit.offlineLoggedAt = new Date().toISOString();
          visit.syncedToCloud = false;
        }
        if (gpsPayload) {
          visit.gpsStatus = gpsPayload.status;
          if (gpsPayload.distanceMeters != null) visit.distanceMeters = gpsPayload.distanceMeters;
          if (gpsPayload.deviceLat != null) visit.deviceLat = gpsPayload.deviceLat;
          if (gpsPayload.deviceLng != null) visit.deviceLng = gpsPayload.deviceLng;
          if (gpsPayload.targetLat != null) visit.targetLat = gpsPayload.targetLat;
          if (gpsPayload.targetLng != null) visit.targetLng = gpsPayload.targetLng;
        }
        persistVisits();
        closeVisitModal();
        renderVisits(true);
        const successMsg = isCurrentlyOffline
          ? "Visit saved locally offline with GPS. It will automatically sync once online."
          : "Visit saved successfully.";
        showToast(successMsg, isCurrentlyOffline ? "info" : "success");
      };`
);

// 5. In finalizeNewSave, handle offline status
content = content.replace(
  `    const finalizeNewSave = (gpsPayload) => {
      resetSaveBtn();
      if (gpsPayload) {
        newVisit.gpsStatus = gpsPayload.status;
        if (gpsPayload.distanceMeters != null) newVisit.distanceMeters = gpsPayload.distanceMeters;
        if (gpsPayload.deviceLat != null) newVisit.deviceLat = gpsPayload.deviceLat;
        if (gpsPayload.deviceLng != null) newVisit.deviceLng = gpsPayload.deviceLng;
        if (gpsPayload.targetLat != null) newVisit.targetLat = gpsPayload.targetLat;
        if (gpsPayload.targetLng != null) newVisit.targetLng = gpsPayload.targetLng;
      }
      getLiveVisits();
      demoVisits.unshift(newVisit);
      persistVisits();
      closeVisitModal();
      renderVisits(true);

      const successMsg = modalSource === "plan" ? "Visit planned and submitted for approval successfully." : "Visit saved successfully.";
      showToast(successMsg, "success");
    };`,
  `    const finalizeNewSave = (gpsPayload) => {
      resetSaveBtn();
      const isCurrentlyOffline = !navigator.onLine;
      if (isCurrentlyOffline) {
        newVisit.isOffline = true;
        newVisit.offlineLoggedAt = new Date().toISOString();
        newVisit.syncedToCloud = false;
      } else {
        newVisit.syncedToCloud = true;
      }
      if (gpsPayload) {
        newVisit.gpsStatus = gpsPayload.status;
        if (gpsPayload.distanceMeters != null) newVisit.distanceMeters = gpsPayload.distanceMeters;
        if (gpsPayload.deviceLat != null) newVisit.deviceLat = gpsPayload.deviceLat;
        if (gpsPayload.deviceLng != null) newVisit.deviceLng = gpsPayload.deviceLng;
        if (gpsPayload.targetLat != null) newVisit.targetLat = gpsPayload.targetLat;
        if (gpsPayload.targetLng != null) newVisit.targetLng = gpsPayload.targetLng;
      }
      getLiveVisits();
      demoVisits.unshift(newVisit);
      persistVisits();
      closeVisitModal();
      renderVisits(true);

      const successMsg = modalSource === "plan"
        ? "Visit planned and submitted for approval successfully."
        : (isCurrentlyOffline
            ? "Visit saved locally offline with GPS. It will automatically sync once online."
            : "Visit saved successfully.");
      showToast(successMsg, isCurrentlyOffline ? "info" : "success");
    };`
);

if (hasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('js/visits.js', content, 'utf8');
console.log('js/visits.js successfully patched with offline mode & GPS integration!');
