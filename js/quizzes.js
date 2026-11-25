/**
 * @file quizzes.js
 * @description Role-based quiz score management and cascading hierarchy filters
 * Supports Admin-only score uploading/quiz creation, and cascading hierarchy reporting for BU, LM, and DM.
 */

// Production mode: quizzes and scores are managed centrally in Firebase Firestore
const demoQuizzes = [];
let currentLang = "en";
let _currentQuizToolsReps = [];
let _refreshQuizComparisonView = null;

function getAuthenticatedQuizUser() {
  const authUser = (typeof window !== "undefined" && window.requireAuth)
    ? window.requireAuth()
    : ((typeof checkAuth === "function") ? checkAuth() : null);
  if (!authUser || !authUser.id) return null;
  return authUser;
}

function getQuizUsersList() {
  if (typeof window !== "undefined" && window.store && window.store.users && typeof window.store.users.getAll === "function") {
    return window.store.users.getAll();
  }
  return (typeof window !== "undefined" && window.DEMO_DATA && Array.isArray(window.DEMO_DATA.users))
    ? window.DEMO_DATA.users
    : [];
}

function getPmScopedLineIds(user) {
  if (!user || !user.id) return [];
  if (typeof window !== "undefined" && typeof window.getUserLines === "function") {
    const lines = window.getUserLines(user.id) || [];
    if (lines.length > 0) return lines.map((l) => l.id).filter(Boolean);
  }
  if (Array.isArray(user.lineIds) && user.lineIds.length > 0) return user.lineIds.filter(Boolean);
  return user.lineId ? [user.lineId] : [];
}

function getUserLineIdsAny(userId) {
  if (!userId) return [];
  if (typeof window !== "undefined" && typeof window.getUserLines === "function") {
    const lines = window.getUserLines(userId) || [];
    if (lines.length > 0) return lines.map((l) => l.id).filter(Boolean);
  }
  const u = getQuizUsersList().find((x) => x.id === userId);
  if (!u) return [];
  if (Array.isArray(u.lineIds) && u.lineIds.length > 0) return u.lineIds.filter(Boolean);
  return u.lineId ? [u.lineId] : [];
}

function getQuizLineIds(quiz) {
  if (!quiz) return [];
  if (Array.isArray(quiz.lineIds) && quiz.lineIds.length > 0) return quiz.lineIds.filter(Boolean);
  return quiz.lineId ? [quiz.lineId] : [];
}

function isQuizVisibleForLineIds(quiz, allowedLineIds) {
  if (!quiz) return false;
  const qLines = getQuizLineIds(quiz);
  if (qLines.length === 0) return true; // Global quiz (Admin)
  if (!Array.isArray(allowedLineIds) || allowedLineIds.length === 0) return false;
  return qLines.some((lid) => allowedLineIds.includes(lid));
}

function resolveQuizUserName(userId, fallback) {
  if (typeof window !== "undefined" && window.store && window.store.users && userId) {
    const u = window.store.users.getById(userId);
    if (u && u.name) return u.name;
  }
  if (typeof window !== "undefined" && window.DEMO_DATA && window.DEMO_DATA.users && userId) {
    const u = window.DEMO_DATA.users.find(x => x.id === userId);
    if (u && u.name) return u.name;
  }
  return fallback;
}

const demoScores = [];

// Multilingual dictionary for Quizzes module
const quizTranslations = {
  en: {
    quizzes_title: "Quizzes",
    create_quiz: "Create Quiz",
    average_score: "Average Score",
    total_quizzes: "Total Quizzes Taken",
    best_score: "Best Score",
    quiz_history: "Quiz History",
    quiz_name: "Quiz Name",
    date: "Date",
    score: "Score",
    total_marks: "Total Marks",
    percentage: "Percentage",
    grade: "Grade",
    enter_scores: "Enter Scores",
    select_quiz: "Select Quiz",
    choose_quiz: "Choose a quiz...",
    rep_name: "Rep Name",
    save_scores: "Save Scores",
    team_comparison: "Team Scores Comparison",
    quiz_title: "Title",
    quiz_title_placeholder: "Enter quiz title",
    total_marks_placeholder: "e.g. 50",
    save: "Save",
    dashboard: "Dashboard",
    logout: "Logout",
    alert_scores_saved: "Quiz scores saved successfully!",
    alert_quiz_created: "Quiz created successfully!",
    filter_bu: "BU:",
    filter_lm: "LM:",
    filter_dm: "DM:",
    all_bus: "All BUs",
    all_lms: "All LMs",
    all_dms: "All DMs",
    no_reps_found: "No medical representatives found for the selected team.",
    viewing_team_dm: "Team:",
    all_reps: "All Representatives"
  }
};

// ============================================================================
// Local Persistence Helpers for Quizzes and Scores
// ============================================================================

function getStoredQuizzes() {
  if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.quizzes) && window.DEMO_DATA.quizzes.length > 0) {
    return window.DEMO_DATA.quizzes;
  }
  try {
    const raw = localStorage.getItem('pharma_quizzes');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading pharma_quizzes from localStorage:', err);
  }
  return [...demoQuizzes];
}

function saveStoredQuizzes(quizzes) {
  try {
    localStorage.setItem('pharma_quizzes', JSON.stringify(quizzes));
    if (window.DEMO_DATA) window.DEMO_DATA.quizzes = quizzes;
    if (typeof window.saveDataToStorage === 'function') window.saveDataToStorage();
    if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('pharma:store:changed', { detail: { entity: 'quizzes', action: 'save', payload: quizzes } }));
    }
  } catch (err) {
    console.error('Error saving pharma_quizzes to localStorage:', err);
  }
}

