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

      if (!companySettings.requireGpsValidation) {
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

      if (!companySettings.requireGpsValidation) return "";

      if (v.gpsStatus === "permission_denied") {
        return `<span class="badge badge-gps-denied">⚠️ GPS Disabled by Rep</span>`;
      }
      if (v.gpsStatus === "no_target_coords") {
        return `<span class="badge badge-gps-no-coords">📍 No Target Coords</span>`;
      }

      const dist = v.distanceMeters != null ? Math.round(v.distanceMeters) : null;
      const distStr = dist != null ? ` (${dist}m)` : "";

      let mapLinkHtml = "";
      const dLat = v.deviceLat;
      const dLng = v.deviceLng;
      let tLat = v.targetLat;
      let tLng = v.targetLng;

      if ((tLat == null || tLng == null) && typeof window.getMockDoctors === "function") {
        const allDocs = window.getMockDoctors();
        const allHosps = typeof window.getMockHospitals === "function" ? window.getMockHospitals() : [];
        const allPharms = typeof window.getMockPharmacies === "function" ? window.getMockPharmacies() : [];
        const found = (allDocs && allDocs.find((d) => d.id === v.doctorId || d.name === v.doctorName)) ||
                      (allHosps && allHosps.find((h) => h.id === v.doctorId || h.name === v.doctorName)) ||
                      (allPharms && allPharms.find((p) => p.id === v.doctorId || p.name === v.doctorName));
        if (found && found.lat != null && found.lng != null) {
          tLat = found.lat;
          tLng = found.lng;
        }
      }

      if (dLat != null && dLng != null) {
        const mapUrl = (tLat != null && tLng != null)
          ? `https://www.google.com/maps/dir/?api=1&origin=${tLat},${tLng}&destination=${dLat},${dLng}`
          : `https://www.google.com/maps/search/?api=1&query=${dLat},${dLng}`;
        mapLinkHtml = ` <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="badge-gps-map-link" title="View Location on Google Maps" onclick="event.stopPropagation();">🗺️</a>`;
      } else if (tLat != null && tLng != null) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${tLat},${tLng}`;
        mapLinkHtml = ` <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="badge-gps-map-link" title="View Clinic Target on Google Maps" onclick="event.stopPropagation();">🗺️</a>`;
      }

      if (v.gpsStatus === "in_range") {
        return `<span class="badge badge-gps-in-range" title="In Range">✅ Verified${distStr}${mapLinkHtml}</span>`;
      }
      if (v.gpsStatus === "out_of_range") {
        return `<span class="badge badge-gps-out-of-range" title="Out of Range">⚠️ Out of Range${distStr}${mapLinkHtml}</span>`;
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
