-- ============================================================================
-- PharmaCare CRM - Supabase PostgreSQL Production Schema
-- Matches BACKEND_MIGRATION_ROADMAP.md (v315)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Product Lines
CREATE TABLE IF NOT EXISTS product_lines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  call_frequency JSONB NOT NULL DEFAULT '{"classA": 4, "classB": 3, "classC": 1}'::jsonb,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  line_manager_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users (password_hash NEVER returned in API responses)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT,
  email TEXT NOT NULL UNIQUE,
  employee_code TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'admin', 'general_manager', 'business_unit', 'hr',
    'line_manager', 'product_manager', 'district_manager', 'medical_rep'
  )),
  title TEXT,
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  line_id TEXT,
  line_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  area_id TEXT,
  area_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  phone TEXT,
  hire_date DATE,
  daily_target NUMERIC(6,2) NOT NULL DEFAULT 8.0,
  leave_balance JSONB NOT NULL DEFAULT '{"annual": 21, "casual": 6, "emergency": 6, "sick": 7, "unpaid": 0, "maternity": 90}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- 3. Territories / CRM Brick Areas
CREATE TABLE IF NOT EXISTS territories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  line_id TEXT REFERENCES product_lines(id) ON DELETE SET NULL,
  rep_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  dm_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  bu_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  bricks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_territories_line_rep ON territories(line_id, rep_id);

-- 4. Territory History (SCD Type 2 for fair historical sales/achievement attribution)
CREATE TABLE IF NOT EXISTS territory_history (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  rep_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_territory_history_area_dates ON territory_history(area_id, start_date, end_date);

-- 5. Medical Directory (Doctors, Hospitals, Pharmacies - Soft Delete Only)
CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  class TEXT DEFAULT 'B',
  clinic_address TEXT,
  area_id TEXT REFERENCES territories(id) ON DELETE SET NULL,
  line_id TEXT REFERENCES product_lines(id) ON DELETE SET NULL,
  rep_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  area_id TEXT REFERENCES territories(id) ON DELETE SET NULL,
  line_id TEXT REFERENCES product_lines(id) ON DELETE SET NULL,
  rep_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  area_id TEXT REFERENCES territories(id) ON DELETE SET NULL,
  line_id TEXT REFERENCES product_lines(id) ON DELETE SET NULL,
  rep_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Visits (Atomic + Offline Idempotency Key + Authoritative Server Timestamp)
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  rep_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  doctor_id TEXT,
  target_type TEXT NOT NULL DEFAULT 'doctor',
  doctor_name TEXT,
  line_id TEXT,
  area_id TEXT,
  visit_date DATE NOT NULL,
  visit_time TEXT,
  period TEXT,
  visit_type TEXT NOT NULL DEFAULT 'single',
  double_with_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'missed', 'pending_approval', 'cancelled')),
  gps_status TEXT DEFAULT 'unverified',
  device_lat DOUBLE PRECISION,
  device_lng DOUBLE PRECISION,
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  distance_meters INTEGER,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  giveaway_samples JSONB NOT NULL DEFAULT '[]'::jsonb,
  reschedule_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  comment TEXT,
  is_offline BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_rep_date ON visits(rep_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visits_area_status ON visits(area_id, status);

-- 7. Expenses & Receipt URLs (Supabase Storage URLs, NO Base64 blobs)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  line_id TEXT,
  area_id TEXT,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_dm' CHECK (status IN (
    'pending_dm', 'pending_lm', 'pending_bu', 'pending_hr', 'approved', 'disbursed', 'rejected', 'cancelled'
  )),
  next_approver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  receipt_url TEXT,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_requester_status ON expenses(requester_id, status);

-- 8. Services & Shared Service Shares
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department TEXT NOT NULL DEFAULT 'sales',
  line_id TEXT,
  area_id TEXT,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  cost NUMERIC(12,2) NOT NULL CHECK (cost > 0),
  service_date DATE NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending_dm' CHECK (status IN (
    'pending_dm', 'pending_lm', 'pending_bu', 'pending_pm', 'pending_admin', 'approved', 'rejected', 'cancelled'
  )),
  next_approver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_line_status ON services(line_id, status, service_date);

CREATE TABLE IF NOT EXISTS service_shares (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  line_id TEXT NOT NULL,
  area_id TEXT,
  rep_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  dm_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  lm_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  share_percent NUMERIC(5,2) NOT NULL,
  share_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  next_approver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  approved_by JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 9. Leaves
CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  day_duration TEXT NOT NULL DEFAULT 'full',
  days NUMERIC(4,1) NOT NULL CHECK (days > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approvals JSONB NOT NULL DEFAULT '{}'::jsonb,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Distributor Sales
CREATE TABLE IF NOT EXISTS distributor_sales (
  id TEXT PRIMARY KEY,
  distributor_id TEXT,
  line_id TEXT,
  area_id TEXT,
  rep_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  product_id TEXT,
  sales_month TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  target_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  raw_brick TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dist_sales_area_month ON distributor_sales(area_id, sales_month);

-- 11. Password Reset One-Time Tokens (Hashed SHA-256)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Append-Only Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 13. Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
