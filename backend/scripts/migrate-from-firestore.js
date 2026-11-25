/**
 * One-time migration script: Firebase Firestore -> Supabase PostgreSQL
 * Usage:
 *   FIREBASE_API_KEY=... FIREBASE_PROJECT_ID=pharmacare-ab4b6 \
 *   FIREBASE_ADMIN_EMAIL=admin@pharmacare.com FIREBASE_ADMIN_PASSWORD=... \
 *   DATABASE_URL=postgresql://... node scripts/migrate-from-firestore.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

function decodeFirestoreValue(val) {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in val) {
    const out = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      out[k] = decodeFirestoreValue(v);
    }
    return out;
  }
  return null;
}

async function run() {
  const apiKey = process.env.FIREBASE_API_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'pharmacare-ab4b6';
  const email = process.env.FIREBASE_ADMIN_EMAIL || 'admin@pharmacare.com';
  const password = process.env.FIREBASE_ADMIN_PASSWORD;

  if (!apiKey || !password) {
    throw new Error('Set FIREBASE_API_KEY and FIREBASE_ADMIN_PASSWORD environment variables first.');
  }

  console.log('[Migrate] Signing into Firebase Auth...');
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const authJson = await authRes.json();
  if (!authRes.ok || !authJson.idToken) {
    throw new Error('Firebase sign-in failed: ' + (authJson.error?.message || authRes.status));
  }
  const hdr = { Authorization: `Bearer ${authJson.idToken}` };
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  const masterRes = await fetch(`${base}/app_state/master_data`, { headers: hdr });
  const masterJson = await masterRes.json();
  const master = JSON.parse(masterJson.fields.payload.stringValue);

  const salesRes = await fetch(`${base}/app_state/distributor_sales`, { headers: hdr });
  const salesJson = salesRes.ok ? await salesRes.json() : null;
  const distSales = salesJson?.fields?.payload?.stringValue ? JSON.parse(salesJson.fields.payload.stringValue) : [];

  const visitsRes = await fetch(`${base}/visits?pageSize=500`, { headers: hdr });
  const visitsJson = visitsRes.ok ? await visitsRes.json() : { documents: [] };
  const visits = (visitsJson.documents || []).map((d) => {
    const obj = {};
    for (const [k, v] of Object.entries(d.fields || {})) obj[k] = decodeFirestoreValue(v);
    return obj;
  });

  const defaultBcryptHash = await bcrypt.hash(password, 12);

  // 1. Product Lines
  for (const pl of master.productLines || []) {
    await pool.query(
      `INSERT INTO product_lines (id, name, name_ar, status, call_frequency, products, line_manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, products = EXCLUDED.products`,
      [pl.id, pl.name, pl.nameAr || pl.name, pl.status || 'Active', JSON.stringify(pl.callFrequency || {}), JSON.stringify(pl.products || []), pl.lineManagerId || null]
    );
  }
  console.log('[Migrate] Product Lines:', (master.productLines || []).length);

  // 2. Users (insert root users first, then update manager_id to satisfy FK)
  const users = master.users || [];
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (id, name, name_ar, email, employee_code, password_hash, role, title, line_id, line_ids, area_id, area_ids, product_ids, phone, hire_date, status, must_change_password, leave_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status`,
      [
        u.id, u.name || 'User', u.nameAr || u.name, String(u.email || '').toLowerCase().trim(),
        u.employeeCode || u.code || null, defaultBcryptHash, u.role || 'medical_rep', u.title || u.role,
        u.lineId || null, JSON.stringify(u.lineIds || []), u.areaId || null, JSON.stringify(u.areaIds || []),
        JSON.stringify(u.productIds || []), u.phone || null, u.hireDate || null, u.status || 'Active',
        Boolean(u.mustChangePassword), JSON.stringify(u.leaveBalance || {})
      ]
    );
  }
  for (const u of users) {
    if (u.managerId) {
      await pool.query(`UPDATE users SET manager_id = $1 WHERE id = $2`, [u.managerId, u.id]).catch(() => {});
    }
  }
  console.log('[Migrate] Users:', users.length);

  // 3. Territories
  for (const a of master.areas || []) {
    await pool.query(
      `INSERT INTO territories (id, name, code, line_id, rep_id, dm_id, bu_id, bricks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, bricks = EXCLUDED.bricks`,
      [a.id, a.name, a.code || null, a.lineId || null, a.repId || null, a.dmId || null, a.buId || null, JSON.stringify(a.bricks || [])]
    );
  }
  console.log('[Migrate] Territories:', (master.areas || []).length);

  // 4. Doctors
  for (const d of master.doctors || []) {
    await pool.query(
      `INSERT INTO doctors (id, name, specialty, class, clinic_address, area_id, line_id, rep_id, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [d.id, d.name, d.specialty || null, d.class || 'B', d.clinicAddress || d.address || null, d.areaId || null, d.lineId || null, d.repId || null, d.lat ?? null, d.lng ?? null]
    );
  }
  console.log('[Migrate] Doctors:', (master.doctors || []).length);

  // 5. Visits
  for (const v of visits) {
    if (!v.id || !v.repId) continue;
    await pool.query(
      `INSERT INTO visits (id, rep_id, doctor_id, target_type, doctor_name, line_id, area_id, visit_date, visit_time, period, visit_type, status, gps_status, products, product_ids, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::date, CURRENT_DATE), $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO NOTHING`,
      [
        v.id, v.repId, v.doctorId || null, v.targetType || 'doctor', v.doctorName || null,
        v.lineId || null, v.areaId || null, v.date || null, v.time || null, v.period || null,
        v.visitType || 'single', v.status || 'planned', v.gpsStatus || 'unverified',
        JSON.stringify(v.products || []), JSON.stringify(v.productIds || []), v.comment || null
      ]
    );
  }
  console.log('[Migrate] Visits:', visits.length);

  // 6. Distributor Sales
  for (const s of distSales) {
    if (!s.id) continue;
    await pool.query(
      `INSERT INTO distributor_sales (id, distributor_id, line_id, area_id, rep_id, product_id, sales_month, quantity, value, target_value, raw_brick)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO NOTHING`,
      [
        s.id, s.distributorId || null, s.lineId || null, s.areaId || null, s.repId || null,
        s.productId || null, s.month || '2026-01', Number(s.quantity || s.units || 0),
        Number(s.value || s.actual || s.amount || 0), Number(s.target || 0), s.brick || s.area || null
      ]
    );
  }
  console.log('[Migrate] Distributor Sales:', distSales.length);

  await pool.end();
  console.log('[Migrate] Migration completed successfully!');
}

run().catch((err) => {
  console.error('[Migrate] Error:', err);
  process.exit(1);
});
