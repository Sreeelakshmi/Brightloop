-- =============================================================================
-- SEED SCRIPT: subscriptions.seed.sql
-- Module: Member 2 — Catalog, Plans, Quotation Templates & 50 Sample Subscriptions
--
-- *****************************************************************************
-- WARNING — FOR LOCAL AND TEST DATABASES ONLY!
-- DO NOT RUN THIS SCRIPT ON THE SHARED STAGING OR PRODUCTION SUPABASE INSTANCES.
-- This script inserts test users, fixtures and mocked subscriptions with
-- deterministic UUIDs designed specifically for integration testing.
-- *****************************************************************************
--
-- HOW TO RUN:
-- 1. Via Supabase CLI (if configured):
--    npx supabase db reset
-- 2. Via psql directly against your local Supabase database:
--    psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seeds/subscriptions.seed.sql
--
-- ROW COUNTS SUMMARY:
-- - Test Auth Users & Profiles: 5 records (customer01@example.test .. customer05@example.test)
-- - Products: 3 records (CRM, Analytics, 24/7 Support)
-- - Product Variants: 6 records (2 per product)
-- - Plans: 4 records (Daily, Weekly, Monthly, Yearly with flag variations)
-- - Quotation Templates: 2 records (Starter, Enterprise) + 4 template lines
-- - Subscriptions: EXACTLY 50 records broken down as:
--     * 12 active, due today (next_billing_date = CURRENT_DATE) -> APPEARS IN VIEW
--     *  4 active, overdue by >1 period (next_billing_date < CURRENT_DATE - 60d) -> APPEARS IN VIEW
--     *  8 active, not yet due (next_billing_date > CURRENT_DATE) -> EXCLUDED FROM VIEW
--     *  2 active, next_billing_date > expiry_date -> EXCLUDED FROM VIEW
--     *  1 active, started Jan 31 (monthly clamp test) -> APPEARS IN VIEW
--     *  5 paused, past next_billing_date -> EXCLUDED FROM VIEW
--     *  5 draft -> EXCLUDED FROM VIEW
--     *  5 quotation -> EXCLUDED FROM VIEW
--     *  4 confirmed -> EXCLUDED FROM VIEW
--     *  4 closed -> EXCLUDED FROM VIEW
-- - Subscription Lines: 85 itemized line records attached to subscriptions
-- - Subscription Status History: 50+ status audit trail entries
--
-- IDEMPOTENT: Uses ON CONFLICT DO NOTHING with fixed UUIDs. Safe to rerun.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. TEST USERS & CUSTOMER PROFILES (5 local-only customers)
-- ---------------------------------------------------------------------------
do $$
begin
  -- Seed auth.users if auth schema is available
  if exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      ('11111111-1111-1111-1111-000000000001', 'authenticated', 'authenticated', 'customer01@example.test', '', now(), '{"provider":"email"}', '{"full_name":"Acme Technologies"}', now(), now()),
      ('11111111-1111-1111-1111-000000000002', 'authenticated', 'authenticated', 'customer02@example.test', '', now(), '{"provider":"email"}', '{"full_name":"BlueWave Logistics"}', now(), now()),
      ('11111111-1111-1111-1111-000000000003', 'authenticated', 'authenticated', 'customer03@example.test', '', now(), '{"provider":"email"}', '{"full_name":"Catalyst Media"}', now(), now()),
      ('11111111-1111-1111-1111-000000000004', 'authenticated', 'authenticated', 'customer04@example.test', '', now(), '{"provider":"email"}', '{"full_name":"Delta Aerospace"}', now(), now()),
      ('11111111-1111-1111-1111-000000000005', 'authenticated', 'authenticated', 'customer05@example.test', '', now(), '{"provider":"email"}', '{"full_name":"Echo Retail Systems"}', now(), now())
    on conflict (id) do nothing;
  end if;

  -- Seed public.profiles
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    insert into public.profiles (id, email, full_name, role)
    values
      ('11111111-1111-1111-1111-000000000001', 'customer01@example.test', 'Acme Technologies', 'customer'),
      ('11111111-1111-1111-1111-000000000002', 'customer02@example.test', 'BlueWave Logistics', 'customer'),
      ('11111111-1111-1111-1111-000000000003', 'customer03@example.test', 'Catalyst Media', 'customer'),
      ('11111111-1111-1111-1111-000000000004', 'customer04@example.test', 'Delta Aerospace', 'customer'),
      ('11111111-1111-1111-1111-000000000005', 'customer05@example.test', 'Echo Retail Systems', 'customer')
    on conflict (id) do update set email = excluded.email, full_name = excluded.full_name;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. PRODUCTS (3 products)
