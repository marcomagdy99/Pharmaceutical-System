/**
 * @file timeline-report.js
 * @description Reports page - "Daily Timeline" tab: visits & logged
 * activities for a rep on a given date range (From - To).
 * Depends on shared-report.js (must load after it).
 */

var svgCalendar = (typeof window !== 'undefined' && window.svgCalendar) || '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-inline-end:3px;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>';
var svgClock = (typeof window !== 'undefined' && window.svgClock) || '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-inline-end:3px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
var svgInsertion = (typeof window !== 'undefined' && window.svgInsertion) || '<svg class="badge-svg-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-inline-end:3px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

// Section 8: Tab 2 - Daily Visits & Logged Activities Timeline
// ============================================================================
function renderDailyTimeline() {
  const prompt = document.getElementById('timelinePromptContainer');
  const results = document.getElementById('timelineResultsContainer');
  if (prompt) prompt.style.display = 'none';
  if (results) results.style.display = 'block';

  syncReportsData();

  const _now = (window.getSystemDate && window.getSystemDate()) || new Date();
  const _pad = (n) => String(n).padStart(2, '0');
  const _todayStr = (window.getSystemTodayStr && window.getSystemTodayStr()) || `${_now.getFullYear()}-${_pad(_now.getMonth()+1)}-${_pad(_now.getDate())}`;

  const fromInput = document.getElementById('timelineDateFrom');
  const toInput   = document.getElementById('timelineDateTo');
  const fromDate  = (fromInput && fromInput.value) ? fromInput.value : _todayStr;
  const toDate    = (toInput   && toInput.value)   ? toInput.value   : _todayStr;

  const lmSelect   = document.getElementById('timelineLmSelect');
  const dmSelect   = document.getElementById('timelineDmSelect');
  const repSelect  = document.getElementById('timelineRepSelect');
  const selectedRep = (repSelect && repSelect.value !== 'all') ? repSelect.value : ((dmSelect && dmSelect.value !== 'all') ? dmSelect.value : ((lmSelect && lmSelect.value !== 'all') ? lmSelect.value : 'all'));

  const container  = document.getElementById('timelineEventsContainer');
  const summaryBar = document.getElementById('timelineSummaryBar');
  const lang = getCurrentLang();

  if (!container) return;
  container.replaceChildren();
  const pharmContainer = document.getElementById('timelineReportPharmacyContainer');
  if (pharmContainer) pharmContainer.replaceChildren();

  const user = (typeof window.requireAuth === 'function' ? window.requireAuth() : null)
    || (typeof checkAuth === 'function' ? checkAuth() : null);
  if (!user || !user.id) {
    return;
  }
  const role = window.normalizeRole ? window.normalizeRole(user.role) : String(user.role || '').toLowerCase();
  const isRep = window.isRepRole ? window.isRepRole(user) : (role === 'medical_rep' || role === 'rep');
  const isPM = window.isPMRole ? window.isPMRole(user) : (role === 'product_manager' || role === 'pm');
  const isOpenRole = role === 'admin' || role === 'hr';
  const allUsers = typeof getSharedReportUsers === 'function'
    ? getSharedReportUsers()
    : ((window.store && window.store.users ? window.store.users.getAll() : (window.DEMO_DATA && window.DEMO_DATA.users) || []));

  const getUserEffectiveLinesSet = (uObj) => {
    if (typeof getEffectiveLineIdsForUser === 'function') return getEffectiveLineIdsForUser(uObj);
    if (!uObj) return new Set();
    const lines = window.getUserLines ? window.getUserLines(uObj.id) : [];
    if (lines && lines.length > 0) return new Set(lines.map((l) => l.id));
    return new Set(uObj.lineIds || (uObj.lineId ? [uObj.lineId] : []));
  };

  // Determine allowed team IDs based on role (Fail-Closed for unknown roles)
  let allowedTeamIds = [];
  if (isRep) {
    allowedTeamIds = [user.id];
  } else if (role === 'district_manager') {
    const teamReps = allUsers.filter((u) => u.managerId === user.id);
    allowedTeamIds = [user.id, ...teamReps.map((r) => r.id)];
  } else if (role === 'line_manager') {
    if (typeof getLmTeamUserIds === 'function') {
      allowedTeamIds = [user.id, ...Array.from(getLmTeamUserIds(allUsers, user.id))];
    } else {
      const dmIds = new Set(allUsers.filter((u) => u.managerId === user.id).map((d) => d.id));
      const directAndDmReps = allUsers.filter((u) => u.managerId === user.id || dmIds.has(u.managerId));
      allowedTeamIds = Array.from(new Set([user.id, ...dmIds, ...directAndDmReps.map((r) => r.id)]));
    }
  } else if (role === 'business_unit' || role === 'general_manager') {
    const myDownstream = typeof window.getAllSubordinates === 'function' ? window.getAllSubordinates(user.id) : [];
    if (myDownstream.length > 0) {
      allowedTeamIds = Array.from(new Set([user.id, ...myDownstream.map((u) => u.id)]));
    } else {
      const lmIds = allUsers.filter((u) => u.managerId === user.id).map((u) => u.id);
      const dmIds = allUsers.filter((u) => lmIds.includes(u.managerId)).map((u) => u.id);
      const repIds = allUsers.filter((u) => lmIds.includes(u.managerId) || dmIds.includes(u.managerId)).map((u) => u.id);
      allowedTeamIds = Array.from(new Set([user.id, ...lmIds, ...dmIds, ...repIds]));
    }
  } else if (isPM) {
    const pmLineIds = getUserEffectiveLinesSet(user);
    if (pmLineIds.size > 0) {
      allowedTeamIds = allUsers
        .filter((u) => {
          if (typeof isUserInAnyLine === 'function') return isUserInAnyLine(u, pmLineIds);
          const uLines = getUserEffectiveLinesSet(u);
          return Array.from(uLines).some((lid) => pmLineIds.has(lid));
        })
        .map((u) => u.id);
    }
  } else if (isOpenRole) {
    allowedTeamIds = allUsers.map((u) => u.id);
  }
  const allowedTeamSet = new Set(allowedTeamIds);

  // Filter visits within the date range (only completed or actual visits)
  let visitsInRange = REPORTS_DATA.visits.filter((v) => (v.status === 'completed' || v.isActual === true || v.source === 'actual') && v.date >= fromDate && v.date <= toDate);

  const isVacantSelected = Boolean(selectedRep && selectedRep.startsWith('vacant:'));
  if (isVacantSelected) {
    const vacantAreaId = selectedRep.split(':')[1];
    const allAreas = (window.store && window.store.areas ? window.store.areas.getAll() : (window.DEMO_DATA && window.DEMO_DATA.areas) || []);
    const vacantArea = allAreas.find((a) => a.id === vacantAreaId);
    let canViewVacant = false;
    if (!isRep && vacantArea) {
      const mgrId = typeof window.getAreaManagerId === 'function' ? window.getAreaManagerId(vacantArea, allUsers) : null;
      if (isOpenRole) {
        canViewVacant = true;
      } else if (isPM) {
        const pmLineIds = getUserEffectiveLinesSet(user);
        canViewVacant = Boolean(vacantArea.lineId && pmLineIds.has(vacantArea.lineId));
      } else if (role === 'general_manager' || role === 'business_unit' || role === 'line_manager') {
        canViewVacant = Boolean((mgrId && allowedTeamSet.has(mgrId)) || (vacantArea.dmId && allowedTeamSet.has(vacantArea.dmId)) || (vacantArea.buId && allowedTeamSet.has(vacantArea.buId)));
      } else if (role === 'district_manager') {
        canViewVacant = mgrId === user.id;
      }
    }
    if (!canViewVacant) {
      visitsInRange = [];
    } else {
      const areaNameLower = vacantArea && vacantArea.name ? vacantArea.name.toLowerCase().trim() : null;
      visitsInRange = visitsInRange.filter((v) => {
        if (v.areaId) return v.areaId === vacantAreaId;
        if (areaNameLower && v.area && v.area.toLowerCase().trim() === areaNameLower) {
          if (vacantArea && vacantArea.lineId && v.lineId) return v.lineId === vacantArea.lineId;
          return true;
        }
        return false;
      });
    }
  } else if (isRep) {
    visitsInRange = visitsInRange.filter((v) => v.repId === user.id);
  } else if (selectedRep === 'all') {
    visitsInRange = visitsInRange.filter((v) => allowedTeamSet.has(v.repId) || allowedTeamSet.has(v.doubleWithUserId));
  } else if (selectedRep === 'all_reps') {
    const allowedRepIds = new Set(
      allUsers
        .filter((u) => allowedTeamSet.has(u.id) && (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')))
        .map((u) => u.id)
    );
    visitsInRange = visitsInRange.filter((v) => (v.repId && allowedRepIds.has(v.repId)) || (v.doubleWithUserId && allowedRepIds.has(v.doubleWithUserId)));
  } else if (selectedRep === 'all_dms') {
    const allDmIds = allUsers
      .filter((u) => {
        const r = window.normalizeRole ? window.normalizeRole(u.role) : String(u.role || '').toLowerCase();
        return allowedTeamSet.has(u.id) && r === 'district_manager';
      })
      .map((u) => u.id);
    const dmTeamRepIds = allUsers.filter((u) => allowedTeamSet.has(u.id) && allDmIds.includes(u.managerId)).map((u) => u.id);
    const combinedDmIds = new Set([...allDmIds, ...dmTeamRepIds]);
    visitsInRange = visitsInRange.filter((v) => (v.repId && combinedDmIds.has(v.repId)) || (v.doubleWithUserId && combinedDmIds.has(v.doubleWithUserId)));
  } else if (selectedRep) {
    const selectedUserObj = allUsers.find((u) => u.id === selectedRep);
    const selRole = selectedUserObj ? (window.normalizeRole ? window.normalizeRole(selectedUserObj.role) : String(selectedUserObj.role || '').toLowerCase()) : '';
    const isDM = selRole === 'district_manager' || selRole === 'dm';
    const isLM = selRole === 'line_manager' || selRole === 'lm';
    if (isLM) {
      const lmIds = typeof getLmTeamUserIds === 'function'
        ? getLmTeamUserIds(allUsers, selectedRep)
        : new Set(allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id));
      const lmTeamSet = new Set([selectedRep, ...Array.from(lmIds)].filter((id) => allowedTeamSet.has(id)));
      visitsInRange = visitsInRange.filter((v) => (v.repId && lmTeamSet.has(v.repId)) || (v.doubleWithUserId && lmTeamSet.has(v.doubleWithUserId)));
    } else if (isDM) {
      const dmReps = allUsers.filter((u) => u.managerId === selectedRep && allowedTeamSet.has(u.id)).map((u) => u.id);
      const dmTeamSet = new Set([selectedRep, ...dmReps].filter((id) => allowedTeamSet.has(id)));
      visitsInRange = visitsInRange.filter((v) => (v.repId && dmTeamSet.has(v.repId)) || (v.doubleWithUserId && dmTeamSet.has(v.doubleWithUserId)));
    } else if (allowedTeamSet.has(selectedRep)) {
      visitsInRange = visitsInRange.filter((v) => v.repId === selectedRep || v.doubleWithUserId === selectedRep);
    } else {
      visitsInRange = [];
    }
  }

  const selectedLineId = window.selectedReportLineId || document.getElementById('reportLineFilter')?.value || 'all';
  if (isPM) {
    const pmLineIds = getUserEffectiveLinesSet(user);
    visitsInRange = visitsInRange.filter((v) => {
      if (v.lineId) return pmLineIds.has(v.lineId);
      const repLines = getUserEffectiveLinesSet(allUsers.find((u) => u.id === v.repId) || { id: v.repId });
      return Array.from(repLines).some((lid) => pmLineIds.has(lid));
    });
  }
  if (selectedLineId !== 'all') {
    visitsInRange = visitsInRange.filter((v) => {
      if (v.lineId) return v.lineId === selectedLineId;
      const repLines = window.getUserLines ? window.getUserLines(v.repId) : [];
      return repLines.some((l) => l.id === selectedLineId);
    });
  }

  // Load stored activities across the range for all relevant users
  let activityTargetIds = [];
  if (isVacantSelected) {
    activityTargetIds = [];
  } else if (isRep) {
    activityTargetIds = [user.id];
  } else if (selectedRep === 'all_reps') {
    activityTargetIds = allUsers
      .filter((u) => allowedTeamSet.has(u.id) && (window.isRepRole ? window.isRepRole(u) : (u.role === 'medical_rep' || u.role === 'rep')))
      .map((u) => u.id);
  } else if (selectedRep === 'all_dms') {
    const allDmIds = allUsers
      .filter((u) => {
        const r = window.normalizeRole ? window.normalizeRole(u.role) : String(u.role || '').toLowerCase();
        return allowedTeamSet.has(u.id) && r === 'district_manager';
      })
      .map((u) => u.id);
    const dmTeamRepIds = allUsers.filter((u) => allowedTeamSet.has(u.id) && allDmIds.includes(u.managerId)).map((u) => u.id);
    activityTargetIds = Array.from(new Set([...allDmIds, ...dmTeamRepIds]));
  } else if (selectedRep && selectedRep !== 'all') {
    const selectedUserObj = allUsers.find((u) => u.id === selectedRep);
    const selRole = selectedUserObj ? (window.normalizeRole ? window.normalizeRole(selectedUserObj.role) : String(selectedUserObj.role || '').toLowerCase()) : '';
    if (selRole === 'line_manager' || selRole === 'lm') {
      const lmIds = typeof getLmTeamUserIds === 'function'
        ? getLmTeamUserIds(allUsers, selectedRep)
        : new Set(allUsers.filter((u) => u.managerId === selectedRep).map((u) => u.id));
      activityTargetIds = [selectedRep, ...Array.from(lmIds)].filter((id) => allowedTeamSet.has(id));
    } else if (selRole === 'district_manager' || selRole === 'dm') {
      const dmReps = allUsers.filter((u) => u.managerId === selectedRep && allowedTeamSet.has(u.id)).map((u) => u.id);
      activityTargetIds = [selectedRep, ...dmReps].filter((id) => allowedTeamSet.has(id));
    } else {
      activityTargetIds = allowedTeamSet.has(selectedRep) ? [selectedRep] : [];
    }
  } else {
    activityTargetIds = [...allowedTeamIds];
  }

  if (selectedLineId !== 'all') {
    activityTargetIds = activityTargetIds.filter((tId) => {
      const repLines = window.getUserLines ? window.getUserLines(tId) : [];
      return repLines.some((l) => l.id === selectedLineId);
    });
  }

  const activityEvents = [];
  activityTargetIds.forEach((targetId) => {
    let repStoredActivities = {};
    try {
      if (window.store && window.store.activities && typeof window.store.activities.getAllForUser === 'function') {
        repStoredActivities = window.store.activities.getAllForUser(targetId) || {};
      } else {
        const raw = localStorage.getItem(`pharma_activities_data_${targetId}`);
        if (raw) repStoredActivities = JSON.parse(raw);
      }
    } catch (e) {}

    const targetRepObj = allUsers.find((u) => u.id === targetId) || { id: targetId, name: targetId };

    Object.keys(repStoredActivities).forEach((dateKey) => {
      if (dateKey < fromDate || dateKey > toDate) return;
      const dayActs = repStoredActivities[dateKey] || {};
      ['AM', 'PM'].forEach((period) => {
        const act = dayActs[period];
        if (act && act.type) {
          const actTypeTrans = (window.translations && window.translations[lang] && window.translations[lang][`type${act.type}`]) || act.type;
          activityEvents.push({
            id: `act_${targetId}_${dateKey}_${period}`,
            targetName: `${actTypeTrans} (${period} Activity)`,
            activityType: actTypeTrans,
            class: 'Activity',
            specialty: act.notes || 'Logged Daily Activity',
            type: 'activity',
            date: dateKey,
            time: period === 'AM' ? '09:00' : '14:00',
            period: period,
            repId: targetId,
            repName: targetRepObj.name || targetId,
            isActual: true,
            source: 'activity',
            status: 'completed',
          });
        }
      });
    });
  });

  const combinedTimeline = [...visitsInRange, ...activityEvents];
  const totalItems       = combinedTimeline.length;
  const activityCount    = combinedTimeline.filter((v) => v.type === 'activity').length;
  const actualVisitCount = combinedTimeline.filter((v) => v.type !== 'activity' && (v.source === 'actual' || v.isActual)).length;
  const plannedVisitCount= combinedTimeline.filter((v) => v.type !== 'activity' && !v.isActual && v.source !== 'actual').length;

  const dateBadge = document.getElementById('timelineDateBadge');
  if (dateBadge) {
    dateBadge.textContent = fromDate === toDate ? (fromDate === _todayStr ? 'Today' : fromDate) : `${fromDate} → ${toDate}`;
  }

  if (summaryBar) {
    const esc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '');
    const rangeLabel = fromDate === toDate ? fromDate : `${fromDate} → ${toDate}`;
    summaryBar.innerHTML = `
      <div class="timeline-stat-chip">
        <span>Period:</span>
        <strong class="timeline-period-label">${esc(rangeLabel)}</strong>
      </div>
      <div class="timeline-stat-chip total-events">
        <strong class="stat-value stat-val-primary">${totalItems}</strong>
        <span class="stat-label">Total Events</span>
      </div>
      <div class="timeline-stat-chip actual-events">
        <strong class="stat-value stat-val-actual">${actualVisitCount}</strong>
        <span class="stat-label">
          <span class="legend-dot actual legend-dot-mini"></span>
          Actual Visits
        </span>
      </div>
      <div class="timeline-stat-chip planned-events">
        <strong class="stat-value stat-val-planned">${plannedVisitCount}</strong>
        <span class="stat-label">
          <span class="legend-dot planned legend-dot-mini"></span>
          From Plan
        </span>
      </div>
      <div class="timeline-stat-chip joint-events">
        <strong class="stat-value stat-val-activity">${activityCount}</strong>
        <span class="stat-label">
          <span class="legend-dot activity legend-dot-mini"></span>
          Activities
        </span>
      </div>
    `;
  }

  if (combinedTimeline.length === 0) {
    container.innerHTML = `
      <div class="timeline-empty-card">
        <span class="timeline-empty-icon"><svg style="width:36px;height:36px;stroke:currentColor;fill:none;stroke-width:1.85;" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span>
        <h4 class="timeline-empty-title">No visits or activities recorded in this period</h4>
        <p class="timeline-empty-subtitle">Try a different date or date range</p>
      </div>
    `;
    if (pharmContainer) {
      pharmContainer.innerHTML = `
        <div class="timeline-empty-card">
          <span class="timeline-empty-icon"><svg style="width:36px;height:36px;stroke:currentColor;fill:none;stroke-width:1.85;" viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg></span>
          <h4 class="timeline-empty-title">No pharmacy visits recorded in this period</h4>
        </div>
      `;
    }
    return;
  }

  // Sort by date ascending (earliest day first), then AM before PM
  const sortedTimeline = combinedTimeline.sort((a, b) => {
    const dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;
    const periodA = (a.period || 'PM').toUpperCase() === 'AM' ? 0 : 1;
    const periodB = (b.period || 'PM').toUpperCase() === 'AM' ? 0 : 1;
    return periodA - periodB;
  });

  let reportMedicalCount = 0;
  let reportPharmacyCount = 0;

  sortedTimeline.forEach((v) => {
    const isActivity = v.type === 'activity';
    const isActual   = (v.source === 'actual' || !!v.isActual);
    const borderClass = isActivity ? 'activity-border' : (isActual ? 'actual-border' : 'planned-border');
    const dotClass    = isActivity ? 'activity' : (isActual ? 'actual' : 'planned');
    const isPharm     = v.targetType === 'pharmacy' || (v.period || '').toLowerCase() === 'pharmacy' || (v.doctorId && String(v.doctorId).startsWith('pharm'));
    const period      = isPharm ? 'PHARM' : (v.period || 'PM').toUpperCase();
    const periodClass = isPharm ? 'pharm' : period.toLowerCase();

    let badgeLabel = '';
    let badgeClass = 'planned';
    if (isActivity) {
      badgeClass = 'activity';
      badgeLabel = 'Logged Activity';
    } else if (isActual) {
      badgeClass = 'actual';
      badgeLabel = 'Actual without Plan';
    } else {
      badgeClass = 'planned';
      badgeLabel = 'Planned & Executed';
    }

    const esc = typeof window.escapeHtml === 'function' ? window.escapeHtml : (s) => String(s || '');
    const safeTargetName = esc(v.targetName || '');
    const safeActivityType = esc(v.activityType || v.targetName || '');
    const safeSpecialty = esc(v.specialty || '');
    const safeRepName = esc(v.repName || '');
    const safeClass = esc(v.class || 'A');
    const safeDate = esc(v.date || '');
    const safePeriod = esc(period);
    const safePeriodClass = esc(periodClass);
    const safeTime = esc(v.time || '10:00');
    const safeInsDate = esc(v.insertionDate || (v.createdAt ? String(v.createdAt).slice(0, 10) : (v.date || '')));
    const safeInsTime = esc(v.insertionTime || (v.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (v.time || '10:00')));

    const card = document.createElement('div');
    card.className = 'timeline-event-card';
    card.innerHTML = `
      <div class="timeline-time-col">
        <span class="timeline-date-label">${safeDate}</span>
        <span class="timeline-period-pill ${safePeriodClass}">${safePeriod}</span>
        <div class="timeline-icon-dot ${dotClass}"></div>
      </div>
      <div class="timeline-content-box ${borderClass}">
        <div class="timeline-card-header">
          <strong class="timeline-target-title ${isActivity ? 'is-activity' : ''}">${safeTargetName}</strong>
          <span class="visit-badge-pill ${badgeClass}">${badgeLabel}</span>
        </div>
        ${isActivity ? `
          <div class="timeline-activity-desc">
            <span class="timeline-activity-type">
              Activity Type: <strong>${safeActivityType}</strong>
            </span>
            ${safeSpecialty ? `• <span class="timeline-activity-notes">Notes: <em>"${safeSpecialty}"</em></span>` : ''}
            • <span class="timeline-activity-rep">Employee: <strong>${safeRepName}</strong></span>
          </div>
        ` : `
          <div class="timeline-visit-details">
            <span>${safeSpecialty}</span> • <span>Class: <strong>${safeClass}</strong></span> • <span>Rep: <strong>${safeRepName}</strong></span>
          </div>
        `}
        <div class="timeline-entry-timestamp">
          <span><strong>${svgCalendar} Visit Day:</strong> ${safeDate} ${safePeriod}</span>
          <span><strong>${svgClock} Visit Time:</strong> ${safeTime}</span>
          <span class="timeline-ts-insertion">
            <strong>${svgInsertion} Insertion Date:</strong> ${safeInsDate}
            • <strong>Time:</strong> ${safeInsTime}
          </span>
        </div>
      </div>
    `;

    if (isPharm) {
      reportPharmacyCount++;
      const pharmBox = document.getElementById('timelineReportPharmacyContainer');
      if (pharmBox) pharmBox.appendChild(card);
      else container.appendChild(card);
    } else {
      reportMedicalCount++;
      container.appendChild(card);
    }
  });

  if (reportMedicalCount === 0) {
    container.innerHTML = `
      <div class="timeline-empty-card timeline-empty-card-sm">
        <span class="timeline-empty-icon timeline-empty-icon-sm"><svg class="badge-svg-icon" style="width:18px;height:18px;" viewBox="0 0 24 24"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg></span>
        <h4 class="timeline-empty-title">No Doctor or Hospital visits in this period</h4>
      </div>
    `;
  }
  const pharmBox = document.getElementById('timelineReportPharmacyContainer');
  if (pharmBox && reportPharmacyCount === 0) {
    pharmBox.innerHTML = `
      <div class="timeline-empty-card timeline-empty-card-sm">
        <span class="timeline-empty-icon timeline-empty-icon-sm"><svg style="width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.85;" viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg></span>
        <h4 class="timeline-empty-title">No Pharmacy visits in this period</h4>
      </div>
    `;
  }
}