function getStoredScores() {
  let list = [];
  if (window.DEMO_DATA && Array.isArray(window.DEMO_DATA.quizScores) && window.DEMO_DATA.quizScores.length > 0) {
    list = window.DEMO_DATA.quizScores;
  } else {
    try {
      const raw = localStorage.getItem('pharma_quiz_scores');
      if (raw) list = JSON.parse(raw);
    } catch (err) {
      console.error('Error reading pharma_quiz_scores from localStorage:', err);
    }
    if (!list || !list.length) list = [...demoScores];
  }
  return list.map((s, idx) => ({
    ...s,
    id: s.id || (s.quizId && s.userId ? `${s.quizId}_${s.userId}` : `qscore_${Date.now()}_${idx}`)
  }));
}

function saveStoredScores(scores) {
  try {
    const normalized = (scores || []).map((s, idx) => ({
      ...s,
      id: s.id || (s.quizId && s.userId ? `${s.quizId}_${s.userId}` : `qscore_${Date.now()}_${idx}`)
    }));
    localStorage.setItem('pharma_quiz_scores', JSON.stringify(normalized));
    if (window.DEMO_DATA) window.DEMO_DATA.quizScores = normalized;
    if (typeof window.saveDataToStorage === 'function') window.saveDataToStorage();
    if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('pharma:store:changed', { detail: { entity: 'quizScores', action: 'save', payload: normalized } }));
    }
  } catch (err) {
    console.error('Error saving pharma_quiz_scores to localStorage:', err);
  }
}

// Returns HTML badge markup for score percentage
function getGradeBadge(percentage) {
  if (percentage >= 90) return '<span class="grade-badge grade-a">A</span>';
  if (percentage >= 75) return '<span class="grade-badge grade-b">B</span>';
  if (percentage >= 60) return '<span class="grade-badge grade-c">C</span>';
  return '<span class="grade-badge grade-f">F</span>';
}

// ============================================================================
// Main Page Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Merge translations
  if (window.translations) {
    window.translations.en = { ...window.translations.en, ...quizTranslations.en };
  } else {
    window.translations = quizTranslations;
  }

  // Resolve current authenticated user (Fail-Closed: never impersonate from localStorage fallback)
  const authUser = getAuthenticatedQuizUser();
  if (!authUser) return;

  const userRole = (typeof normalizeRole === 'function') ? normalizeRole(authUser.role) : String(authUser.role || '').toLowerCase();
  const userId = authUser.id;

  const isRep = (typeof window.isRepRole === 'function') ? window.isRepRole(authUser) : (userRole === 'medical_rep' || userRole === 'rep');
  const isAdminUser = (userRole === 'admin' || userRole === 'product_manager');

  // Display appropriate UI view
  if (isRep) {
    document.querySelectorAll('.rep-view').forEach((el) => { el.style.display = 'block'; });
    document.querySelectorAll('.admin-view').forEach((el) => { el.style.display = 'none'; });
    initRepView(userId);
  } else {
    document.querySelectorAll('.rep-view').forEach((el) => { el.style.display = 'none'; });
    document.querySelectorAll('.admin-view').forEach((el) => { el.style.display = 'block'; });

    // Permission control: Only Admin and Product Manager can create quizzes or enter scores
    const createBtn = document.getElementById('create-quiz-btn');
    if (createBtn) {
      createBtn.style.display = isAdminUser ? 'inline-block' : 'none';
    }

    const enterCard = document.getElementById('enter-scores-card');
    if (enterCard) {
      enterCard.style.display = isAdminUser ? 'block' : 'none';
    }

    initManagerView(authUser, userRole);
  }

  // Apply current language
  const activeLang = (typeof getCurrentLang === 'function')
    ? getCurrentLang()
    : (localStorage.getItem('pharmaLang') || localStorage.getItem('lang') || 'en');
  currentLang = activeLang;
  if (typeof applyTranslations === 'function') {
    applyTranslations(activeLang);
  }
});

// ============================================================================
// Medical Rep View Logic
// ============================================================================

