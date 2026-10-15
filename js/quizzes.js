/**
 * @file quizzes.js
 * @description Role-based quiz score management and cascading hierarchy filters
 * Supports Admin-only score uploading/quiz creation, and cascading hierarchy reporting for BU, LM, and DM.
 */

// Default seed quizzes
const demoQuizzes = [
  { id: 'q1', title: 'Product Knowledge Q3', date: '2026-08-15', totalMarks: 50, createdBy: 'u1790626000010' },
  { id: 'q2', title: 'Q2 Assessment', date: '2026-07-01', totalMarks: 50, createdBy: 'u1790626000010' },
  { id: 'q3', title: 'New Launch Quiz', date: '2026-06-10', totalMarks: 30, createdBy: 'u1790626000010' },
  { id: 'q4', title: 'Compliance Training', date: '2026-05-20', totalMarks: 40, createdBy: 'u1790626000010' },
  { id: 'q5', title: 'Sales Techniques', date: '2026-04-15', totalMarks: 50, createdBy: 'u1790626000010' }
];

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

// Default seed scores across team members in different lines/districts
const demoScores = [
  // Rep 1 (DM: Amir Ayoup, LM: John Mahfouz, BU: George Marzok)
  { quizId: 'q1', userId: 'u1790626000001', userName: resolveQuizUserName('u1790626000001', 'Marco Magdy'), score: 42, totalMarks: 50 },
  { quizId: 'q2', userId: 'u1790626000001', userName: resolveQuizUserName('u1790626000001', 'Marco Magdy'), score: 35, totalMarks: 50 },
  { quizId: 'q3', userId: 'u1790626000001', userName: resolveQuizUserName('u1790626000001', 'Marco Magdy'), score: 28, totalMarks: 30 },
  { quizId: 'q4', userId: 'u1790626000001', userName: resolveQuizUserName('u1790626000001', 'Marco Magdy'), score: 32, totalMarks: 40 },
  { quizId: 'q5', userId: 'u1790626000001', userName: resolveQuizUserName('u1790626000001', 'Marco Magdy'), score: 41, totalMarks: 50 },

  // Rep 2 (DM: Amir Ayoup, LM: John Mahfouz, BU: George Marzok)
  { quizId: 'q1', userId: 'u1790626000002', userName: resolveQuizUserName('u1790626000002', 'Kerolos Boules'), score: 38, totalMarks: 50 },
  { quizId: 'q2', userId: 'u1790626000002', userName: resolveQuizUserName('u1790626000002', 'Kerolos Boules'), score: 30, totalMarks: 50 },
  { quizId: 'q3', userId: 'u1790626000002', userName: resolveQuizUserName('u1790626000002', 'Kerolos Boules'), score: 25, totalMarks: 30 },
  { quizId: 'q4', userId: 'u1790626000002', userName: resolveQuizUserName('u1790626000002', 'Kerolos Boules'), score: 36, totalMarks: 40 },
  { quizId: 'q5', userId: 'u1790626000002', userName: resolveQuizUserName('u1790626000002', 'Kerolos Boules'), score: 44, totalMarks: 50 },

  // Rep 3 (DM: Jonathan Erian, LM: John Mahfouz, BU: George Marzok)
  { quizId: 'q1', userId: 'u1790626000003', userName: resolveQuizUserName('u1790626000003', 'Mina Mikhael'), score: 45, totalMarks: 50 },
  { quizId: 'q2', userId: 'u1790626000003', userName: resolveQuizUserName('u1790626000003', 'Mina Mikhael'), score: 40, totalMarks: 50 },
  { quizId: 'q3', userId: 'u1790626000003', userName: resolveQuizUserName('u1790626000003', 'Mina Mikhael'), score: 29, totalMarks: 30 },
  { quizId: 'q4', userId: 'u1790626000003', userName: resolveQuizUserName('u1790626000003', 'Mina Mikhael'), score: 38, totalMarks: 40 },
  { quizId: 'q5', userId: 'u1790626000003', userName: resolveQuizUserName('u1790626000003', 'Mina Mikhael'), score: 48, totalMarks: 50 },

  // Rep 4 (DM: Marian Magdy, LM: Mario Magdy, BU: George Marzok)
  { quizId: 'q1', userId: 'u1790626000004', userName: resolveQuizUserName('u1790626000004', 'David Emad'), score: 40, totalMarks: 50 },
  { quizId: 'q2', userId: 'u1790626000004', userName: resolveQuizUserName('u1790626000004', 'David Emad'), score: 38, totalMarks: 50 },
  { quizId: 'q3', userId: 'u1790626000004', userName: resolveQuizUserName('u1790626000004', 'David Emad'), score: 27, totalMarks: 30 },
  { quizId: 'q4', userId: 'u1790626000004', userName: resolveQuizUserName('u1790626000004', 'David Emad'), score: 34, totalMarks: 40 },
  { quizId: 'q5', userId: 'u1790626000004', userName: resolveQuizUserName('u1790626000004', 'David Emad'), score: 42, totalMarks: 50 }
];

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

  // Resolve current authenticated user
  const authUser = (typeof checkAuth === 'function') ? checkAuth() : null;
  const rawRole = (authUser && authUser.role) ? authUser.role : (localStorage.getItem('userRole') || 'medical_rep');
  const userRole = (typeof normalizeRole === 'function') ? normalizeRole(rawRole) : rawRole;
  const userId = (authUser && authUser.id) ? authUser.id : (localStorage.getItem('userId') || 'u1790626000001');

  const isRep = (userRole === 'medical_rep' || userRole === 'rep');
  const isAdminUser = (userRole === 'admin' || userRole === 'product_manager');

  // Display appropriate UI view
  if (isRep) {
    document.querySelectorAll('.rep-view').forEach((el) => { el.style.display = 'block'; });
    document.querySelectorAll('.admin-view').forEach((el) => { el.style.display = 'none'; });
    initRepView(userId);
  } else {
    document.querySelectorAll('.rep-view').forEach((el) => { el.style.display = 'none'; });
    document.querySelectorAll('.admin-view').forEach((el) => { el.style.display = 'block'; });

    // Permission control: Only Admin can create quizzes or enter scores
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
  const userScores = allScores.filter((s) => s.userId === userId);

  const totalQuizzes = userScores.length;
  let totalPerc = 0;
  let bestPerc = 0;

  const tbody = document.getElementById('quiz-history-body');
  if (!tbody) return;
  tbody.replaceChildren();

  const sortedScores = userScores.map((score) => {
    const quiz = allQuizzes.find((q) => q.id === score.quizId);
    return {
      ...score,
      quizTitle: quiz ? quiz.title : 'Unknown Quiz',
      date: quiz ? quiz.date : '2026-01-01',
      totalMarks: (quiz && quiz.totalMarks) ? quiz.totalMarks : (score.totalMarks || 50)
    };
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedScores.forEach((score) => {
    const perc = (score.score / score.totalMarks) * 100;
    totalPerc += perc;
    if (perc > bestPerc) bestPerc = perc;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-medium ps-3 col-quiz-name">${typeof window.escapeHtml === 'function' ? window.escapeHtml(score.quizTitle) : (score.quizTitle || '')}</td>
      <td class="text-secondary text-center col-quiz-date">${score.date}</td>
      <td class="fw-bold text-center col-quiz-score">${score.score}</td>
      <td class="text-secondary text-center col-quiz-total">${score.totalMarks}</td>
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
  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const currentLang = (typeof getCurrentLang === 'function')
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
  const getRole = (u) => (window.normalizeRole ? window.normalizeRole(u.role) : (u.role || '').toLowerCase());
  const allBUs = users.filter((u) => getRole(u) === 'business_unit' || getRole(u) === 'bu');
  const allLMs = users.filter((u) => getRole(u) === 'line_manager' || getRole(u) === 'lm');
  const allDMs = users.filter((u) => getRole(u) === 'district_manager' || getRole(u) === 'dm');
  const allReps = users.filter((u) => getRole(u) === 'medical_rep' || getRole(u) === 'rep');

  // Helper to get localized name
  function getUserName(u) {
    if (!u) return '';
    return currentLang === 'ar' ? (u.nameAr || u.name) : u.name;
  }

  // Setup view based on role
  if (userRole === 'district_manager') {
    // DM only views his direct team
    if (buWrapper) buWrapper.style.display = 'none';
    if (lmWrapper) lmWrapper.style.display = 'none';
    if (dmWrapper) dmWrapper.style.display = 'none';

    if (subtitleElem && authUser) {
      subtitleElem.textContent = `${quizTranslations[currentLang].viewing_team_dm || 'Team:'} ${getUserName(authUser)}`;
    }

    const myReps = allReps.filter((r) => r.managerId === authUser.id);
    renderComparisonTable(myReps);

  } else if (userRole === 'line_manager') {
    // LM selects DM to view reps under that DM
    if (buWrapper) buWrapper.style.display = 'none';
    if (lmWrapper) lmWrapper.style.display = 'none';
    if (dmWrapper) dmWrapper.style.display = 'flex';

    const myDMs = allDMs.filter((d) => d.managerId === authUser.id);

    // Populate DM selector
    if (dmSelect) {
      dmSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_dms || 'All DMs'}</option>`;
      myDMs.forEach((dm) => {
        const opt = document.createElement('option');
        opt.value = dm.id;
        opt.textContent = getUserName(dm);
        dmSelect.appendChild(opt);
      });

      const handleLmFilterChange = () => {
        const selectedDmId = dmSelect.value;
        let repsToShow = [];
        if (selectedDmId === 'all') {
          const dmIds = myDMs.map((d) => d.id);
          repsToShow = allReps.filter((r) => dmIds.includes(r.managerId));
        } else {
          repsToShow = allReps.filter((r) => r.managerId === selectedDmId);
        }
        renderComparisonTable(repsToShow);
      };

      dmSelect.onchange = handleLmFilterChange;
      handleLmFilterChange();
    }

  } else if (userRole === 'business_unit') {
    // BU selects LM, then selects DM, then views reps under that DM
    if (buWrapper) buWrapper.style.display = 'none';
    if (lmWrapper) lmWrapper.style.display = 'flex';
    if (dmWrapper) dmWrapper.style.display = 'flex';

    const myLMs = allLMs.filter((l) => l.managerId === authUser.id);

    // Populate LM selector
    if (lmSelect && dmSelect) {
      lmSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_lms || 'All LMs'}</option>`;
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
          availableDMs = allDMs.filter((d) => lmIds.includes(d.managerId));
        } else {
          availableDMs = allDMs.filter((d) => d.managerId === selectedLmId);
        }

        dmSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_dms || 'All DMs'}</option>`;
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

        let activeDMs = [];
        if (selectedLmId === 'all') {
          const lmIds = myLMs.map((l) => l.id);
          activeDMs = allDMs.filter((d) => lmIds.includes(d.managerId));
        } else {
          activeDMs = allDMs.filter((d) => d.managerId === selectedLmId);
        }

        let repsToShow = [];
        if (selectedDmId === 'all') {
          const activeDmIds = activeDMs.map((d) => d.id);
          repsToShow = allReps.filter((r) => activeDmIds.includes(r.managerId));
        } else {
          repsToShow = allReps.filter((r) => r.managerId === selectedDmId);
        }

        renderComparisonTable(repsToShow);
      }

      lmSelect.onchange = () => {
        updateBuDmDropdown();
        handleBuFilterChange();
      };

      dmSelect.onchange = handleBuFilterChange;

      updateBuDmDropdown();
      handleBuFilterChange();
    }

  } else if (userRole === 'product_manager') {
    // PM role: Scoped to their Line team (LMs, DMs, Reps)
    if (buWrapper) buWrapper.style.display = 'none';
    if (lmWrapper) lmWrapper.style.display = 'flex';
    if (dmWrapper) dmWrapper.style.display = 'flex';

    const pmLineId = authUser?.lineId || (authUser?.lineIds && authUser?.lineIds[0]);
    const lineUsers = users.filter((u) => {
      const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
      return pmLineId ? uLineIds.includes(pmLineId) : true;
    });

    const myLMs = lineUsers.filter((u) => getRole(u) === 'line_manager' || getRole(u) === 'lm');
    const myDMs = lineUsers.filter((u) => getRole(u) === 'district_manager' || getRole(u) === 'dm');
    const lineReps = lineUsers.filter((u) => getRole(u) === 'medical_rep' || getRole(u) === 'rep');

    if (lmSelect && dmSelect) {
      lmSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_lms || 'All LMs'}</option>`;
      myLMs.forEach((lm) => {
        const opt = document.createElement('option');
        opt.value = lm.id;
        opt.textContent = getUserName(lm);
        lmSelect.appendChild(opt);
      });

      const updatePmDmDropdown = () => {
        const selLm = lmSelect.value;
        dmSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_dms || 'All DMs'}</option>`;
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
          repsToShow = repsToShow.filter((r) => r.managerId === selDm);
        } else if (selLm !== 'all') {
          const dmsUnderLm = myDMs.filter((d) => d.managerId === selLm).map((d) => d.id);
          repsToShow = repsToShow.filter((r) => dmsUnderLm.includes(r.managerId));
        }
        renderComparisonTable(repsToShow);
      };

      lmSelect.onchange = () => {
        updatePmDmDropdown();
        handlePmFilterChange();
      };
      dmSelect.onchange = handlePmFilterChange;

      updatePmDmDropdown();
      handlePmFilterChange();
    }

  } else {
    // Admin role: Full cascading hierarchy access (BU -> LM -> DM -> Reps)
    if (buWrapper) buWrapper.style.display = 'flex';
    if (lmWrapper) lmWrapper.style.display = 'flex';
    if (dmWrapper) dmWrapper.style.display = 'flex';

    if (buSelect && lmSelect && dmSelect) {
      // Populate BU selector
      buSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_bus || 'All BUs'}</option>`;
      allBUs.forEach((bu) => {
        const opt = document.createElement('option');
        opt.value = bu.id;
        opt.textContent = getUserName(bu);
        buSelect.appendChild(opt);
      });

      function updateAdminLmDropdown() {
        const selectedBuId = buSelect.value;
        let availableLMs = [];
        if (selectedBuId === 'all') {
          availableLMs = allLMs;
        } else {
          availableLMs = allLMs.filter((l) => l.managerId === selectedBuId);
        }

        lmSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_lms || 'All LMs'}</option>`;
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
          availableDMs = allDMs.filter((d) => d.managerId === selectedLmId);
        } else if (selectedBuId !== 'all') {
          const lmIds = allLMs.filter((l) => l.managerId === selectedBuId).map((l) => l.id);
          availableDMs = allDMs.filter((d) => lmIds.includes(d.managerId));
        } else {
          availableDMs = allDMs;
        }

        dmSelect.innerHTML = `<option value="all">${quizTranslations[currentLang].all_dms || 'All DMs'}</option>`;
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
          repsToShow = allReps.filter((r) => r.managerId === selectedDmId);
        } else if (selectedLmId !== 'all') {
          const dmIds = allDMs.filter((d) => d.managerId === selectedLmId).map((d) => d.id);
          repsToShow = allReps.filter((r) => dmIds.includes(r.managerId));
        } else if (selectedBuId !== 'all') {
          const lmIds = allLMs.filter((l) => l.managerId === selectedBuId).map((l) => l.id);
          const dmIds = allDMs.filter((d) => lmIds.includes(d.managerId)).map((d) => d.id);
          repsToShow = allReps.filter((r) => dmIds.includes(r.managerId));
        } else {
          repsToShow = allReps;
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

      updateAdminLmDropdown();
      updateAdminDmDropdown();
      handleAdminFilterChange();
    }
  }

  // Setup Admin/PM tools
  if (userRole === 'admin' || userRole === 'product_manager') {
    const repsForTools = userRole === 'product_manager'
      ? users.filter((u) => {
          const isRep = getRole(u) === 'medical_rep' || getRole(u) === 'rep';
          if (!isRep) return false;
          const pmLineId = authUser?.lineId || (authUser?.lineIds && authUser?.lineIds[0]);
          const uLineIds = u.lineIds || (u.lineId ? [u.lineId] : []);
          return pmLineId ? uLineIds.includes(pmLineId) : true;
        })
      : allReps;
    setupAdminQuizTools(repsForTools);
  }
}

// ============================================================================
// Team Scores Comparison Table Renderer
// ============================================================================

function renderComparisonTable(repsToDisplay) {
  const currentLang = (typeof getCurrentLang === 'function')
    ? getCurrentLang()
    : (localStorage.getItem('pharmaLang') || 'en');
  const quizzes = getStoredQuizzes();
  const scores = getStoredScores();

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
  headerRow.innerHTML = `<th class="ps-4" data-i18n="quiz_name">${quizTranslations[currentLang].quiz_name || 'Quiz Name'}</th>`;
  repsToDisplay.forEach((rep, index) => {
    const th = document.createElement('th');
    th.className = 'text-nowrap';
    if (index === repsToDisplay.length - 1) th.classList.add('pe-4');
    th.textContent = currentLang === 'ar' ? (rep.nameAr || rep.name) : rep.name;
    headerRow.appendChild(th);
  });

  // Rebuild table body
  tbody.replaceChildren();
  const sortedQuizzes = [...quizzes].sort((a, b) => new Date(b.date) - new Date(a.date));

  sortedQuizzes.forEach((quiz) => {
    const tr = document.createElement('tr');

    // Quiz title & meta column
    const tdTitle = document.createElement('td');
    tdTitle.className = 'fw-medium ps-4 text-nowrap';
    tdTitle.innerHTML = `
      <div>${typeof window.escapeHtml === 'function' ? window.escapeHtml(quiz.title) : (quiz.title || '')}</div>
      <div class="quiz-meta-sub">${quiz.date} &bull; ${quiz.totalMarks} M</div>
    `;
    tr.appendChild(tdTitle);

    // Columns for each rep
    repsToDisplay.forEach((rep, index) => {
      const td = document.createElement('td');
      if (index === repsToDisplay.length - 1) td.classList.add('pe-4');

      const scoreObj = scores.find((s) => s.quizId === quiz.id && s.userId === rep.id);
      if (scoreObj) {
        const perc = (scoreObj.score / quiz.totalMarks) * 100;
        td.innerHTML = `
          <div class="d-flex align-items-center gap-2">
            <span class="fw-bold">${scoreObj.score}</span><span class="text-secondary small">/${quiz.totalMarks}</span>
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
  const currentLang = (typeof getCurrentLang === 'function')
    ? getCurrentLang()
    : (localStorage.getItem('pharmaLang') || 'en');
  const quizSelect = document.getElementById('score-quiz-select');
  const container = document.getElementById('enter-scores-table-container');
  const tbody = document.getElementById('enter-scores-body');
  const saveBtn = document.getElementById('save-scores-btn');
  const createForm = document.getElementById('create-quiz-form');

  // Populate quiz selector
  function refreshQuizSelect() {
    if (!quizSelect) return;
    const quizzes = getStoredQuizzes();
    quizSelect.innerHTML = `<option value="" data-i18n="choose_quiz">${quizTranslations[currentLang].choose_quiz || 'Choose a quiz...'}</option>`;
    quizzes.forEach((quiz) => {
      const opt = document.createElement('option');
      opt.value = quiz.id;
      opt.textContent = `${quiz.title} (${quiz.date}) - ${quiz.totalMarks} Marks`;
      opt.dataset.marks = quiz.totalMarks;
      quizSelect.appendChild(opt);
    });
  }

  refreshQuizSelect();

  // Handle quiz selection for entering scores
  if (quizSelect && container && tbody) {
    quizSelect.addEventListener('change', (e) => {
      tbody.replaceChildren();
      const selectedQuizId = e.target.value;

      if (!selectedQuizId) {
        container.classList.add('d-none');
        return;
      }

      const quizzes = getStoredQuizzes();
      const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
      const totalMarks = currentQuiz ? currentQuiz.totalMarks : 50;
      const scores = getStoredScores();

      container.classList.remove('d-none');

      allReps.forEach((rep) => {
        const repName = currentLang === 'ar' ? (rep.nameAr || rep.name) : rep.name;
        const existingScore = scores.find((s) => s.quizId === selectedQuizId && s.userId === rep.id);
        const val = existingScore ? existingScore.score : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="fw-medium ps-3">${repName}</td>
          <td class="pe-3">
            <div class="input-group" style="max-width: 170px;">
              <input type="number" class="form-control score-input" data-rep-id="${rep.id}" data-rep-name="${rep.name}" min="0" max="${totalMarks}" value="${val}" style="border-radius: 10px 0 0 10px;">
              <span class="input-group-text quiz-input-addon" style="border-radius: 0 10px 10px 0;">/ ${totalMarks}</span>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  // Save scores button
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const selectedQuizId = quizSelect ? quizSelect.value : null;
      if (!selectedQuizId) return;

      const quizzes = getStoredQuizzes();
      const currentQuiz = quizzes.find((q) => q.id === selectedQuizId);
      const totalMarks = currentQuiz ? currentQuiz.totalMarks : 50;

      let storedScores = getStoredScores();
      const inputs = tbody ? tbody.querySelectorAll('.score-input') : [];

      inputs.forEach((input) => {
        const valStr = input.value.trim();
        const repId = input.dataset.repId;
        const repName = input.dataset.repName;

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

      if (typeof showToast === 'function') {
        showToast(quizTranslations[currentLang].alert_scores_saved || 'Scores saved successfully!', 'success');
      }

      if (quizSelect) quizSelect.value = '';
      if (container) container.classList.add('d-none');

      // Re-trigger active filter rendering
      const dmSelect = document.getElementById('quiz-filter-dm');
      if (dmSelect) {
        dmSelect.dispatchEvent(new Event('change'));
      }
    });
  }

  // Create quiz modal form
  if (createForm) {
    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentUser = (window.checkAuth && window.checkAuth()) || (window.DEMO_DATA && window.DEMO_DATA.currentUser);
      const role = currentUser ? (window.normalizeRole ? window.normalizeRole(currentUser.role) : currentUser.role) : null;
      if (role !== "admin") {
        if (typeof showToast === 'function') {
          showToast("Permission Denied: Admins only.", "error");
        }
        return;
      }

      const titleInput = document.getElementById('new-quiz-title');
      const dateInput = document.getElementById('new-quiz-date');
      const marksInput = document.getElementById('new-quiz-marks');

      const title = titleInput ? titleInput.value.trim() : 'New Quiz';
      const date = dateInput ? dateInput.value : ((window.getSystemTodayStr && window.getSystemTodayStr()) || (() => { const _n = new Date(); return `${_n.getFullYear()}-${String(_n.getMonth() + 1).padStart(2, "0")}-${String(_n.getDate()).padStart(2, "0")}`; })());
      const marks = marksInput ? (parseInt(marksInput.value, 10) || 50) : 50;

      const newQuiz = {
        id: 'q_' + Date.now(),
        title: title,
        date: date,
        totalMarks: marks,
        createdBy: (currentUser && currentUser.id) || 'u1790626000010'
      };

      const quizzes = getStoredQuizzes();
      quizzes.unshift(newQuiz);
      saveStoredQuizzes(quizzes);

      refreshQuizSelect();

      const modalEl = document.getElementById('createQuizModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.hide();
      }

      createForm.reset();

      if (typeof showToast === 'function') {
        showToast(quizTranslations[currentLang].alert_quiz_created || 'Quiz created successfully!', 'success');
      }

      // Re-trigger active filter rendering
      const dmSelect = document.getElementById('quiz-filter-dm');
      if (dmSelect) {
        dmSelect.dispatchEvent(new Event('change'));
      }
    });
  }
}

// Dynamic language change listener
document.addEventListener("languageChanged", (e) => {
  currentLang = (e && e.detail && e.detail.lang) || (window.getCurrentLang && window.getCurrentLang()) || 'en';
  const authUser = (typeof checkAuth === 'function') ? checkAuth() : null;
  const rawRole = (authUser && authUser.role) ? authUser.role : (localStorage.getItem('userRole') || 'medical_rep');
  const userRole = (typeof normalizeRole === 'function') ? normalizeRole(rawRole) : rawRole;
  const userId = (authUser && authUser.id) ? authUser.id : (localStorage.getItem('userId') || 'u1790626000001');
  const isRep = (userRole === 'medical_rep' || userRole === 'rep');
  if (isRep) {
    initRepView(userId);
  } else {
    initManagerView(authUser, userRole);
  }
});