window.switchReportTimelineScope = function (scope) {
  const btnMedical = document.getElementById('btnReportScopeMedical');
  const btnPharm = document.getElementById('btnReportScopePharmacy');
  const secMedical = document.getElementById('reportMedicalVisitsSection');
  const secPharm = document.getElementById('reportPharmacyVisitsSection');

  if (scope === 'pharmacy') {
    if (btnPharm) { btnPharm.classList.add('active'); btnPharm.classList.remove('btn-outline'); }
    if (btnMedical) { btnMedical.classList.remove('active'); btnMedical.classList.add('btn-outline'); }
    if (secPharm) secPharm.style.display = 'block';
    if (secMedical) secMedical.style.display = 'none';
  } else {
    if (btnMedical) { btnMedical.classList.add('active'); btnMedical.classList.remove('btn-outline'); }
    if (btnPharm) { btnPharm.classList.remove('active'); btnPharm.classList.add('btn-outline'); }
    if (secMedical) secMedical.style.display = 'block';
    if (secPharm) secPharm.style.display = 'none';
  }
};

window.onTimelineFilterChange = function () {
  const results = document.getElementById('timelineResultsContainer');
  if (results && results.style.display !== 'none' && typeof renderDailyTimeline === 'function') {
    renderDailyTimeline();
  }
};


