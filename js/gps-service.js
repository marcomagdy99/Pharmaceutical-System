/**
 * @file gps-service.js
 * @description Centralized GPS and Geolocation Service.
 * Provides Haversine distance calculations, HTML5 Geolocation capture with timeout tolerance,
 * and standard GPS verification badge rendering.
 */

(function (window) {
  "use strict";

  const GpsService = {
    /**
     * Calculates the great-circle distance between two points on Earth using the Haversine formula.
     * @param {number|null} lat1 - Latitude of point 1.
     * @param {number|null} lon1 - Longitude of point 1.
     * @param {number|null} lat2 - Latitude of point 2.
     * @param {number|null} lon2 - Longitude of point 2.
     * @returns {number|null} Distance in meters rounded to the nearest integer, or null if invalid coordinates.
     */
    calculateDistanceMeters(lat1, lon1, lat2, lon2) {
      if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
      const R = 6371e3; // Earth radius in meters
      const rad = Math.PI / 180;
      const phi1 = lat1 * rad;
      const phi2 = lat2 * rad;
      const deltaPhi = (lat2 - lat1) * rad;
      const deltaLambda = (lon2 - lon1) * rad;

      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    },

    /**
     * Captures current device location using HTML5 Geolocation API with graceful fallback and timeout.
     * @param {Function} callback - Callback invoked with the location payload.
     */
    captureVisitLocation(callback) {
      const companySettings = (window.store && window.store.companySettings)
        ? window.store.companySettings.get()
        : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

      const isGpsRequired = Boolean(companySettings.requireGpsValidation || companySettings.enforceGpsVerification);
      if (!isGpsRequired) {
        return callback({ required: false });
      }

      if (!navigator.geolocation) {
        return callback({
          required: true,
          status: "permission_denied",
          reason: "Geolocation not supported"
        });
      }

      let finished = false;
      const timer = setTimeout(() => {
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
      );
    },

    /**
     * Determines whether coordinates fall within the maximum allowed deviation distance.
     * @param {number} deviceLat
     * @param {number} deviceLng
     * @param {number} targetLat
     * @param {number} targetLng
     * @param {number} [maxMeters]
     * @returns {{inRange: boolean, distanceMeters: number|null}}
     */
    checkProximity(deviceLat, deviceLng, targetLat, targetLng, maxMeters = 200) {
      const dist = this.calculateDistanceMeters(deviceLat, deviceLng, targetLat, targetLng);
      if (dist === null) return { inRange: false, distanceMeters: null };
      return {
        inRange: dist <= maxMeters,
        distanceMeters: dist
      };
    },

    /**
     * Renders standard HTML badge for visit GPS verification state.
     * @param {Object} v - Visit object with gpsStatus and optional coordinates.
     * @param {string} [lang] - Language code ('en').
     * @returns {string} HTML string representing badge.
     */
    renderGpsBadge(v, lang = "en") {
      if (!v || !v.gpsStatus) return "";
      // Pharmacies are strictly exempt from GPS tracking & location requirements
      if (v.targetType === "pharmacy" || v.period === "pharmacy" || (v.doctorId && String(v.doctorId).startsWith("pharm"))) {
        return "";
      }
      const companySettings = (window.store && window.store.companySettings)
        ? window.store.companySettings.get()
        : { requireGpsValidation: true, gpsMaxDistanceMeters: 200 };

      const isGpsRequired = Boolean(companySettings.requireGpsValidation || companySettings.enforceGpsVerification);
      if (!isGpsRequired) return "";

      if (v.gpsStatus === "permission_denied") {
        return `<span class="badge badge-gps-denied"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> GPS Disabled by Rep</span>`;
      }

      const dLat = v.deviceLat;
      const dLng = v.deviceLng;
      let tLat = v.targetLat;
      let tLng = v.targetLng;

      if (tLat == null || tLng == null) {
        let allDocs = [];
        let allHosps = [];
        let allPharms = [];

        if (typeof window.getMockDoctors === "function") {
          allDocs = window.getMockDoctors() || [];
          allHosps = typeof window.getMockHospitals === "function" ? window.getMockHospitals() || [] : [];
          allPharms = typeof window.getMockPharmacies === "function" ? window.getMockPharmacies() || [] : [];
        } else if (window.store) {
          allDocs = (window.store.doctors && window.store.doctors.getAll) ? window.store.doctors.getAll() : (window.DEMO_DATA?.doctors || []);
          allHosps = (window.store.hospitals && window.store.hospitals.getAll) ? window.store.hospitals.getAll() : (window.DEMO_DATA?.hospitals || []);
          allPharms = (window.store.pharmacies && window.store.pharmacies.getAll) ? window.store.pharmacies.getAll() : (window.DEMO_DATA?.pharmacies || []);
        } else if (window.DEMO_DATA) {
          allDocs = window.DEMO_DATA.doctors || [];
          allHosps = window.DEMO_DATA.hospitals || [];
          allPharms = window.DEMO_DATA.pharmacies || [];
        }

        const vDocName = (v.doctorName || "").trim().toLowerCase();
        const found = allDocs.find((d) => (v.doctorId && d.id === v.doctorId) || (d.name && d.name.trim().toLowerCase() === vDocName)) ||
                      allHosps.find((h) => (v.doctorId && h.id === v.doctorId) || (h.name && h.name.trim().toLowerCase() === vDocName)) ||
                      allPharms.find((p) => (v.doctorId && p.id === v.doctorId) || (p.name && p.name.trim().toLowerCase() === vDocName));

        if (found && found.lat != null && found.lng != null) {
          tLat = found.lat;
          tLng = found.lng;
        }
      }

      const maxDist = companySettings.gpsMaxDistanceMeters || 200;
      let dist = v.distanceMeters != null ? Math.round(v.distanceMeters) : null;

      // Retroactive GPS resolution: if target now has coordinates and device coordinates were captured
      if (tLat != null && tLng != null && dLat != null && dLng != null) {
        if (dist == null || v.gpsStatus === "no_target_coords") {
          dist = this.calculateDistanceMeters(dLat, dLng, tLat, tLng);
          v.distanceMeters = dist;
          v.targetLat = tLat;
          v.targetLng = tLng;
          v.gpsStatus = dist <= maxDist ? "in_range" : "out_of_range";
        }
      }

      if (v.gpsStatus === "no_target_coords" || tLat == null || tLng == null) {
        return `<span class="badge badge-gps-no-coords"><svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5A7.5 7.5 0 0 0 12 2z"/><circle cx="12" cy="9.5" r="2.5"/></svg> No Target Coords</span>`;
      }

      const distStr = dist != null ? ` (${dist}m)` : "";
      let mapLinkHtml = "";

      if (dLat != null && dLng != null) {
        const mapUrl = (tLat != null && tLng != null)
          ? `https://www.google.com/maps/dir/?api=1&origin=${tLat},${tLng}&destination=${dLat},${dLng}`
          : `https://www.google.com/maps/search/?api=1&query=${dLat},${dLng}`;
        mapLinkHtml = ` <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="badge-gps-map-link" title="View Location on Google Maps" onclick="event.stopPropagation();"><svg class="btn-svg-icon" viewBox="0 0 24 24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></a>`;
      } else if (tLat != null && tLng != null) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${tLat},${tLng}`;
        mapLinkHtml = ` <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="badge-gps-map-link" title="View Clinic Target on Google Maps" onclick="event.stopPropagation();"><svg class="btn-svg-icon" viewBox="0 0 24 24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></a>`;
      }

      if (v.gpsStatus === "in_range") {
        return `<span class="badge badge-gps-in-range" title="In Range"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5A7.5 7.5 0 0 0 12 2z"/><path d="m9 9.5 2 2 4-4"/></svg> Verified${distStr}${mapLinkHtml}</span>`;
      }
      if (v.gpsStatus === "out_of_range") {
        return `<span class="badge badge-gps-out-of-range" title="Out of Range"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Out of Range${distStr}${mapLinkHtml}</span>`;
      }
      return "";
    }
  };

  // Expose as service and preserve global backward compatibility
  window.GpsService = GpsService;
  window.calculateDistanceMeters = GpsService.calculateDistanceMeters.bind(GpsService);
  window.captureVisitLocation = GpsService.captureVisitLocation.bind(GpsService);
  window.renderGpsBadge = GpsService.renderGpsBadge.bind(GpsService);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = GpsService;
  }
})(typeof window !== "undefined" ? window : global);
