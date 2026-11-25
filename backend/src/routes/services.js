const express = require('express');
const crypto = require('crypto');
const { pool, query, writeAuditLog } = require('../config/db');
const { requireAuth, requireRoles, getSubordinateIds } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    if (role === 'hr') {
      return res.status(403).json({ error: 'Access Denied: HR cannot access commercial service requests.' });
    }

    if (role === 'admin') {
      const r = await query(
        `SELECT s.*, COALESCE(json_agg(ss.*) FILTER (WHERE ss.id IS NOT NULL), '[]') AS shares
         FROM services s
         LEFT JOIN service_shares ss ON ss.service_id = s.id
         GROUP BY s.id
         ORDER BY s.service_date DESC, s.created_at DESC
         LIMIT 500`
      );
      return res.json({ data: r.rows });
    }

    if (role === 'product_manager') {
      const pmLines = Array.isArray(req.user.line_ids) ? req.user.line_ids : (req.user.line_id ? [req.user.line_id] : []);
      if (pmLines.length === 0) return res.json({ data: [] });
      const r = await query(
        `SELECT s.*, COALESCE(json_agg(ss.*) FILTER (WHERE ss.id IS NOT NULL), '[]') AS shares
         FROM services s
         LEFT JOIN service_shares ss ON ss.service_id = s.id
         WHERE s.line_id = ANY($1::text[]) OR EXISTS (
           SELECT 1 FROM service_shares ss2 WHERE ss2.service_id = s.id AND ss2.line_id = ANY($1::text[])
         )
         GROUP BY s.id
         ORDER BY s.service_date DESC
         LIMIT 500`,
        [pmLines]
      );
      return res.json({ data: r.rows });
    }

    if (role === 'general_manager' || role === 'business_unit' || role === 'line_manager' || role === 'district_manager') {
      const subIds = await getSubordinateIds(req.user.id);
      const allowed = [req.user.id, ...subIds];
      const r = await query(
        `SELECT s.*, COALESCE(json_agg(ss.*) FILTER (WHERE ss.id IS NOT NULL), '[]') AS shares
         FROM services s
         LEFT JOIN service_shares ss ON ss.service_id = s.id
         WHERE s.requester_id = ANY($1::text[]) OR EXISTS (
           SELECT 1 FROM service_shares ss2
           WHERE ss2.service_id = s.id AND (ss2.rep_id = ANY($1::text[]) OR ss2.dm_id = $2 OR ss2.lm_id = $2)
         )
         GROUP BY s.id
         ORDER BY s.service_date DESC
         LIMIT 500`,
        [allowed, req.user.id]
      );
      return res.json({ data: r.rows });
    }

    const r = await query(
      `SELECT s.*, COALESCE(json_agg(ss.*) FILTER (WHERE ss.id IS NOT NULL), '[]') AS shares
       FROM services s
       LEFT JOIN service_shares ss ON ss.service_id = s.id
       WHERE s.requester_id = $1
       GROUP BY s.id
       ORDER BY s.service_date DESC
       LIMIT 200`,
      [req.user.id]
    );
    return res.json({ data: r.rows });
  } catch (err) {
    console.error('[Services] GET error:', err);
    return res.status(500).json({ error: 'Failed to load services.' });
  }
});

router.post(
  '/',
  requireAuth,
  requireRoles(['admin', 'business_unit', 'line_manager', 'district_manager', 'medical_rep', 'product_manager']),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const body = req.body || {};
      const title = String(body.title || '').trim().slice(0, 200);
      const category = String(body.category || '').trim();
      const cost = Number(body.cost || 0);
      const isShared = Boolean(body.isShared && Array.isArray(body.shares) && body.shares.length > 1);

      if (!title || !category || !Number.isFinite(cost) || cost <= 0 || cost > 1000000) {
        return res.status(400).json({ error: 'Valid title, category, and cost (1..1,000,000) are required.' });
      }

      if (isShared) {
        const totalPct = body.shares.reduce((s, sh) => s + Number(sh.sharePercent || 0), 0);
        if (Math.abs(totalPct - 100) > 0.01) {
          return res.status(400).json({ error: 'Shared service percentages must sum to 100%.' });
        }
      }

      const role = req.user.role;
      let initialStatus = 'pending_dm';
      if (role === 'district_manager') initialStatus = 'pending_lm';
      else if (role === 'line_manager') initialStatus = 'pending_bu';
      else if (role === 'business_unit' || role === 'admin') initialStatus = 'approved';

      const srvId = `srv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await client.query('BEGIN');

      const inserted = await client.query(
        `INSERT INTO services (
           id, requester_id, department, line_id, area_id, target_type, target_id,
           target_name, category, title, cost, service_date, is_shared, status, notes
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7,
           $8, $9, $10, $11, COALESCE($12::date, CURRENT_DATE), $13, $14, $15
         ) RETURNING *`,
        [
          srvId, req.user.id, body.department || 'sales', body.lineId || null, body.areaId || null,
          body.targetType || 'doctor', body.targetId || null, body.targetName || null,
          category, title, cost, body.date || null, isShared, initialStatus, String(body.notes || '').slice(0, 1000)
        ]
      );

      if (isShared) {
        for (let i = 0; i < body.shares.length; i++) {
          const sh = body.shares[i];
          const shareStatus = sh.status || initialStatus;
          await client.query(
            `INSERT INTO service_shares (id, service_id, line_id, area_id, rep_id, dm_id, lm_id, share_percent, share_amount, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              `${srvId}_sh_${i}`, srvId, sh.lineId, sh.areaId || null,
              sh.repId || null, sh.dmId || null, sh.lmId || null,
              Number(sh.sharePercent), Number(sh.shareAmount || Math.round((cost * Number(sh.sharePercent)) / 100)),
              shareStatus
            ]
          );
        }
      }

      await client.query('COMMIT');
      return res.status(201).json({ data: inserted.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('[Services] POST error:', err);
      return res.status(500).json({ error: 'Failed to create service request.' });
    } finally {
      client.release();
    }
  }
);

