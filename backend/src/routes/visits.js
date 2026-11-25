const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/db');
const { requireAuth, requireRoles, getSubordinateIds } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    if (role === 'admin') {
      const r = await query(
        `SELECT * FROM visits ORDER BY visit_date DESC, created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return res.json({ data: r.rows });
    }

    if (role === 'general_manager' || role === 'business_unit' || role === 'line_manager' || role === 'district_manager') {
      const subIds = await getSubordinateIds(req.user.id);
      const allowed = [req.user.id, ...subIds];
      const r = await query(
        `SELECT * FROM visits
         WHERE rep_id = ANY($1::text[]) OR double_with_user_id = ANY($1::text[])
         ORDER BY visit_date DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [allowed, limit, offset]
      );
      return res.json({ data: r.rows });
    }

    if (role === 'medical_rep') {
      const r = await query(
        `SELECT * FROM visits WHERE rep_id = $1 ORDER BY visit_date DESC, created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );
      return res.json({ data: r.rows });
    }

    // HR or unrecognized roles cannot read field call records
    return res.status(403).json({ error: 'Access Denied for visits.' });
  } catch (err) {
    console.error('[Visits] GET error:', err);
    return res.status(500).json({ error: 'Failed to load visits.' });
  }
});

router.post(
  '/',
  requireAuth,
  requireRoles(['admin', 'business_unit', 'line_manager', 'district_manager', 'medical_rep']),
  async (req, res) => {
    try {
      const body = req.body || {};
      const repId = req.user.role === 'medical_rep' ? req.user.id : (body.repId || req.user.id);

      // Verify manager hierarchy if creating for another rep
      if (repId !== req.user.id && req.user.role !== 'admin') {
        const subIds = await getSubordinateIds(req.user.id);
        if (!subIds.includes(repId)) {
          return res.status(403).json({ error: 'Cannot create visit outside your reporting hierarchy.' });
        }
      }

      const idempotencyKey = body.idempotencyKey ? String(body.idempotencyKey).trim() : null;
      if (idempotencyKey) {
        const existing = await query(`SELECT * FROM visits WHERE idempotency_key = $1 LIMIT 1`, [idempotencyKey]);
        if (existing.rows[0]) {
          return res.status(200).json({ data: existing.rows[0], deduplicated: true });
        }
      }

      const visitId = body.id || `v_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const allowedStatus = ['planned', 'completed', 'missed', 'pending_approval', 'cancelled'];
      const status = allowedStatus.includes(body.status) ? body.status : 'planned';

      // Authoritative Server Time: created_at / updated_at set by PostgreSQL NOW(), never client clock
      const inserted = await query(
        `INSERT INTO visits (
           id, idempotency_key, rep_id, doctor_id, target_type, doctor_name,
           line_id, area_id, visit_date, visit_time, period, visit_type,
           double_with_user_id, status, gps_status, device_lat, device_lng,
           target_lat, target_lng, distance_meters, products, product_ids,
           giveaway_samples, comment, is_offline
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, COALESCE($9::date, CURRENT_DATE), $10, $11, $12,
           $13, $14, $15, $16, $17,
           $18, $19, $20, $21, $22,
           $23, $24, $25
         )
         ON CONFLICT (id) DO NOTHING
         RETURNING *`,
        [
          visitId, idempotencyKey, repId, body.doctorId || null, body.targetType || 'doctor', body.doctorName || null,
          body.lineId || null, body.areaId || null, body.date || null, body.time || null, body.period || null, body.visitType || 'single',
          body.doubleWithUserId || null, status, body.gpsStatus || 'unverified', body.deviceLat ?? null, body.deviceLng ?? null,
          body.targetLat ?? null, body.targetLng ?? null, body.distanceMeters ?? null,
          JSON.stringify(body.products || []), JSON.stringify(body.productIds || []),
          JSON.stringify(body.giveawaySamples || []), body.comment || null, Boolean(body.isOffline)
        ]
      );

      return res.status(201).json({ data: inserted.rows[0] || null });
    } catch (err) {
      console.error('[Visits] POST error:', err);
      return res.status(500).json({ error: 'Failed to save visit.' });
    }
  }
);

module.exports = router;