function initRepView(userId) {
  const allScores = getStoredScores();
  const allQuizzes = getStoredQuizzes();
  const repLineIds = getUserLineIdsAny(userId);
  const userScores = allScores.filter((s) => {
    if (s.userId !== userId) return false;
    const quiz = allQuizzes.find((q) => q.id === s.quizId);
    if (!quiz) return true;
    return isQuizVisibleForLineIds(quiz, repLineIds);
  });

  const totalQuizzes = userScores.length;
  let totalPerc = 0;
  let bestPerc = 0;

  const tbody = document.getElementById('quiz-history-body');
  if (!tbody) return;
  tbody.replaceChildren();

  const sortedScores = userScores.map((score) => {
    const quiz = allQuizzes.find((q) => q.id === score.quizId);
    const rawTotal = (quiz && quiz.totalMarks) ? Number(quiz.totalMarks) : (Number(score.totalMarks) || 50);
    return {
      ...score,
      quizTitle: quiz ? quiz.title : 'Unknown Quiz',
      date: quiz ? (quiz.date || '') : '',
      totalMarks: rawTotal > 0 ? rawTotal : 50
    };
  }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  sortedScores.forEach((score) => {
    const perc = score.totalMarks > 0 ? ((Number(score.score) || 0) / score.totalMarks) * 100 : 0;
    totalPerc += perc;
    if (perc > bestPerc) bestPerc = perc;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-medium ps-3 col-quiz-name">${window.escapeHtml(score.quizTitle || "")}</td>
      <td class="text-secondary text-center col-quiz-date">${window.escapeHtml(score.date || "—")}</td>
      <td class="fw-bold text-center col-quiz-score">${window.escapeHtml(score.score)}</td>
      <td class="text-secondary text-center col-quiz-total">${window.escapeHtml(score.totalMarks)}</td>
      <td class="text-center col-quiz-perc"><span class="badge quiz-perc-badge border">${perc.toFixed(1)}%</span></td>
      <td class="text-center pe-3 col-quiz-grade">${getGradeBadge(perc)}</td>
    `;
    tbody.appendChild(tr);
  });

  const avgPerc = totalQuizzes > 0 ? (totalPerc / totalQuizzes) : 0;
  const avgElem = document.getElementById('avg-score');
  const totalElem = document.getElementById('total-quizzes');
  const bestElem = document.getElementById('best-score');

  if (avgElem) avgElem.textContent = `${avgPerc.toFixed(1)}%`;
  if (totalElem) totalElem.textContent = totalQuizzes;
  if (bestElem) bestElem.textContent = `${bestPerc.toFixed(1)}%`;
}

// ============================================================================
// Manager & Admin Cascading Hierarchy View Logic
// ============================================================================

function initManagerView(authUser, userRole) {
  const users = getQuizUsersList();
  const activeLang = (typeof getCurrentLang === 'function')
    ? getCurrentLang()
    : (localStorage.getItem('pharmaLang') || 'en');

  // DOM filter elements
  const buWrapper = document.getElementById('filter-bu-wrapper');
  const lmWrapper = document.getElementById('filter-lm-wrapper');
  const dmWrapper = document.getElementById('filter-dm-wrapper');
  const buSelect = document.getElementById('quiz-filter-bu');
  const lmSelect = document.getElementById('quiz-filter-lm');
  const dmSelect = document.getElementById('quiz-filter-dm');
  const subtitleElem = document.getElementById('quiz-filter-subtitle');

  // Resolve users by role
  const getRole = (u) => (window.normalizeRole ? window.normalizeRole(u.role) : String(u.role || '').toLowerCase());
  const allBUs = users.filter((u) => getRole(u) === 'business_unit' || getRole(u) === 'bu');
  const allLMs = users.filter((u) => getRole(u) === 'line_manager' || getRole(u) === 'lm');
  const allDMs = users.filter((u) => getRole(u) === 'district_manager' || getRole(u) === 'dm');
  const allReps = users.filter((u) => (typeof window.isRepRole === 'function' ? window.isRepRole(u) : (getRole(u) === 'medical_rep' || getRole(u) === 'rep')));

  // Helper to get localized name
  function getUserName(u) {
    if (!u) return '';
    return u.name || u.nameAr || '';
  }

  const setWrapperVisible = (el, visible) => {
    if (!el) return;
    el.classList.toggle('d-none', !visible);
  };

  // Setup view based on role (strict allowlist - fail closed on unknown roles)
  if (userRole === 'district_manager') {
    // DM only views his direct team
    setWrapperVisible(buWrapper, false);
    setWrapperVisible(lmWrapper, false);
    setWrapperVisible(dmWrapper, false);

    if (subtitleElem && authUser) {
      subtitleElem.textContent = `${quizTranslations[activeLang]?.viewing_team_dm || 'Team:'} ${getUserName(authUser)}`;
    }

    const renderDmTeam = () => {
      const myReps = allReps.filter((r) => r.managerId === authUser.id || r.dmId === authUser.id);
      renderComparisonTable(myReps);
    };
    _refreshQuizComparisonView = renderDmTeam;
    renderDmTeam();

  } else if (userRole === 'line_manager') {
    // LM selects DM to view reps under that DM (including direct-to-LM reps)
    setWrapperVisible(buWrapper, false);
    setWrapperVisible(lmWrapper, false);
    setWrapperVisible(dmWrapper, true);

    const myDMs = allDMs.filter((d) => d.managerId === authUser.id);

    // Populate DM selector
    if (dmSelect) {
      dmSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_dms || 'All DMs'}</option>`;
      myDMs.forEach((dm) => {
        const opt = document.createElement('option');
        opt.value = dm.id;
        opt.textContent = getUserName(dm);
        dmSelect.appendChild(opt);
      });

      const handleLmFilterChange = () => {
        const selectedDmId = dmSelect.value;
        const dmIds = myDMs.map((d) => d.id);
        let repsToShow = [];
        if (selectedDmId === 'all') {
          repsToShow = allReps.filter((r) => dmIds.includes(r.managerId) || dmIds.includes(r.dmId) || r.managerId === authUser.id);
        } else if (dmIds.includes(selectedDmId)) {
          repsToShow = allReps.filter((r) => r.managerId === selectedDmId || r.dmId === selectedDmId);
        }
        renderComparisonTable(repsToShow);
      };

      dmSelect.onchange = handleLmFilterChange;
      _refreshQuizComparisonView = handleLmFilterChange;
      handleLmFilterChange();
    }

  } else if (userRole === 'business_unit') {
    // BU selects LM, then selects DM, then views downstream reps
    setWrapperVisible(buWrapper, false);
    setWrapperVisible(lmWrapper, true);
    setWrapperVisible(dmWrapper, true);

    const myLMs = allLMs.filter((l) => l.managerId === authUser.id);

    if (lmSelect && dmSelect) {
      lmSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_lms || 'All LMs'}</option>`;
      myLMs.forEach((lm) => {
        const opt = document.createElement('option');
        opt.value = lm.id;
        opt.textContent = getUserName(lm);
        lmSelect.appendChild(opt);
      });

      function updateBuDmDropdown() {
        const selectedLmId = lmSelect.value;
        let availableDMs = [];
        if (selectedLmId === 'all') {
          const lmIds = myLMs.map((l) => l.id);
          availableDMs = allDMs.filter((d) => lmIds.includes(d.managerId) || d.managerId === authUser.id);
        } else {
          availableDMs = allDMs.filter((d) => d.managerId === selectedLmId);
        }

        dmSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_dms || 'All DMs'}</option>`;
        availableDMs.forEach((dm) => {
          const opt = document.createElement('option');
          opt.value = dm.id;
          opt.textContent = getUserName(dm);
          dmSelect.appendChild(opt);
        });
      }

      function handleBuFilterChange() {
        const selectedLmId = lmSelect.value;
        const selectedDmId = dmSelect.value;
        const myLmIds = myLMs.map((l) => l.id);

        let activeDMs = [];
        if (selectedLmId === 'all') {
          activeDMs = allDMs.filter((d) => myLmIds.includes(d.managerId) || d.managerId === authUser.id);
        } else if (myLmIds.includes(selectedLmId)) {
          activeDMs = allDMs.filter((d) => d.managerId === selectedLmId);
        }

        const activeDmIds = activeDMs.map((d) => d.id);
        let repsToShow = [];
        if (selectedDmId === 'all') {
          const directLmSet = selectedLmId === 'all'
            ? [authUser.id, ...myLmIds]
            : (myLmIds.includes(selectedLmId) ? [selectedLmId] : []);
          repsToShow = allReps.filter((r) => activeDmIds.includes(r.managerId) || activeDmIds.includes(r.dmId) || directLmSet.includes(r.managerId));
        } else if (activeDmIds.includes(selectedDmId)) {
          repsToShow = allReps.filter((r) => r.managerId === selectedDmId || r.dmId === selectedDmId);
        }

        renderComparisonTable(repsToShow);
      }

      lmSelect.onchange = () => {
        updateBuDmDropdown();
        handleBuFilterChange();
      };

      dmSelect.onchange = handleBuFilterChange;
      _refreshQuizComparisonView = handleBuFilterChange;

      updateBuDmDropdown();
      handleBuFilterChange();
    }

  } else if (userRole === 'product_manager') {
    // PM role: Strictly scoped to ALL their assigned product lines (fail-closed if 0 lines)
    setWrapperVisible(buWrapper, false);
    setWrapperVisible(lmWrapper, true);
    setWrapperVisible(dmWrapper, true);

    const pmLineIds = getPmScopedLineIds(authUser);
    const lineUsers = pmLineIds.length === 0
      ? []
      : users.filter((u) => {
          const uLineIds = getUserLineIdsAny(u.id);
          return uLineIds.some((lid) => pmLineIds.includes(lid));
        });

    const myLMs = lineUsers.filter((u) => getRole(u) === 'line_manager' || getRole(u) === 'lm');
    const myDMs = lineUsers.filter((u) => getRole(u) === 'district_manager' || getRole(u) === 'dm');
    const lineReps = lineUsers.filter((u) => (typeof window.isRepRole === 'function' ? window.isRepRole(u) : (getRole(u) === 'medical_rep' || getRole(u) === 'rep')));

    if (lmSelect && dmSelect) {
      lmSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_lms || 'All LMs'}</option>`;
      myLMs.forEach((lm) => {
        const opt = document.createElement('option');
        opt.value = lm.id;
        opt.textContent = getUserName(lm);
        lmSelect.appendChild(opt);
      });

      const updatePmDmDropdown = () => {
        const selLm = lmSelect.value;
        dmSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_dms || 'All DMs'}</option>`;
        const dmsToShow = selLm === 'all' ? myDMs : myDMs.filter((d) => d.managerId === selLm);
        dmsToShow.forEach((dm) => {
          const opt = document.createElement('option');
          opt.value = dm.id;
          opt.textContent = getUserName(dm);
          dmSelect.appendChild(opt);
        });
      };

      const handlePmFilterChange = () => {
        const selLm = lmSelect.value;
        const selDm = dmSelect.value;
        let repsToShow = lineReps;
        if (selDm !== 'all') {
          repsToShow = repsToShow.filter((r) => r.managerId === selDm || r.dmId === selDm);
        } else if (selLm !== 'all') {
          const dmsUnderLm = myDMs.filter((d) => d.managerId === selLm).map((d) => d.id);
          repsToShow = repsToShow.filter((r) => dmsUnderLm.includes(r.managerId) || r.managerId === selLm);
        }
        renderComparisonTable(repsToShow);
      };

      lmSelect.onchange = () => {
        updatePmDmDropdown();
        handlePmFilterChange();
      };
      dmSelect.onchange = handlePmFilterChange;
      _refreshQuizComparisonView = handlePmFilterChange;

      updatePmDmDropdown();
      handlePmFilterChange();
    }

  } else if (userRole === 'admin' || userRole === 'general_manager') {
    // Admin sees entire company; GM is strictly scoped to reporting subtree via getAllSubordinates
    const isAdminViewer = userRole === 'admin';
    const gmSubs = !isAdminViewer && typeof window.getAllSubordinates === 'function'
      ? window.getAllSubordinates(authUser.id)
      : [];
    const gmSubIdSet = new Set(gmSubs.map((u) => u.id));
    const scopedBUs = isAdminViewer ? allBUs : allBUs.filter((b) => gmSubIdSet.has(b.id));
    const scopedLMs = isAdminViewer ? allLMs : allLMs.filter((l) => gmSubIdSet.has(l.id));
    const scopedDMs = isAdminViewer ? allDMs : allDMs.filter((d) => gmSubIdSet.has(d.id));
    const scopedReps = isAdminViewer ? allReps : allReps.filter((r) => gmSubIdSet.has(r.id));

    setWrapperVisible(buWrapper, isAdminViewer || scopedBUs.length > 0);
    setWrapperVisible(lmWrapper, true);
    setWrapperVisible(dmWrapper, true);

    if (buSelect && lmSelect && dmSelect) {
      // Populate BU selector
      buSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_bus || 'All BUs'}</option>`;
      scopedBUs.forEach((bu) => {
        const opt = document.createElement('option');
        opt.value = bu.id;
        opt.textContent = getUserName(bu);
        buSelect.appendChild(opt);
      });

      function updateAdminLmDropdown() {
        const selectedBuId = buSelect.value;
        let availableLMs = [];
        if (selectedBuId === 'all') {
          availableLMs = scopedLMs;
        } else {
          availableLMs = scopedLMs.filter((l) => l.managerId === selectedBuId);
        }

        lmSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_lms || 'All LMs'}</option>`;
        availableLMs.forEach((lm) => {
          const opt = document.createElement('option');
          opt.value = lm.id;
          opt.textContent = getUserName(lm);
          lmSelect.appendChild(opt);
        });
      }

      function updateAdminDmDropdown() {
        const selectedBuId = buSelect.value;
        const selectedLmId = lmSelect.value;

        let availableDMs = [];
        if (selectedLmId !== 'all') {
          availableDMs = scopedDMs.filter((d) => d.managerId === selectedLmId);
        } else if (selectedBuId !== 'all') {
          const lmIds = scopedLMs.filter((l) => l.managerId === selectedBuId).map((l) => l.id);
          availableDMs = scopedDMs.filter((d) => lmIds.includes(d.managerId) || d.managerId === selectedBuId);
        } else {
          availableDMs = scopedDMs;
        }

        dmSelect.innerHTML = `<option value="all">${quizTranslations[activeLang]?.all_dms || 'All DMs'}</option>`;
        availableDMs.forEach((dm) => {
          const opt = document.createElement('option');
          opt.value = dm.id;
          opt.textContent = getUserName(dm);
          dmSelect.appendChild(opt);
        });
      }

      function handleAdminFilterChange() {
        const selectedBuId = buSelect.value;
        const selectedLmId = lmSelect.value;
        const selectedDmId = dmSelect.value;

        let repsToShow = [];
        if (selectedDmId !== 'all') {
          repsToShow = scopedReps.filter((r) => r.managerId === selectedDmId || r.dmId === selectedDmId);
        } else if (selectedLmId !== 'all') {
          const dmIds = scopedDMs.filter((d) => d.managerId === selectedLmId).map((d) => d.id);
          repsToShow = scopedReps.filter((r) => dmIds.includes(r.managerId) || r.managerId === selectedLmId);
        } else if (selectedBuId !== 'all') {
          const lmIds = scopedLMs.filter((l) => l.managerId === selectedBuId).map((l) => l.id);
          const dmIds = scopedDMs.filter((d) => lmIds.includes(d.managerId) || d.managerId === selectedBuId).map((d) => d.id);
          repsToShow = scopedReps.filter((r) => dmIds.includes(r.managerId) || lmIds.includes(r.managerId) || r.managerId === selectedBuId);
        } else {
          repsToShow = scopedReps;
        }

        renderComparisonTable(repsToShow);
      }

      buSelect.onchange = () => {
        updateAdminLmDropdown();
        updateAdminDmDropdown();
        handleAdminFilterChange();
      };

      lmSelect.onchange = () => {
        updateAdminDmDropdown();
        handleAdminFilterChange();
      };

      dmSelect.onchange = handleAdminFilterChange;
      _refreshQuizComparisonView = handleAdminFilterChange;

      updateAdminLmDropdown();
      updateAdminDmDropdown();
      handleAdminFilterChange();
    }
  } else {
    // Unknown or unauthorized role: fail closed
    setWrapperVisible(buWrapper, false);
    setWrapperVisible(lmWrapper, false);
    setWrapperVisible(dmWrapper, false);
    _refreshQuizComparisonView = () => renderComparisonTable([]);
    renderComparisonTable([]);
  }

  // Setup Admin/PM tools
  if (userRole === 'admin' || userRole === 'product_manager') {
    let repsForTools = allReps;
    if (userRole === 'product_manager') {
      const pmLineIds = getPmScopedLineIds(authUser);
      repsForTools = pmLineIds.length === 0
        ? []
        : allReps.filter((u) => {
            const uLineIds = getUserLineIdsAny(u.id);
            return uLineIds.some((lid) => pmLineIds.includes(lid));
          });
    }
    setupAdminQuizTools(repsForTools);
  }
}

