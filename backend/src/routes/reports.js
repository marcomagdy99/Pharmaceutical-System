const express = require('express');
const { query } = require('../config/db');
const { requireAuth, getSubordinateIds } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/reports/achievements
 * Uses territory_history (SCD Type 2) to attribute historical sales to the rep who held the territory that month.
 */
router.get('/achievements', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'hr') {
      return res.status(403).json({ error: 'Access Denied: HR cannot access commercial sales reports.' });
    }

    const lineId = req.query.lineId && req.query.lineId !== 'all' ? String(req.query.lineId) : null;
    const yearPrefix = req.query.year ? `${String(req.query.year).slice(0, 4)}%` : '%';

    let allowedRepIds = null;
    let allowedLineIds = null;

    if (role === 'admin') {
      allowedRepIds = null;
    } else if (role === 'general_manager' || role === 'business_unit' || role === 'line_manager' || role === 'district_manager') {
      const subIds = await getSubordinateIds(req.user.id);
      allowedRepIds = [req.user.id, ...subIds];
    } else if (role === 'product_manager') {
      allowedLineIds = Array.isArray(req.user.line_ids) ? req.user.line_ids : (req.user.line_id ? [req.user.line_id] : []);
      if (allowedLineIds.length === 0) return res.json({ data: [] });
    } else if (role === 'medical_rep') {
      allowedRepIds = [req.user.id];
    } else {
      return res.status(403).json({ error: 'Access Denied.' });
    }

    const sql = `
      SELECT
        s.area_id,
        COALESCE(t.name, 'Unassigned Territory') AS area_name,
        COALESCE(th.rep_id, s.rep_id, t.rep_id) AS effective_rep_id,
        s.line_id,
        s.sales_month,
        SUM(s.quantity) AS actual_units,
        SUM(s.value) AS actual_value,
        SUM(s.target_value) AS target_value
      FROM distributor_sales s
      LEFT JOIN territories t ON t.id = s.area_id
      LEFT JOIN territory_history th
        ON th.area_id = s.area_id
       AND (s.sales_month || '-01')::date >= th.start_date
       AND (th.end_date IS NULL OR (s.sales_month || '-01')::date <= th.end_date)
      WHERE s.sales_month LIKE $1
        AND ($2::text IS NULL OR s.line_id = $2)
        AND ($3::text[] IS NULL OR COALESCE(th.rep_id, s.rep_id, t.rep_id) = ANY($3::text[]))
        AND ($4::text[] IS NULL OR s.line_id = ANY($4::text[]))
      GROUP BY s.area_id, t.name, COALESCE(th.rep_id, s.rep_id, t.rep_id), s.line_id, s.sales_month
      ORDER BY s.sales_month ASC, area_name ASC
    `;

    const r = await query(sql, [yearPrefix, lineId, allowedRepIds, allowedLineIds]);
    return res.json({ data: r.rows });
  } catch (err) {
    console.error('[Reports] Achievements error:', err);
    return res.status(500).json({ error: 'Failed to generate achievements report.' });
  }
});

/**
 * GET /api/reports/costing
 * Strictly denies HR per BACKEND_MIGRATION_ROADMAP.md Section 9.
 */
router.get('/costing', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'hr' || !['admin', 'general_manager', 'business_unit', 'line_manager', 'district_manager', 'medical_rep', 'product_manager'].includes(role)) {
      return res.status(403).json({ error: 'Access Denied: Financial costing reports are restricted.' });
    }

    let allowedRequesterIds = null;
    let allowedLineIds = null;

    if (role === 'admin') {
      allowedRequesterIds = null;
    } else if (role === 'product_manager') {
      allowedLineIds = Array.isArray(req.user.line_ids) ? req.user.line_ids : (req.user.line_id ? [req.user.line_id] : []);
      if (allowedLineIds.length === 0) return res.json({ data: [] });
    } else if (role === 'medical_rep') {
      allowedRequesterIds = [req.user.id];
    } else {
      const subIds = await getSubordinateIds(req.user.id);
      allowedRequesterIds = [req.user.id, ...subIds];
    }

    const r = await query(
      `SELECT
         target_id,
         target_name,
         category,
         line_id,
         COUNT(*) AS tx_count,
         ROUND(SUM(cost)::numeric, 2) AS total_cost
       FROM services
       WHERE status = 'approved'
         AND ($1::text[] IS NULL OR requester_id = ANY($1::text[]))
         AND ($2::text[] IS NULL OR line_id = ANY($2::text[]))
       GROUP BY target_id, target_name, category, line_id
       ORDER BY total_cost DESC`,
      [allowedRequesterIds, allowedLineIds]
    );
    return res.json({ data: r.rows });
  } catch (err) {
    console.error('[Reports] Costing error:', err);
    return res.status(500).json({ error: 'Failed to generate costing report.' });
  }
});

module.exports = router;