-- ---------------------------------------------------------------------------
insert into public.products (id, name, type, sales_price, cost_price, notes)
values
  ('22222222-2222-2222-2222-000000000001', 'Brightloop CRM', 'service', 2500.00, 1000.00, 'Core SaaS CRM system'),
  ('22222222-2222-2222-2222-000000000002', 'Brightloop Analytics', 'service', 1200.00, 400.00, 'Real-time telemetry and reporting'),
  ('22222222-2222-2222-2222-000000000003', 'Priority Support Add-on', 'service', 800.00, 200.00, '24/7 dedicated support desk')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. PRODUCT VARIANTS (6 variants)
-- ---------------------------------------------------------------------------
insert into public.product_variants (id, product_id, attribute, value, extra_price)
values
  ('22222222-2222-2222-2222-000000000101', '22222222-2222-2222-2222-000000000001', 'Edition', 'Standard', 0.00),
  ('22222222-2222-2222-2222-000000000102', '22222222-2222-2222-2222-000000000001', 'Edition', 'Odoo ERP Sync', 560.00),
  ('22222222-2222-2222-2222-000000000201', '22222222-2222-2222-2222-000000000002', 'Tier', 'Basic Dashboards', 0.00),
  ('22222222-2222-2222-2222-000000000202', '22222222-2222-2222-2222-000000000002', 'Tier', 'Predictive AI Suite', 450.00),
  ('22222222-2222-2222-2222-000000000301', '22222222-2222-2222-2222-000000000003', 'SLA', 'Next Business Day', 0.00),
  ('22222222-2222-2222-2222-000000000302', '22222222-2222-2222-2222-000000000003', 'SLA', '1-Hour Critical', 300.00)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. PLANS (4 plans across billing periods with flag variety)
