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
      if (
        lat1 === null || lat1 === undefined || lat1 === "" ||
        lon1 === null || lon1 === undefined || lon1 === "" ||
        lat2 === null || lat2 === undefined || lat2 === "" ||
        lon2 === null || lon2 === undefined || lon2 === ""
      ) {
        return null;
      }
      const nLat1 = Number(lat1);
      const nLon1 = Number(lon1);
      const nLat2 = Number(lat2);
      const nLon2 = Number(lon2);
      if (
        !Number.isFinite(nLat1) || !Number.isFinite(nLon1) ||
        !Number.isFinite(nLat2) || !Number.isFinite(nLon2)
      ) {
        return null;
      }
      // Strict coordinate range validation & Null Island (0,0) rejection
      if (
        Math.abs(nLat1) > 90 || Math.abs(nLat2) > 90 ||
        Math.abs(nLon1) > 180 || Math.abs(nLon2) > 180 ||
        (nLat1 === 0 && nLon1 === 0) || (nLat2 === 0 && nLon2 === 0)
      ) {
        return null;
      }
      const R = 6371e3; // Earth radius in meters
      const rad = Math.PI / 180;
      const phi1 = nLat1 * rad;
      const phi2 = nLat2 * rad;
      const deltaPhi = (nLat2 - nLat1) * rad;
      const deltaLambda = (nLon2 - nLon1) * rad;

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
      const companySettings = ((window.store && window.store.companySettings && window.store.companySettings.get()) || { requireGpsValidation: true, gpsMaxDistanceMeters: 200 });

      const isGpsRequired = Boolean(companySettings.requireGpsValidation || companySettings.enforceGpsVerification);
      if (!isGpsRequired) {
        return callback({ required: false });
      }

      if (typeof navigator === "undefined" || !navigator.geolocation) {
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
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
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
      const companySettings = ((window.store && window.store.companySettings && window.store.companySettings.get()) || { requireGpsValidation: true, gpsMaxDistanceMeters: 200 });

      const isGpsRequired = Boolean(companySettings.requireGpsValidation || companySettings.enforceGpsVerification);
      if (!isGpsRequired) return "";

      if (v.gpsStatus === "permission_denied") {
        return `<span class="badge badge-gps-denied"><svg class="header-svg-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.85" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> GPS Disabled by Rep</span>`;
      }

      // Safely validate and parse coordinates without side effects on object v
      const parseCoord = (val) => {
        if (val === null || val === undefined || val === "") return null;
        const n = Number(val);
        return Number.isFinite(n) ? n : null;
      };

      const dLat = parseCoord(v.deviceLat);
      const dLng = parseCoord(v.deviceLng);
      let tLat = parseCoord(v.targetLat);
      let tLng = parseCoord(v.targetLng);

      if (tLat === null || tLng === null) {
        let allDocs = [];
        let allHosps = [];
        let allPharms = [];

        // Prioritize production store first, DEMO mock fallback only if DEMO_MODE active
        if (window.store) {
          allDocs = (window.store.doctors && window.store.doctors.getAll) ? window.store.doctors.getAll() : (window.DEMO_DATA?.doctors || []);
          allHosps = (window.store.hospitals && window.store.hospitals.getAll) ? window.store.hospitals.getAll() : (window.DEMO_DATA?.hospitals || []);
          allPharms = (window.store.pharmacies && window.store.pharmacies.getAll) ? window.store.pharmacies.getAll() : (window.DEMO_DATA?.pharmacies || []);
        } else if (window.DEMO_MODE && typeof window.getMockDoctors === "function") {
          allDocs = window.getMockDoctors() || [];
          allHosps = typeof window.getMockHospitals === "function" ? window.getMockHospitals() || [] : [];
          allPharms = typeof window.getMockPharmacies === "function" ? window.getMockPharmacies() || [] : [];
        } else if (window.DEMO_DATA) {
          allDocs = window.DEMO_DATA.doctors || [];
          allHosps = window.DEMO_DATA.hospitals || [];
          allPharms = window.DEMO_DATA.pharmacies || [];
        }

        const vDocName = (v.doctorName || "").trim().toLowerCase();
        let found = null;
        if (v.doctorId) {
          found = allDocs.find((d) => d.id === v.doctorId) ||
                  allHosps.find((h) => h.id === v.doctorId) ||
                  allPharms.find((p) => p.id === v.doctorId);
        } else if (vDocName) {
          // Only fallback to name match if doctorId is missing AND exactly 1 unique match exists
          const allAccounts = [...allDocs, ...allHosps, ...allPharms];
          const nameMatches = allAccounts.filter((x) => (x.name || "").trim().toLowerCase() === vDocName);
          if (nameMatches.length === 1) {
            found = nameMatches[0];
          }
        }

        if (found) {
          tLat = parseCoord(found.lat);
          tLng = parseCoord(found.lng);
        }
      }

      const maxDist = companySettings.gpsMaxDistanceMeters || 200;
      let effectiveDist = parseCoord(v.distanceMeters);
      let effectiveStatus = v.gpsStatus;

      // Always recalculate distance from coordinates when all 4 are present to prevent spoofing
      if (tLat !== null && tLng !== null && dLat !== null && dLng !== null) {
        effectiveDist = this.calculateDistanceMeters(dLat, dLng, tLat, tLng);
        effectiveStatus = (effectiveDist !== null && effectiveDist <= maxDist) ? "in_range" : "out_of_range";
      } else if (dLat === null || dLng === null) {
        // If device coordinates missing but status claims in_range, mark as unverified
        if (effectiveStatus === "in_range") {
          effectiveStatus = "unverified";
        }
      }

      if (effectiveStatus === "no_target_coords" || tLat === null || tLng === null) {
        return `<span class="badge badge-gps-no-coords"><svg class="btn-svg-icon" viewBox="0 0 24 24"><path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5A7.5 7.5 0 0 0 12 2z"/><circle cx="12" cy="9.5" r="2.5"/></svg> No Target Coords</span>`;
      }

      const distStr = effectiveDist !== null ? ` (${Math.round(effectiveDist)}m)` : "";
      let mapLinkHtml = "";

      if (dLat !== null && dLng !== null) {
        const mapUrl = (tLat !== null && tLng !== null)
          ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(tLat + ',' + tLng)}&destination=${encodeURIComponent(dLat + ',' + dLng)}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dLat + ',' + dLng)}`;
        mapLinkHtml = ` <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="badge-gps-map-link" title="View Location on Google Maps" onclick="event.stopPropagation();"><svg class="btn-svg-icon" viewBox="0 0 24 24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></a>`;
      } else if (tLat !== null && tLng !== null) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tLat + ',' + tLng)}`;
        mapLinkHtml = ` <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="badge-gps-map-link" title="View Clinic Target on Google Maps" onclick="event.stopPropagation();"><svg class="btn-svg-icon" viewBox="0 0 24 24"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg></a>`;
      }

      if (effectiveStatus === "in_range") {
        return `<span class="badge badge-gps-in-range" title="In Range"><svg class="badge-svg-icon" viewBox="0 0 24 24"><path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5A7.5 7.5 0 0 0 12 2z"/><path d="m9 9.5 2 2 4-4"/></svg> Verified${distStr}${mapLinkHtml}</span>`;
      }
      if (effectiveStatus === "unverified") {
        return `<span class="badge badge-gps-out-of-range" title="GPS Unverified (Missing Device Coordinates)">⚠️ Unverified${mapLinkHtml}</span>`;
      }
      if (effectiveStatus === "out_of_range") {
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
