-- ============================================================
-- DZ Infotech Internal CRM — Seed Data
-- All setting_value fields are NULL — founders fill via UI.
-- ============================================================

-- ----------------------------------------
-- Project Splits (group: project_splits)
-- ----------------------------------------
INSERT INTO settings (setting_key, setting_value, setting_label, setting_group) VALUES
  ('project_split_reserve_pct', NULL, 'Reserve %',  'project_splits'),
  ('project_split_profit_pct',  NULL, 'Profit %',   'project_splits'),
  ('project_split_dues_pct',    NULL, 'Dues %',     'project_splits')
ON CONFLICT (setting_key) DO NOTHING;

-- ----------------------------------------
-- SaaS Plans — Monthly (group: saas_plans)
-- ----------------------------------------
INSERT INTO settings (setting_key, setting_value, setting_label, setting_group) VALUES
  ('plan_monthly_price',             NULL, 'Monthly Plan — Price',             'saas_plans'),
  ('plan_monthly_expense_total',     NULL, 'Monthly Plan — Total Expense',     'saas_plans'),
  ('plan_monthly_expense_technical', NULL, 'Monthly Plan — Technical Expense', 'saas_plans'),
  ('plan_monthly_expense_physical',  NULL, 'Monthly Plan — Physical Expense',  'saas_plans'),
  ('plan_monthly_expense_misc',      NULL, 'Monthly Plan — Misc Expense',      'saas_plans')
ON CONFLICT (setting_key) DO NOTHING;

-- ----------------------------------------
-- SaaS Plans — Annual (group: saas_plans)
-- ----------------------------------------
INSERT INTO settings (setting_key, setting_value, setting_label, setting_group) VALUES
  ('plan_annual_price',             NULL, 'Annual Plan — Price',             'saas_plans'),
  ('plan_annual_expense_total',     NULL, 'Annual Plan — Total Expense',     'saas_plans'),
  ('plan_annual_expense_technical', NULL, 'Annual Plan — Technical Expense', 'saas_plans'),
  ('plan_annual_expense_physical',  NULL, 'Annual Plan — Physical Expense',  'saas_plans'),
  ('plan_annual_expense_misc',      NULL, 'Annual Plan — Misc Expense',      'saas_plans')
ON CONFLICT (setting_key) DO NOTHING;

-- ----------------------------------------
-- Goals (group: goals)
-- ----------------------------------------
INSERT INTO settings (setting_key, setting_value, setting_label, setting_group) VALUES
  ('goal_monthly_revenue_target',   NULL, 'Monthly Revenue Target (₹)',       'goals'),
  ('goal_monthly_revenue_deadline', NULL, 'Monthly Revenue Deadline',         'goals'),
  ('goal_reserve_target',           NULL, 'Reserve Fund Target (₹)',          'goals'),
  ('goal_dues_target',              NULL, 'Dues Clearance Target (₹)',        'goals'),
  ('goal_founder_profit_monthly',   NULL, 'Monthly Founder Profit Target (₹)','goals')
ON CONFLICT (setting_key) DO NOTHING;

-- ----------------------------------------
-- Founders (group: founders)
-- ----------------------------------------
INSERT INTO settings (setting_key, setting_value, setting_label, setting_group) VALUES
  ('founder1_name', NULL, 'Founder 1 Name', 'founders'),
  ('founder2_name', NULL, 'Founder 2 Name', 'founders')
ON CONFLICT (setting_key) DO NOTHING;

-- ----------------------------------------
-- Money Buckets (3 fixed rows — identity only)
-- ----------------------------------------
INSERT INTO money_buckets (bucket_key, bucket_name) VALUES
  ('reserve', 'Reserve Fund'),
  ('profit',  'Founder Profit'),
  ('dues',    'Pending Dues')
ON CONFLICT (bucket_key) DO NOTHING;
