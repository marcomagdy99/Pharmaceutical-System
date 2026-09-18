/**
 * @file interactive-charts.js
 * @description Centralized Chart.js visual analytics engine for PharmaCare.
 * Provides interactive charts for:
 * 1. Monthly Sales vs Target Trend (Bar & Line combo)
 * 2. Doctor Classes & Hospitals Distribution (Donut Chart)
 * 3. Doctor Coverage Radial Gauge (Semi-donut Speedometer)
 *
 * Supports bilingual Arabic/English, dark mode, responsive containers, and auto-cleanup of canvas instances.
 */

(function () {
  'use strict';

  // Active chart instances tracker to prevent canvas reuse conflicts
  const activeCharts = {};

  /**
   * Checks if current theme is dark mode.
   */
  function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
           document.body.classList.contains('dark-theme');
  }

  /**
   * Safely destroys an existing chart instance on a canvas.
   * @param {string} canvasId 
   */
  function destroyExistingChart(canvasId) {
    if (activeCharts[canvasId]) {
      try {
        activeCharts[canvasId].destroy();
      } catch (e) {
        console.warn('Could not destroy chart instance:', e);
      }
      delete activeCharts[canvasId];
    }
  }

  /**
   * Month names helper for bilingual charts.
   */
  const MONTH_LABELS = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ar: ['\u064a\u0646\u0627\u064a\u0631', '\u0641\u0628\u0631\u0627\u064a\u0631', '\u0645\u0627\u0631\u0633', '\u0623\u0628\u0631\u064a\u0644', '\u0645\u0627\u064a\u0648', '\u064a\u0648\u0646\u064a\u0648', '\u064a\u0648\u0644\u064a\u0648', '\u0623\u063a\u0633\u0637\u0633', '\u0633\u0628\u062a\u0645\u0628\u0631', '\u0623\u0643\u062a\u0648\u0628\u0631', '\u0646\u0648\u0641\u0645\u0628\u0631', '\u062f\u064a\u0633\u0645\u0628\u0631']
  };

  /**
   * Ensures Chart.js is loaded, with dynamic fallback if script was blocked or delayed.
   */
  function ensureChartJs(callback) {
    if (typeof Chart !== 'undefined') {
      callback();
      return;
    }
    const existing = document.querySelector('script[src*="chart.umd"]');
    if (existing) {
      existing.addEventListener('load', () => callback());
      return;
    }
    const script = document.createElement('script');
    script.src = 'js/chart.umd.min.js';
    script.onload = () => callback();
    document.head.appendChild(script);
  }

  /**
   * 1. Render Sales vs Target Monthly Trend (Combined Bar & Line)
   * @param {string} canvasId - Canvas element ID
   * @param {Object} options - Options containing monthly data arrays or custom config
   */
  function renderSalesTargetTrendChart(canvasId, options = {}) {
    ensureChartJs(() => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      destroyExistingChart(canvasId);

      const lang = (window.getCurrentLang && window.getCurrentLang()) || 'en';
      const isAr = lang === 'ar';
      const dark = isDarkMode();

      const textColor = dark ? '#cbd5e1' : '#475569';
      const gridColor = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.6)';

      const labels = options.labels || (isAr ? MONTH_LABELS.ar : MONTH_LABELS.en);
      const targets = options.targets || [20000, 25000, 22000, 28000, 30000, 32000, 31000, 35000, 34000, 38000, 40000, 42000];
      const actuals = options.actuals || [21000, 24000, 23500, 29000, 28500, 34000, 32500, 36000, 33500, 39000, 41000, 43000];

      const achievements = options.achievements || actuals.map((act, i) => {
        const tgt = targets[i] || 0;
        return tgt > 0 ? Math.round((act / tgt) * 100) : 0;
      });

      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'bar',
              label: isAr ? '\u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a \u0627\u0644\u0641\u0639\u0644\u064a\u0629 (EGP)' : 'Actual Sales (EGP)',
              data: actuals,
              backgroundColor: 'rgba(37, 99, 235, 0.85)',
              borderColor: '#2563eb',
              borderWidth: 1,
              borderRadius: 6,
              order: 2,
              yAxisID: 'y'
            },
            {
              type: 'bar',
              label: isAr ? '\u0627\u0644\u0645\u0633\u062a\u0647\u062f\u0641 (EGP)' : 'Target Sales (EGP)',
              data: targets,
              backgroundColor: dark ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.55)',
              borderColor: '#94a3b8',
              borderWidth: 1,
              borderRadius: 6,
              order: 3,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: isAr ? '\u0646\u0633\u0628\u0629 \u0627\u0644\u062a\u062d\u0642\u064a\u0642 %' : 'Achievement %',
              data: achievements,
              borderColor: '#10b981',
              backgroundColor: '#10b981',
              pointBackgroundColor: '#10b981',
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3,
              borderWidth: 2.5,
              order: 1,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              rtl: isAr,
              labels: {
                boxWidth: 12,
                color: textColor,
                font: {
                  family: isAr ? 'Cairo, sans-serif' : 'Inter, sans-serif',
                  size: 11,
                  weight: '600'
                }
              }
            },
            tooltip: {
              rtl: isAr,
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.dataset.yAxisID === 'y1') {
                    label += (context.parsed.y != null ? context.parsed.y + '%' : '');
                  } else {
                    label += (context.parsed.y != null ? context.parsed.y.toLocaleString() + ' EGP' : '');
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: textColor,
                font: {
                  family: isAr ? 'Cairo, sans-serif' : 'Inter, sans-serif',
                  size: 11
                }
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: isAr ? 'right' : 'left',
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: {
                color: textColor,
                font: { size: 10 },
                callback: function (val) {
                  if (val >= 1000) return (val / 1000) + 'K';
                  return val;
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: isAr ? 'left' : 'right',
              beginAtZero: true,
              grid: { drawOnChartArea: false },
              ticks: {
                color: textColor,
                font: { size: 10 },
                callback: function (val) {
                  return val + '%';
                }
              }
            }
          }
        }
      });

      activeCharts[canvasId] = chart;
    });
  }

  /**
   * 2. Render Doctor Classes & Hospitals Distribution (Donut Chart)
   * @param {string} canvasId - Canvas element ID
   * @param {number} classA - Count of Class A doctors
   * @param {number} classB - Count of Class B doctors
   * @param {number} hospitals - Count of Hospitals / Medical Centers
   */
  function renderDoctorClassesChart(canvasId, classA = 0, classB = 0, hospitals = 0) {
    ensureChartJs(() => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      destroyExistingChart(canvasId);

      const lang = (window.getCurrentLang && window.getCurrentLang()) || 'en';
      const isAr = lang === 'ar';
      const dark = isDarkMode();
      const textColor = dark ? '#cbd5e1' : '#475569';

      const labels = isAr
        ? ['\u0623\u0637\u0628\u0627\u0621 \u0641\u0626\u0629 A', '\u0623\u0637\u0628\u0627\u0621 \u0641\u0626\u0629 B', '\u0645\u0633\u062a\u0634\u0641\u064a\u0627\u062a \u0648\u0645\u0631\u0627\u0643\u0632']
        : ['Class A Doctors', 'Class B Doctors', 'Hospitals & Centers'];

      const dataVals = [Number(classA) || 0, Number(classB) || 0, Number(hospitals) || 0];
      const total = dataVals.reduce((a, b) => a + b, 0);

      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: total > 0 ? dataVals : [1, 1, 1],
              backgroundColor: [
                '#10b981',
                '#3b82f6',
                '#8b5cf6'
              ],
              borderColor: dark ? '#1e293b' : '#ffffff',
              borderWidth: 2,
              hoverOffset: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              rtl: isAr,
              labels: {
                boxWidth: 12,
                padding: 12,
                color: textColor,
                font: {
                  family: isAr ? 'Cairo, sans-serif' : 'Inter, sans-serif',
                  size: 11,
                  weight: '600'
                }
              }
            },
            tooltip: {
              rtl: isAr,
              callbacks: {
                label: function (context) {
                  const val = context.parsed;
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                  return ' ' + context.label + ': ' + val + ' (' + pct + '%)';
                }
              }
            }
          }
        }
      });

      activeCharts[canvasId] = chart;
    });
  }

  /**
   * 3. Render Coverage Radial Gauge (Half-donut Speedometer)
   * @param {string} canvasId - Canvas element ID
   * @param {string} labelId - Element ID to display the large percentage
   * @param {number} coveragePct - Coverage percentage (0-100)
   */
  function renderCoverageGaugeChart(canvasId, labelId = null, coveragePct = 0) {
    const cleanPct = Math.min(100, Math.max(0, Math.round(Number(coveragePct) || 0)));
    const remainingPct = 100 - cleanPct;

    let gaugeColor = '#ef4444';
    if (cleanPct >= 80) {
      gaugeColor = '#10b981';
    } else if (cleanPct >= 50) {
      gaugeColor = '#f59e0b';
    }

    // Always update label immediately regardless of Chart.js timing
    if (labelId) {
      const lbl = document.getElementById(labelId);
      if (lbl) {
        lbl.textContent = cleanPct + '%';
        lbl.style.color = gaugeColor;
      }
    }

    ensureChartJs(() => {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      destroyExistingChart(canvasId);

      const lang = (window.getCurrentLang && window.getCurrentLang()) || 'en';
      const isAr = lang === 'ar';
      const dark = isDarkMode();

      const labels = isAr ? ['\u062a\u0645\u062a \u0627\u0644\u062a\u063a\u0637\u064a\u0629', '\u0645\u062a\u0628\u0642\u064a'] : ['Covered', 'Remaining'];

      const ctx = canvas.getContext('2d');
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: [cleanPct, remainingPct],
              backgroundColor: [gaugeColor, dark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'],
              borderWidth: 0,
              circumference: 180,
              rotation: -90
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '76%',
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              rtl: isAr,
              callbacks: {
                label: function (context) {
                  return ' ' + context.label + ': ' + context.parsed + '%';
                }
              }
            }
          }
        }
      });

      activeCharts[canvasId] = chart;
    });
  }

  // Export to window
  window.renderSalesTargetTrendChart = renderSalesTargetTrendChart;
  window.renderDoctorClassesChart = renderDoctorClassesChart;
  window.renderCoverageGaugeChart = renderCoverageGaugeChart;
  window.destroyPharmaChart = destroyExistingChart;

  // Auto-refresh charts on Theme (Dark/Light) or Language changes
  function refreshActiveCharts() {
    const user = typeof window.checkAuth === "function" ? window.checkAuth() : null;
    if (typeof window.initDashboardCharts === "function" && document.getElementById("dashSalesTrendChart")) {
      window.initDashboardCharts(user);
    }
    if (typeof window.renderDoctorsReport === "function" && document.getElementById("repDoctorClassesChart")) {
      window.renderDoctorsReport();
    }
    if (typeof window.renderSalesReport === "function" && document.getElementById("salesReportTrendChart")) {
      window.renderSalesReport();
    }
  }

  document.addEventListener("themeChanged", refreshActiveCharts);
  document.addEventListener("languageChanged", refreshActiveCharts);
})();