// ============================================================================
// Team Scores Comparison Table Renderer
// ============================================================================

function renderComparisonTable(repsToDisplay) {
  const activeLang = (typeof getCurrentLang === 'function')
    ? getCurrentLang()
    : (localStorage.getItem('pharmaLang') || 'en');
  const allQuizzes = getStoredQuizzes();
  const scores = getStoredScores();

  const currentUser = getAuthenticatedQuizUser();
  const userRole = currentUser
    ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : String(currentUser.role || '').toLowerCase())
    : '';

  let quizzes = allQuizzes;
  if (userRole === 'product_manager') {
    const pmLines = getPmScopedLineIds(currentUser);
    quizzes = allQuizzes.filter((q) => isQuizVisibleForLineIds(q, pmLines));
  } else if (userRole === 'admin') {
    const buVal = document.getElementById('quiz-filter-bu')?.value || 'all';
    const lmVal = document.getElementById('quiz-filter-lm')?.value || 'all';
    const dmVal = document.getElementById('quiz-filter-dm')?.value || 'all';
    if (buVal !== 'all' || lmVal !== 'all' || dmVal !== 'all') {
      const repLineSet = new Set();
      (repsToDisplay || []).forEach((r) => getUserLineIdsAny(r.id).forEach((lid) => repLineSet.add(lid)));
      quizzes = allQuizzes.filter((q) => isQuizVisibleForLineIds(q, [...repLineSet]));
    }
  } else if (currentUser) {
    const teamLineSet = new Set(getUserLineIdsAny(currentUser.id));
    (repsToDisplay || []).forEach((r) => getUserLineIdsAny(r.id).forEach((lid) => teamLineSet.add(lid)));
    quizzes = allQuizzes.filter((q) => isQuizVisibleForLineIds(q, [...teamLineSet]));
  }

  const table = document.getElementById('team-comparison-table');
  const headerRow = document.getElementById('team-comparison-header');
  const tbody = document.getElementById('team-comparison-body');
  const noRepsMsg = document.getElementById('no-reps-message');

  if (!table || !headerRow || !tbody) return;

  // Handle empty reps case
  if (!repsToDisplay || repsToDisplay.length === 0) {
    table.style.display = 'none';
    if (noRepsMsg) noRepsMsg.classList.remove('d-none');
    return;
  }

  table.style.display = 'table';
  if (noRepsMsg) noRepsMsg.classList.add('d-none');

  // Rebuild table header
  headerRow.innerHTML = `<th class="ps-4" data-i18n="quiz_name">${quizTranslations[activeLang]?.quiz_name || 'Quiz Name'}</th>`;
  repsToDisplay.forEach((rep, index) => {
    const th = document.createElement('th');
    th.className = 'text-nowrap';
    if (index === repsToDisplay.length - 1) th.classList.add('pe-4');
    th.textContent = rep.name || rep.nameAr || '';
    headerRow.appendChild(th);
  });

  // Rebuild table body
  tbody.replaceChildren();
  const sortedQuizzes = [...quizzes].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  if (sortedQuizzes.length === 0) {
    const emptyTr = document.createElement('tr');
    emptyTr.innerHTML = `<td colspan="${repsToDisplay.length + 1}" class="text-center text-muted py-4 fst-italic">No quizzes created yet.</td>`;
    tbody.appendChild(emptyTr);
    return;
  }

  sortedQuizzes.forEach((quiz) => {
    const tr = document.createElement('tr');
    const safeTotalMarks = Number(quiz.totalMarks) > 0 ? Number(quiz.totalMarks) : 50;

    // Quiz title & meta column
    const tdTitle = document.createElement('td');
    tdTitle.className = 'fw-medium ps-4 text-nowrap';
    tdTitle.innerHTML = `
      <div>${window.escapeHtml(quiz.title || "")}</div>
      <div class="quiz-meta-sub">${window.escapeHtml(quiz.date || "—")} &bull; ${safeTotalMarks} M</div>
    `;
    tr.appendChild(tdTitle);

    // Columns for each rep
    repsToDisplay.forEach((rep, index) => {
      const td = document.createElement('td');
      if (index === repsToDisplay.length - 1) td.classList.add('pe-4');

      const scoreObj = scores.find((s) => s.quizId === quiz.id && s.userId === rep.id);
      if (scoreObj) {
        const numericScore = Number(scoreObj.score) || 0;
        const perc = safeTotalMarks > 0 ? (numericScore / safeTotalMarks) * 100 : 0;
        td.innerHTML = `
          <div class="d-flex align-items-center gap-2">
            <span class="fw-bold">${window.escapeHtml(scoreObj.score)}</span><span class="text-secondary small">/${safeTotalMarks}</span>
            ${getGradeBadge(perc)}
          </div>
        `;
      } else {
        td.innerHTML = '<span class="text-muted fst-italic">-</span>';
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// ============================================================================
// Admin Score Entry and Quiz Creation Handlers
// ============================================================================

function setupAdminQuizTools(allReps) {
  _currentQuizToolsReps = Array.isArray(allReps) ? allReps : [];
  const activeLang = (typeof getCurrentLang === 'function')
    ? getCurrentLang()
    : (localStorage.getItem('pharmaLang') || 'en');
  const quizSelect = document.getElementById('score-quiz-select');
  const container = document.getElementById('enter-scores-table-container');
  const tbody = document.getElementById('enter-scores-body');
  const saveBtn = document.getElementById('save-scores-btn');
  const createForm = document.getElementById('create-quiz-form');

  // Populate quiz selector (scoped for PM to global + their own lines)
  function refreshQuizSelect() {
    if (!quizSelect) return;
    const langNow = (typeof getCurrentLang === 'function') ? getCurrentLang() : activeLang;
    const currentUser = getAuthenticatedQuizUser();
    const role = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : String(currentUser.role || '').toLowerCase()) : null;
    let quizzes = getStoredQuizzes();
    if (role === 'product_manager') {
      const pmLines = getPmScopedLineIds(currentUser);
      quizzes = quizzes.filter((q) => isQuizVisibleForLineIds(q, pmLines));
    }
    quizSelect.innerHTML = `<option value="" data-i18n="choose_quiz">${quizTranslations[langNow]?.choose_quiz || 'Choose a quiz...'}</option>`;
    quizzes.forEach((quiz) => {
      const opt = document.createElement('option');
      opt.value = quiz.id;
      opt.textContent = `${quiz.title} (${quiz.date || '—'}) - ${quiz.totalMarks} Marks`;
      opt.dataset.marks = quiz.totalMarks;
      quizSelect.appendChild(opt);
    });
  }

  refreshQuizSelect();

  // Handle quiz selection for entering scores (bind once)
  if (quizSelect && container && tbody) {
    if (!quizSelect.dataset) quizSelect.dataset = {};
    if (!quizSelect.dataset.quizBound) {
      quizSelect.dataset.quizBound = 'true';
      quizSelect.addEventListener('change', (e) => {
        tbody.replaceChildren();
        const selectedQuizId = e.target.value;

        if (!selectedQuizId) {
          container.classList.add('d-none');
          return;
        }

        const quizzes = getStoredQuizzes();
        const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
        if (!currentQuiz) {
          if (container) container.classList.add('d-none');
          if (typeof showToast === 'function') showToast("Quiz not found.", "error");
          return;
        }
        const rawMarks = Number(currentQuiz.totalMarks);
        const totalMarks = rawMarks > 0 ? rawMarks : 50;
        const quizLines = getQuizLineIds(currentQuiz);
        const scores = getStoredScores();

        container.classList.remove('d-none');

        const eligibleReps = quizLines.length > 0
          ? _currentQuizToolsReps.filter((rep) => getUserLineIdsAny(rep.id).some((lid) => quizLines.includes(lid)))
          : _currentQuizToolsReps;

        eligibleReps.forEach((rep) => {
          const repName = rep.name || rep.nameAr || '';
          const existingScore = scores.find((s) => s.quizId === selectedQuizId && s.userId === rep.id);
          const val = existingScore ? existingScore.score : '';

          const safeRepName = window.escapeHtml(repName);
          const safeRawName = window.escapeHtml(rep.name || '');
          const safeRepId = window.escapeHtml(rep.id);

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="fw-medium ps-3">${safeRepName}</td>
            <td class="pe-3">
              <div class="input-group" style="max-width: 170px;">
                <input type="number" class="form-control score-input" data-rep-id="${safeRepId}" data-rep-name="${safeRawName}" min="0" max="${totalMarks}" value="${window.escapeHtml(val)}" style="border-radius: 10px 0 0 10px;">
                <span class="input-group-text quiz-input-addon" style="border-radius: 0 10px 10px 0;">/ ${totalMarks}</span>
              </div>
            </td>
          `;
          tbody.appendChild(tr);
        });
      });
    }
  }

  // Save scores button (bind once, enforce Admin / PM line-scoped authorization)
  if (saveBtn) {
    if (!saveBtn.dataset) saveBtn.dataset = {};
    if (!saveBtn.dataset.quizBound) {
      saveBtn.dataset.quizBound = 'true';
      saveBtn.addEventListener('click', () => {
        const currentUser = getAuthenticatedQuizUser();
        const role = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : String(currentUser.role || '').toLowerCase()) : null;
        if (role !== 'admin' && role !== 'product_manager') {
          if (typeof showToast === 'function') {
            showToast("Permission Denied: Admins or Product Managers only.", "error");
          }
          return;
        }

        const selectedQuizId = quizSelect ? quizSelect.value : null;
        if (!selectedQuizId) return;

        const quizzes = getStoredQuizzes();
        const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
        if (!currentQuiz) {
          if (container) container.classList.add('d-none');
          if (typeof showToast === 'function') showToast("Quiz not found.", "error");
          return;
        }
        const rawMarks = Number(currentQuiz.totalMarks);
        const totalMarks = rawMarks > 0 ? rawMarks : 50;
        const quizLines = getQuizLineIds(currentQuiz);

        // For Product Manager, enforce strict line scoping on both the quiz and the reps being scored
        let allowedPmRepIds = null;
        if (role === 'product_manager') {
          const pmLineIds = getPmScopedLineIds(currentUser);
          if (!isQuizVisibleForLineIds(currentQuiz, pmLineIds)) {
            if (typeof showToast === 'function') showToast("Permission Denied: You cannot modify scores for another line's quiz.", "error");
            return;
          }
          const allUsers = getQuizUsersList();
          allowedPmRepIds = new Set(
            pmLineIds.length === 0
              ? []
              : allUsers
                  .filter((u) => {
                    const uLineIds = getUserLineIdsAny(u.id);
                    return uLineIds.some((lid) => pmLineIds.includes(lid));
                  })
                  .map((u) => u.id)
          );
        }

        let storedScores = getStoredScores();
        const inputs = tbody ? tbody.querySelectorAll('.score-input') : [];

        inputs.forEach((input) => {
          const valStr = input.value.trim();
          const repId = input.dataset.repId;
          if (!repId) return;
          if (allowedPmRepIds !== null && !allowedPmRepIds.has(repId)) return;
          if (quizLines.length > 0 && !getUserLineIdsAny(repId).some((lid) => quizLines.includes(lid))) return;
          const repName = resolveQuizUserName(repId, input.dataset.repName || '');

          if (valStr !== '') {
            const parsed = parseFloat(valStr);
            if (isNaN(parsed)) return;
            const numVal = Math.min(Math.max(0, parsed), totalMarks);
            const existingIdx = storedScores.findIndex((s) => s.quizId === selectedQuizId && s.userId === repId);

            if (existingIdx >= 0) {
              storedScores[existingIdx].score = numVal;
              storedScores[existingIdx].totalMarks = totalMarks;
            } else {
              storedScores.push({
                quizId: selectedQuizId,
                userId: repId,
                userName: repName,
                score: numVal,
                totalMarks: totalMarks
              });
            }
          } else {
            storedScores = storedScores.filter((s) => !(s.quizId === selectedQuizId && s.userId === repId));
          }
        });

        saveStoredScores(storedScores);

        const langNow = (typeof getCurrentLang === 'function') ? getCurrentLang() : currentLang;
        if (typeof showToast === 'function') {
          showToast(quizTranslations[langNow]?.alert_scores_saved || 'Scores saved successfully!', 'success');
        }

        if (quizSelect) quizSelect.value = '';
        if (container) container.classList.add('d-none');

        if (typeof _refreshQuizComparisonView === 'function') {
          _refreshQuizComparisonView();
        } else {
          const dmSelect = document.getElementById('quiz-filter-dm');
          if (dmSelect) dmSelect.dispatchEvent(new Event('change'));
        }
      });
    }
  }

  // Create quiz modal form (bind once, allow Admin & Product Manager)
  if (createForm) {
    if (!createForm.dataset) createForm.dataset = {};
    if (!createForm.dataset.quizBound) {
      createForm.dataset.quizBound = 'true';
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = getAuthenticatedQuizUser();
        const role = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : String(currentUser.role || '').toLowerCase()) : null;
        if (role !== 'admin' && role !== 'product_manager') {
          if (typeof showToast === 'function') {
            showToast("Permission Denied: Admins or Product Managers only.", "error");
          }
          return;
        }

        const titleInput = document.getElementById('new-quiz-title');
        const dateInput = document.getElementById('new-quiz-date');
        const marksInput = document.getElementById('new-quiz-marks');

        const title = titleInput ? titleInput.value.trim() : '';
        if (!title) {
          if (typeof showToast === 'function') showToast("Please enter quiz title.", "warning");
          return;
        }

        const todayFallback = (window.getSystemTodayStr && window.getSystemTodayStr()) || (() => {
          const _n = (window.getSystemDate && window.getSystemDate()) ? new Date(window.getSystemDate().getTime()) : new Date();
          return `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, "0")}-${String(_n.getDate()).padStart(2, "0")}`;
        })();
        const date = (dateInput && dateInput.value) ? dateInput.value : todayFallback;

        const rawMarksStr = marksInput ? String(marksInput.value || '').trim() : '';
        let marks = 50;
        if (rawMarksStr !== '') {
          const parsedMarks = parseInt(rawMarksStr, 10);
          if (isNaN(parsedMarks) || parsedMarks < 1) {
            if (typeof showToast === 'function') showToast("Total marks must be a positive number (at least 1).", "warning");
            return;
          }
          marks = parsedMarks;
        }

        let scopedLineId = null;
        let scopedLineIds = [];
        if (role === 'product_manager') {
          scopedLineIds = getPmScopedLineIds(currentUser);
          if (scopedLineIds.length === 0) {
            if (typeof showToast === 'function') showToast("Permission Denied: No product line assigned to your account.", "error");
            return;
          }
          scopedLineId = scopedLineIds[0];
        }

        const newQuizId = typeof window.genId === 'function'
          ? window.genId('q_')
          : ('q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));

        const newQuiz = {
          id: newQuizId,
          title: title,
          date: date,
          totalMarks: marks,
          lineId: scopedLineId,
          lineIds: scopedLineIds,
          createdBy: currentUser.id
        };

        const quizzes = getStoredQuizzes();
        quizzes.unshift(newQuiz);
        saveStoredQuizzes(quizzes);

        refreshQuizSelect();

        const modalEl = document.getElementById('createQuizModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
          const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          if (modal) modal.hide();
        }

        createForm.reset();

        const langNow = (typeof getCurrentLang === 'function') ? getCurrentLang() : currentLang;
        if (typeof showToast === 'function') {
          showToast(quizTranslations[langNow]?.alert_quiz_created || 'Quiz created successfully!', 'success');
        }

        if (typeof _refreshQuizComparisonView === 'function') {
          _refreshQuizComparisonView();
        } else {
          const dmSelect = document.getElementById('quiz-filter-dm');
          if (dmSelect) dmSelect.dispatchEvent(new Event('change'));
        }
      });
    }
  }
}

// Dynamic language change listener
document.addEventListener("languageChanged", (e) => {
  currentLang = (e && e.detail && e.detail.lang) || (window.getCurrentLang && window.getCurrentLang()) || 'en';
  if (typeof applyTranslations === 'function') {
    applyTranslations(currentLang);
  }
  const authUser = getAuthenticatedQuizUser();
  if (!authUser) return;
  const userRole = (typeof normalizeRole === 'function') ? normalizeRole(authUser.role) : String(authUser.role || '').toLowerCase();
  const isRep = (typeof window.isRepRole === 'function') ? window.isRepRole(authUser) : (userRole === 'medical_rep' || userRole === 'rep');
  if (isRep) {
    initRepView(authUser.id);
  } else {
    initManagerView(authUser, userRole);
  }
});

// Sync handler: re-render automatically when Firestore finishes syncing data
document.addEventListener("pharma:storage:synced", () => {
  const authUser = getAuthenticatedQuizUser();
  if (!authUser) return;
  const userRole = (typeof normalizeRole === 'function') ? normalizeRole(authUser.role) : String(authUser.role || '').toLowerCase();
  const isRep = (typeof window.isRepRole === 'function') ? window.isRepRole(authUser) : (userRole === 'medical_rep' || userRole === 'rep');
  if (isRep) {
    initRepView(authUser.id);
    return;
  }
  const buSel = document.getElementById('quiz-filter-bu');
  const lmSel = document.getElementById('quiz-filter-lm');
  const dmSel = document.getElementById('quiz-filter-dm');
  const prevBu = buSel ? buSel.value : 'all';
  const prevLm = lmSel ? lmSel.value : 'all';
  const prevDm = dmSel ? dmSel.value : 'all';

  initManagerView(authUser, userRole);

  // Restore user filter selections if still present in synced options
  const restoreIfExists = (sel, val) => {
    if (sel && val && val !== 'all' && Array.from(sel.options || []).some((o) => o.value === val)) {
      sel.value = val;
      return true;
    }
    return false;
  };
  let restored = false;
  if (restoreIfExists(buSel, prevBu)) restored = true;
  if (restoreIfExists(lmSel, prevLm)) restored = true;
  if (restoreIfExists(dmSel, prevDm)) restored = true;
  if (restored && typeof _refreshQuizComparisonView === 'function') {
    _refreshQuizComparisonView();
  }
});

if (typeof window !== "undefined") {
  window.initRepView = initRepView;
  window.initManagerView = initManagerView;
  window.renderComparisonTable = renderComparisonTable;
  window.getStoredQuizzes = getStoredQuizzes;
  window.getStoredScores = getStoredScores;
}