--    Flag combinations:
--    - Daily: pausable = false
--    - Weekly: closable = false
--    - Monthly: renewable = false
--    - Yearly: auto_close = true
-- ---------------------------------------------------------------------------
insert into public.plans (id, name, price, billing_period, min_quantity, pausable, closable, renewable, auto_close)
values
  ('33333333-3333-3333-3333-000000000001', 'Daily Agile Plan', 150.00, 'daily', 1, false, true, true, false),
  ('33333333-3333-3333-3333-000000000002', 'Weekly Growth Plan', 750.00, 'weekly', 1, true, false, true, false),
  ('33333333-3333-3333-3333-000000000003', 'Monthly Enterprise Plan', 2800.00, 'monthly', 1, true, true, false, false),
  ('33333333-3333-3333-3333-000000000004', 'Yearly Prepaid Plan', 28000.00, 'yearly', 1, true, true, true, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. QUOTATION TEMPLATES (2 templates + lines)
-- ---------------------------------------------------------------------------
insert into public.quotation_templates (id, name, plan_id, validity_days)
values
  ('44444444-4444-4444-4444-000000000001', 'Standard CRM Monthly Package', '33333333-3333-3333-3333-000000000003', 30),
  ('44444444-4444-4444-4444-000000000002', 'Complete Enterprise Yearly Suite', '33333333-3333-3333-3333-000000000004', 45)
on conflict (id) do nothing;

insert into public.quotation_template_lines (id, template_id, product_id, variant_id, quantity, unit_price)
values
  ('44444444-4444-4444-4444-000000000101', '44444444-4444-4444-4444-000000000001', '22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-000000000101', 1, 2500.00),
  ('44444444-4444-4444-4444-000000000102', '44444444-4444-4444-4444-000000000001', '22222222-2222-2222-2222-000000000002', '22222222-2222-2222-2222-000000000201', 1, 1200.00),
  ('44444444-4444-4444-4444-000000000201', '44444444-4444-4444-4444-000000000002', '22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-000000000102', 1, 3060.00),
  ('44444444-4444-4444-4444-000000000202', '44444444-4444-4444-4444-000000000002', '22222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-000000000302', 1, 1100.00)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 6. SUBSCRIPTIONS (50 subscriptions with exact specified distribution)
-- ---------------------------------------------------------------------------

-- 6.1: 12 Active, due today (IDs 01-12) -> In View
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003', -- Monthly plan
  current_date - interval '1 month',
  current_date + interval '11 months',
  'net_30',
  'active',
  current_date
from generate_series(1, 12) i
on conflict (id) do nothing;

-- 6.2: 4 Active, overdue by more than one period (IDs 13-16) -> In View (tests catch-up loop)
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003', -- Monthly plan
  current_date - interval '4 months',
  current_date + interval '8 months',
  'immediate',
  'active',
  current_date - interval '75 days'
from generate_series(13, 16) i
on conflict (id) do nothing;

-- 6.3: 8 Active, not yet due (IDs 17-24) -> NOT in view
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003',
  current_date,
  current_date + interval '1 year',
  'net_15',
  'active',
  current_date + interval '15 days'
from generate_series(17, 24) i
on conflict (id) do nothing;

-- 6.4: 2 Active, next_billing_date after expiry_date (IDs 25-26) -> NOT in view
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000001', -- Daily plan
  current_date - interval '20 days',
  current_date - interval '5 days',
  'immediate',
  'active',
  current_date -- next_billing_date is today, but expiry_date was 5 days ago!
from generate_series(25, 26) i
on conflict (id) do nothing;

-- 6.5: 1 Active, started on Jan 31 with monthly plan (ID 27) -> In View (month-end clamp test)
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
values
  (
    '55555555-5555-5555-0000-000000000027',
    '11111111-1111-1111-1111-000000000001',
    '33333333-3333-3333-3333-000000000003', -- Monthly plan
    '2026-01-31'::date,
    '2027-01-31'::date,
    'net_30',
    'active',
    '2026-01-31'::date
  )
on conflict (id) do nothing;

-- 6.6: 5 Paused with a past next_billing_date (IDs 28-32) -> NOT in view
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003',
  current_date - interval '2 months',
  current_date + interval '10 months',
  'net_30',
  'paused',
  current_date - interval '10 days'
from generate_series(28, 32) i
on conflict (id) do nothing;

-- 6.7: 5 Draft (IDs 33-37) -> NOT in view
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003',
  current_date,
  current_date + interval '1 year',
  'net_30',
  'draft',
  null
from generate_series(33, 37) i
on conflict (id) do nothing;

-- 6.8: 5 Quotation (IDs 38-42) -> NOT in view
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003',
  current_date,
  current_date + interval '1 year',
  'net_30',
  'quotation',
  null
from generate_series(38, 42) i
on conflict (id) do nothing;

-- 6.9: 4 Confirmed (IDs 43-46) -> NOT in view
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003',
  current_date,
  current_date + interval '1 year',
  'net_30',
  'confirmed',
  null
from generate_series(43, 46) i
on conflict (id) do nothing;

-- 6.10: 4 Closed (IDs 47-50) -> NOT in view
insert into public.subscriptions (id, customer_id, plan_id, start_date, expiry_date, payment_terms, status, next_billing_date)
select
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('11111111-1111-1111-1111-' || lpad(((i % 5) + 1)::text, 12, '0'))::uuid,
  '33333333-3333-3333-3333-000000000003',
  current_date - interval '2 years',
  current_date - interval '1 year',
  'net_30',
  'closed',
  null
from generate_series(47, 50) i
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. SUBSCRIPTION LINES (attached to all 50 subscriptions)
-- ---------------------------------------------------------------------------
insert into public.subscription_lines (id, subscription_id, product_id, variant_id, quantity, unit_price, amount)
select
  ('66666666-6666-6666-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  '22222222-2222-2222-2222-000000000001', -- CRM
  '22222222-2222-2222-2222-000000000101', -- Standard
  1,
  2500.00,
  2500.00
from generate_series(1, 50) i
on conflict (id) do nothing;

-- Add a second line (Support add-on) to odd-numbered subscriptions
insert into public.subscription_lines (id, subscription_id, product_id, variant_id, quantity, unit_price, amount)
select
  ('77777777-7777-7777-0000-' || lpad(i::text, 12, '0'))::uuid,
  ('55555555-5555-5555-0000-' || lpad(i::text, 12, '0'))::uuid,
  '22222222-2222-2222-2222-000000000003', -- Support
  '22222222-2222-2222-2222-000000000301', -- Standard SLA
  1,
  800.00,
  800.00
from generate_series(1, 50) i
where i % 2 = 1
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 8. STATUS AUDIT HISTORY (ensures details page is populated)
-- ---------------------------------------------------------------------------
insert into public.subscription_status_history (subscription_id, from_status, to_status, changed_at)
select
  s.id,
  null,
  'draft',
  s.created_at
from public.subscriptions s
on conflict do nothing;

insert into public.subscription_status_history (subscription_id, from_status, to_status, changed_at)
select
  s.id,
  'draft',
  s.status,
  s.created_at + interval '1 minute'
from public.subscriptions s
where s.status <> 'draft'
on conflict do nothing;

commit;