router.put('/:id/decision', requireAuth, async (req, res) => {
  const role = req.user.role;
  if (role === 'general_manager') {
    return res.status(403).json({ error: 'Access Denied: General Manager is view-only and cannot approve or reject services.' });
  }
  if (!['admin', 'business_unit', 'line_manager', 'district_manager', 'product_manager'].includes(role)) {
    return res.status(403).json({ error: 'Access Denied: Approvers only.' });
  }

  const decision = String(req.body?.decision || '').toLowerCase();
  if (decision !== 'approve' && decision !== 'reject') {
    return res.status(400).json({ error: 'Decision must be "approve" or "reject".' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sRes = await client.query(`SELECT * FROM services WHERE id = $1 FOR UPDATE`, [req.params.id]);
    const srv = sRes.rows[0];
    if (!srv) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Service request not found.' });
    }

    if (srv.requester_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Self-approval is strictly forbidden.' });
    }

    if (srv.status === 'rejected' || srv.status === 'cancelled' || (srv.status === 'approved' && decision === 'approve')) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Invalid state transition for status ${srv.status}.` });
    }

    if (decision === 'reject') {
      if (srv.is_shared) {
        await client.query(`UPDATE service_shares SET status = 'rejected' WHERE service_id = $1`, [srv.id]);
      }
      const upd = await client.query(`UPDATE services SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`, [srv.id]);
      await client.query('COMMIT');
      await writeAuditLog({
        actorId: req.user.id, actorEmail: req.user.email, actorRole: role,
        action: 'SERVICE_REJECTED', targetType: 'service', targetId: srv.id, ipAddress: req.ip
      });
      return res.json({ data: upd.rows[0] });
    }

    // Approve branch
    if (srv.is_shared) {
      const shRes = await client.query(`SELECT * FROM service_shares WHERE service_id = $1 FOR UPDATE`, [srv.id]);
      const userLines = Array.isArray(req.user.line_ids) ? req.user.line_ids : (req.user.line_id ? [req.user.line_id] : []);
      let modified = 0;

      for (const sh of shRes.rows) {
        let nextShareStatus = null;
        if (role === 'admin' && sh.status !== 'approved') {
          nextShareStatus = 'approved';
        } else if (role === 'business_unit' && sh.status === 'pending_bu' && userLines.includes(sh.line_id)) {
          nextShareStatus = 'approved';
        } else if (role === 'product_manager' && sh.status === 'pending_pm' && userLines.includes(sh.line_id)) {
          nextShareStatus = 'approved';
        } else if (role === 'district_manager' && sh.status === 'pending_dm' && sh.dm_id === req.user.id) {
          nextShareStatus = 'pending_lm';
        } else if (role === 'line_manager' && sh.status === 'pending_lm' && sh.lm_id === req.user.id) {
          nextShareStatus = 'pending_bu';
        }

        if (nextShareStatus) {
          const approvedBy = Array.isArray(sh.approved_by) ? [...sh.approved_by] : [];
          if (!approvedBy.includes(req.user.id)) approvedBy.push(req.user.id);
          await client.query(
            `UPDATE service_shares SET status = $1, approved_by = $2 WHERE id = $3`,
            [nextShareStatus, JSON.stringify(approvedBy), sh.id]
          );
          sh.status = nextShareStatus;
          modified++;
        }
      }

      if (modified === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'No pending shares matched your authorization scope.' });
      }

      const allApproved = shRes.rows.every((sh) => sh.status === 'approved');
      const upd = await client.query(
        `UPDATE services SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [allApproved ? 'approved' : srv.status, srv.id]
      );
      await client.query('COMMIT');
      return res.json({ data: upd.rows[0] });
    }

    // Single-line service approval
    let nextStatus = null;
    if (role === 'admin') nextStatus = 'approved';
    else if (role === 'district_manager' && srv.status === 'pending_dm') nextStatus = 'pending_lm';
    else if (role === 'line_manager' && srv.status === 'pending_lm') nextStatus = 'pending_bu';
    else if (role === 'business_unit' && srv.status === 'pending_bu') nextStatus = 'approved';
    else if (role === 'product_manager' && srv.status === 'pending_pm') nextStatus = 'approved';

    if (!nextStatus) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid state transition for your role.' });
    }

    const upd = await client.query(`UPDATE services SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [nextStatus, srv.id]);
    await client.query('COMMIT');
    await writeAuditLog({
      actorId: req.user.id, actorEmail: req.user.email, actorRole: role,
      action: 'SERVICE_APPROVED', targetType: 'service', targetId: srv.id,
      metadata: { to: nextStatus }, ipAddress: req.ip
    });
    return res.json({ data: upd.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Services] Decision error:', err);
    return res.status(500).json({ error: 'Failed to process service decision.' });
  } finally {
    client.release();
  }
});

module.exports = router;
