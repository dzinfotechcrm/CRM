-- ============================================================
-- DZ Infotech Internal CRM — Database Schema
-- PostgreSQL 16+
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. SETTINGS
-- Stores all configurable business numbers.
-- Every ₹ amount, percentage, and target lives here.
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  setting_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   TEXT        UNIQUE NOT NULL,
  setting_value TEXT,       -- NULL until founders fill in via UI
  setting_label TEXT        NOT NULL,
  setting_group TEXT        NOT NULL
                            CHECK (setting_group IN (
                              'project_splits', 'saas_plans', 'goals', 'founders'
                            )),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USERS (auth only — 2 founders)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  display_name  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  client_id   UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT  NOT NULL,
  phone       TEXT  NOT NULL,
  email       TEXT,
  city        TEXT  NOT NULL,
  source      TEXT  NOT NULL
                    CHECK (source IN (
                      'Referral', 'Cold Call', 'Walk-in', 'Instagram', 'Other'
                    )),
  client_type TEXT  NOT NULL
                    CHECK (client_type IN (
                      'Project Client', 'Subscription Client', 'Both'
                    )),
  status      TEXT  NOT NULL DEFAULT 'Lead'
                    CHECK (status IN ('Active', 'Inactive', 'Lead')),
  notes       TEXT,
  created_at  DATE  DEFAULT CURRENT_DATE
);

-- ============================================================
-- 4. PROJECTS
-- amount_collected can never exceed total_value (DB-enforced).
-- All allocation fields are computed at query time — never stored.
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  project_id      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID          NOT NULL
                                REFERENCES clients(client_id) ON DELETE CASCADE,
  project_name    TEXT          NOT NULL,
  service_type    TEXT          NOT NULL
                                CHECK (service_type IN (
                                  'Website', 'Web App', 'Custom Software', 'Other'
                                )),
  total_value     NUMERIC(12,2) NOT NULL CHECK (total_value >= 0),
  amount_collected NUMERIC(12,2) NOT NULL DEFAULT 0
                                CHECK (amount_collected >= 0),
  project_status  TEXT          NOT NULL DEFAULT 'In Progress'
                                CHECK (project_status IN (
                                  'In Progress', 'Delivered', 'Completed & Paid'
                                )),
  start_date      DATE          NOT NULL,
  delivery_date   DATE,
  notes           TEXT,

  -- amount_collected can never exceed total_value
  CONSTRAINT chk_collected_lte_total
    CHECK (amount_collected <= total_value)
);

-- ============================================================
-- 5. SUBSCRIPTIONS
-- Plan pricing/expenses are NEVER stored here.
-- Always looked up from settings using plan_type as key prefix.
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id   UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID  NOT NULL
                          REFERENCES clients(client_id) ON DELETE CASCADE,
  plan_type         TEXT  NOT NULL,
  subscription_start DATE NOT NULL,
  next_renewal_date DATE  NOT NULL,
  status            TEXT  NOT NULL DEFAULT 'Active'
                          CHECK (status IN ('Active', 'Expired', 'Cancelled')),
  notes             TEXT
);

-- ============================================================
-- 6. PAYMENTS
-- Exactly one of project_id / subscription_id must be non-null.
-- month_year is derived from payment_date in app logic.
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  payment_id      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_source  TEXT          NOT NULL
                                CHECK (payment_source IN ('Project', 'Subscription')),
  project_id      UUID          REFERENCES projects(project_id) ON DELETE SET NULL,
  subscription_id UUID          REFERENCES subscriptions(subscription_id) ON DELETE SET NULL,
  client_id       UUID          NOT NULL
                                REFERENCES clients(client_id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_type    TEXT          NOT NULL
                                CHECK (payment_type IN (
                                  'Advance', 'Partial', 'Final Payment', 'Subscription Renewal'
                                )),
  payment_date    DATE          NOT NULL,
  payment_method  TEXT          NOT NULL
                                CHECK (payment_method IN (
                                  'UPI', 'Bank Transfer', 'Cash', 'Cheque'
                                )),
  month_year      TEXT          NOT NULL,
  notes           TEXT,

  -- Ensure exactly one source FK is set
  CONSTRAINT chk_payment_source_fk CHECK (
    (payment_source = 'Project'      AND project_id      IS NOT NULL AND subscription_id IS NULL)
    OR
    (payment_source = 'Subscription' AND subscription_id IS NOT NULL AND project_id      IS NULL)
  )
);

-- ============================================================
-- 7. PENDING DUES
-- balance_remaining and auto-status are computed in app logic.
-- amount_paid can never exceed total_owed (DB-enforced).
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_dues (
  due_id        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  person_vendor TEXT          NOT NULL,
  role_work     TEXT          NOT NULL,
  total_owed    NUMERIC(12,2) NOT NULL CHECK (total_owed >= 0),
  amount_paid   NUMERIC(12,2) NOT NULL DEFAULT 0
                              CHECK (amount_paid >= 0),
  status        TEXT          NOT NULL DEFAULT 'Pending'
                              CHECK (status IN ('Pending', 'Partially Paid', 'Cleared')),
  payment_date  DATE,
  notes         TEXT,

  -- amount_paid can never exceed total_owed
  CONSTRAINT chk_paid_lte_owed
    CHECK (amount_paid <= total_owed)
);

-- ============================================================
-- 8. MONEY BUCKETS (3 fixed rows — identity only)
-- All numeric values (target, collected, remaining, progress%)
-- are computed at runtime from settings + project/subscription data.
-- ============================================================
CREATE TABLE IF NOT EXISTS money_buckets (
  bucket_id   UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key  TEXT  UNIQUE NOT NULL
                    CHECK (bucket_key IN ('reserve', 'profit', 'dues')),
  bucket_name TEXT  NOT NULL
);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_client     ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client      ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_project     ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_date        ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_month_year  ON payments(month_year);
CREATE INDEX IF NOT EXISTS idx_settings_group       ON settings(setting_group);
CREATE INDEX IF NOT EXISTS idx_settings_key         ON settings(setting_key);
