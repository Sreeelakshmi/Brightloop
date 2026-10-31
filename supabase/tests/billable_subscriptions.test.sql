-- =============================================================================
-- Test Suite: billable_subscriptions.test.sql
-- Module: Member 2 — Billable Subscriptions View & Date Math Verification
--
-- Re-runnable test script wrapped in a transaction that automatically rolls back.
-- Run with:
--   psql -h localhost -p 54322 -U postgres -d postgres -f supabase/tests/billable_subscriptions.test.sql
-- =============================================================================

begin;

-- Assertion helper procedure
create or replace procedure assert_true(condition boolean, test_name text)
language plpgsql as $$
begin
  if not condition then
    raise exception 'Assertion failed: %', test_name;
  end if;
  raise notice 'PASS: %', test_name;
end;
$$;

do $$
declare
  v_test_date date;
  v_err_caught boolean := false;
  v_total_view_count int;
  v_distinct_sub_count int;
  v_paused_in_view int;
  v_future_in_view int;
  v_expired_in_view int;
  v_draft_in_view int;
  v_quotation_in_view int;
  v_confirmed_in_view int;
  v_closed_in_view int;
  v_period_mismatch_count int;
  v_multiline_sub_id uuid;
  v_lines_count int;
  v_cust_view_count int;
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_cust1_id uuid := '11111111-1111-1111-1111-000000000001'::uuid;
begin
  raise notice '=== Starting Billable Subscriptions & Date Math Tests ===';

  -- -------------------------------------------------------------------------
  -- TEST GROUP 1: next_billing_date_after(d, period) arithmetic & clamping
  -- -------------------------------------------------------------------------

  -- 1.1: Daily arithmetic (+1 day)
  v_test_date := public.next_billing_date_after('2026-05-10'::date, 'daily');
  call assert_true(v_test_date = '2026-05-11'::date, 'next_billing_date_after daily adds 1 day');

  -- 1.2: Weekly arithmetic (+7 days)
  v_test_date := public.next_billing_date_after('2026-05-10'::date, 'weekly');
  call assert_true(v_test_date = '2026-05-17'::date, 'next_billing_date_after weekly adds 7 days');

  -- 1.3: Monthly standard arithmetic (+1 month)
  v_test_date := public.next_billing_date_after('2026-05-10'::date, 'monthly');
  call assert_true(v_test_date = '2026-06-10'::date, 'next_billing_date_after monthly standard');

  -- 1.4: Monthly clamp: Jan 31 + 1 month -> Feb 28 (in non-leap year 2026)
  v_test_date := public.next_billing_date_after('2026-01-31'::date, 'monthly');
  call assert_true(v_test_date = '2026-02-28'::date, 'next_billing_date_after clamps Jan 31 to Feb 28');

  -- 1.5: Yearly standard arithmetic (+1 year)
  v_test_date := public.next_billing_date_after('2026-05-10'::date, 'yearly');
  call assert_true(v_test_date = '2027-05-10'::date, 'next_billing_date_after yearly standard');

  -- 1.6: Yearly clamp: Feb 29 (leap year 2024) + 1 year -> Feb 28 (2025)
  v_test_date := public.next_billing_date_after('2024-02-29'::date, 'yearly');
  call assert_true(v_test_date = '2025-02-28'::date, 'next_billing_date_after clamps Feb 29 leap year to Feb 28');

  -- 1.7: Unknown period raises an error
  begin
    v_test_date := public.next_billing_date_after('2026-05-10'::date, 'hourly');
  exception when others then
    v_err_caught := true;
  end;
  call assert_true(v_err_caught, 'next_billing_date_after raises exception for unknown period');

  -- -------------------------------------------------------------------------
  -- Ensure test users & profiles exist for RLS context
  -- -------------------------------------------------------------------------
  insert into public.profiles (id, email, full_name, role)
  values
    (v_admin_id, 'admin@brightloop.io', 'Admin User', 'admin'),
    (v_cust1_id, 'customer01@example.test', 'Acme Technologies', 'customer')
  on conflict (id) do update set role = excluded.role;

  -- Setup admin auth context
  create or replace function auth.uid() returns uuid language sql stable as $u$
    select '00000000-0000-0000-0000-000000000001'::uuid;
  $u$;

  -- -------------------------------------------------------------------------
  -- TEST GROUP 2: View Row Count & Inclusion / Exclusion Rules
  -- -------------------------------------------------------------------------

  -- 2.1: Count total rows in view (12 due today + 4 overdue + 1 Jan-31 = 17)
  select count(*) into v_total_view_count from public.billable_subscriptions;
  call assert_true(
    v_total_view_count = 17,
    'billable_subscriptions view returns exactly 17 due/overdue active subscriptions (12 today + 4 overdue + 1 Jan-31)'
  );

  -- 2.2: Ensure NO paused subscriptions appear in view
  select count(*) into v_paused_in_view
  from public.billable_subscriptions
  where status = 'paused';
  call assert_true(v_paused_in_view = 0, 'Paused subscriptions never appear in billable_subscriptions');

  -- 2.3: Ensure NO not-yet-due (future next_billing_date) appear in view
  select count(*) into v_future_in_view
  from public.billable_subscriptions
  where next_billing_date > current_date;
  call assert_true(v_future_in_view = 0, 'Future next_billing_date subscriptions never appear in view');

  -- 2.4: Ensure NO subscriptions where next_billing_date > expiry_date appear
  select count(*) into v_expired_in_view
  from public.billable_subscriptions
  where next_billing_date > expiry_date;
  call assert_true(v_expired_in_view = 0, 'Subscriptions past expiry_date never appear in view');

  -- 2.5: Ensure non-active states (draft, quotation, confirmed, closed) never appear
  select count(*) into v_draft_in_view from public.billable_subscriptions where status = 'draft';
  select count(*) into v_quotation_in_view from public.billable_subscriptions where status = 'quotation';
  select count(*) into v_confirmed_in_view from public.billable_subscriptions where status = 'confirmed';
  select count(*) into v_closed_in_view from public.billable_subscriptions where status = 'closed';

  call assert_true(
    v_draft_in_view = 0 and v_quotation_in_view = 0 and v_confirmed_in_view = 0 and v_closed_in_view = 0,
    'Draft, quotation, confirmed and closed subscriptions never appear in view'
  );

  -- -------------------------------------------------------------------------
  -- TEST GROUP 3: Deduplication & JSONB Aggregated Lines
  -- -------------------------------------------------------------------------

  -- 3.1: Deduplication (each subscription appears exactly once)
  select count(distinct subscription_id) into v_distinct_sub_count from public.billable_subscriptions;
  call assert_true(
    v_total_view_count = v_distinct_sub_count,
    'Each subscription appears exactly once in the view (no fan-out from joined lines)'
  );

  -- 3.2: Multi-line subscriptions have multiple items in lines JSONB array
  v_multiline_sub_id := '55555555-5555-5555-0000-000000000001'::uuid;
  select jsonb_array_length(lines) into v_lines_count
  from public.billable_subscriptions
  where subscription_id = v_multiline_sub_id;
  call assert_true(
    v_lines_count = 2,
    'Multi-line subscriptions correctly aggregate multiple lines into the JSONB lines array'
  );

  -- -------------------------------------------------------------------------
  -- TEST GROUP 4: Period Window Calculation
  -- -------------------------------------------------------------------------

  -- 4.1: period_end = next_billing_date_after(period_start, billing_period) - 1 day
  select count(*) into v_period_mismatch_count
  from public.billable_subscriptions
  where period_end <> (public.next_billing_date_after(period_start, billing_period) - 1)::date;

  call assert_true(
    v_period_mismatch_count = 0,
    'All rows in view calculate period_end exactly as (next_billing_date_after - 1 day)'
  );

  -- -------------------------------------------------------------------------
  -- TEST GROUP 5: Security Invoker & Row Level Security (RLS)
  -- -------------------------------------------------------------------------

  -- Impersonate customer 1
  create or replace function auth.uid() returns uuid language sql stable as $u$
    select '11111111-1111-1111-1111-000000000001'::uuid;
  $u$;

  select count(*) into v_cust_view_count from public.billable_subscriptions;
  call assert_true(
    v_cust_view_count < v_total_view_count,
    'Customer role cannot view all subscriptions (RLS security_invoker applies)'
  );

  raise notice '=== All 12 Billable Subscriptions tests PASSED successfully ===';
end $$;

rollback;
