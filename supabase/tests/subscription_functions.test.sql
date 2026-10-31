-- =============================================================================
-- Subscription Functions & Lifecycle SQL Test Suite
--
-- Re-runnable test script wrapped in a transaction that automatically rolls back.
-- Run with psql or directly inside the Supabase SQL Editor.
-- =============================================================================

begin;

-- Create an assertion helper
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
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_cust_id uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  v_plan_full uuid;
  v_plan_no_pause uuid;
  v_plan_no_close uuid;
  v_plan_auto_close uuid;
  v_prod_id uuid;
  v_tpl_id uuid;
  v_sub_id uuid;
  v_sub record;
  v_history_count int;
  v_closed_count int;
  v_error_caught boolean;
begin
  -- 1. Setup mock profiles if needed for get_user_role()
  create table if not exists public.profiles (
    id uuid primary key,
    role text not null,
    email text
  );

  insert into public.profiles (id, role, email)
  values
    (v_admin_id, 'admin', 'admin@brightloop.io'),
    (v_cust_id, 'customer', 'cust@brightloop.io')
  on conflict (id) do update set role = excluded.role;

  -- Mock auth.uid() returning admin
  create or replace function auth.uid() returns uuid language sql stable as $u$
    select '00000000-0000-0000-0000-000000000001'::uuid;
  $u$;

  -- 2. Setup Plans
  insert into public.plans (
    name, price, billing_period, min_quantity, auto_close, closable, pausable, renewable
  ) values (
    'Standard Plan', 99.00, 'monthly', 1, false, true, true, true
  ) returning id into v_plan_full;

  insert into public.plans (
    name, price, billing_period, min_quantity, auto_close, closable, pausable, renewable
  ) values (
    'Strict Plan (No Pause)', 199.00, 'monthly', 1, false, true, false, true
  ) returning id into v_plan_no_pause;

  insert into public.plans (
    name, price, billing_period, min_quantity, auto_close, closable, pausable, renewable
  ) values (
    'Lock-in Plan (No Close)', 499.00, 'yearly', 1, false, false, true, false
  ) returning id into v_plan_no_close;

  insert into public.plans (
    name, price, billing_period, min_quantity, auto_close, closable, pausable, renewable
  ) values (
    'Auto Close Plan', 49.00, 'monthly', 1, true, true, true, true
  ) returning id into v_plan_auto_close;

  -- 3. Setup Catalog Product
  insert into public.products (name, type, sales_price, cost_price)
  values ('Broadband Router', 'goods', 79.99, 40.00)
  returning id into v_prod_id;

  -- 4. Setup Quotation Template & Lines
  insert into public.quotation_templates (name, plan_id, validity_days)
  values ('Fast Starter Template', v_plan_full, 30)
  returning id into v_tpl_id;

  insert into public.quotation_template_lines (template_id, product_id, quantity, unit_price)
  values (v_tpl_id, v_prod_id, 2, 79.99);

  -- -------------------------------------------------------------------------
  -- TEST: create_subscription_from_template copies all lines and generates number
  -- -------------------------------------------------------------------------
  v_sub := public.create_subscription_from_template(
    v_tpl_id,
    v_cust_id,
    '2026-11-01'::date,
    '2026-12-01'::date,
    'net_30'
  );

  call assert_true(v_sub.id is not null, 'create_subscription_from_template generates ID');
  call assert_true(v_sub.number like 'SUB-%', 'create_subscription_from_template generates SUB-xxxxxx number');
  call assert_true(v_sub.status = 'draft', 'initial status is draft');

  select count(*) into v_history_count from public.subscription_lines where subscription_id = v_sub.id;
  call assert_true(v_history_count = 1, 'template lines copied into subscription_lines');

  v_sub_id := v_sub.id;

  -- -------------------------------------------------------------------------
  -- TEST: draft -> active fails directly
  -- -------------------------------------------------------------------------
  v_error_caught := false;
  begin
    perform public.change_subscription_status(v_sub_id, 'active');
  exception when others then
    v_error_caught := true;
  end;
  call assert_true(v_error_caught, 'draft -> active fails with invalid transition exception');

  -- -------------------------------------------------------------------------
  -- TEST: Full lifecycle path draft -> quotation -> confirmed -> active succeeds
  -- -------------------------------------------------------------------------
  -- Move draft -> quotation
  v_sub := public.change_subscription_status(v_sub_id, 'quotation');
  call assert_true(v_sub.status = 'quotation', 'draft -> quotation succeeds');

  -- Move quotation -> confirmed
  v_sub := public.change_subscription_status(v_sub_id, 'confirmed');
  call assert_true(v_sub.status = 'confirmed', 'quotation -> confirmed succeeds');

  -- Move confirmed -> active
  v_sub := public.change_subscription_status(v_sub_id, 'active');
  call assert_true(v_sub.status = 'active', 'confirmed -> active succeeds');

  -- -------------------------------------------------------------------------
  -- TEST: next_billing_date equals start_date after activation
  -- -------------------------------------------------------------------------
  call assert_true(v_sub.next_billing_date = v_sub.start_date, 'next_billing_date set to start_date on activation');

  -- -------------------------------------------------------------------------
  -- TEST: Each change adds one status history row
  -- -------------------------------------------------------------------------
  -- Initial creation (draft) + quotation + confirmed + active = 4 history rows
  select count(*) into v_history_count from public.subscription_status_history where subscription_id = v_sub_id;
  call assert_true(v_history_count = 4, 'each transition writes exactly one history audit row');

  -- -------------------------------------------------------------------------
  -- TEST: Pause fails on a plan with pausable = false
  -- -------------------------------------------------------------------------
  insert into public.subscriptions (
    customer_id, plan_id, start_date, expiry_date, payment_terms, status
  ) values (
    v_cust_id, v_plan_no_pause, '2026-11-01', '2026-12-01', 'immediate', 'active'
  ) returning id into v_sub_id;

  v_error_caught := false;
  begin
    perform public.change_subscription_status(v_sub_id, 'paused');
  exception when others then
    v_error_caught := true;
  end;
  call assert_true(v_error_caught, 'pause fails when plan.pausable is false');

  -- -------------------------------------------------------------------------
  -- TEST: Close fails on a plan with closable = false
  -- -------------------------------------------------------------------------
  insert into public.subscriptions (
    customer_id, plan_id, start_date, expiry_date, payment_terms, status
  ) values (
    v_cust_id, v_plan_no_close, '2026-11-01', '2027-11-01', 'immediate', 'active'
  ) returning id into v_sub_id;

  v_error_caught := false;
  begin
    perform public.change_subscription_status(v_sub_id, 'closed');
  exception when others then
    v_error_caught := true;
  end;
  call assert_true(v_error_caught, 'close fails when plan.closable is false');

  -- -------------------------------------------------------------------------
  -- TEST: close_expired_subscriptions only closes plans with auto_close = true
  -- -------------------------------------------------------------------------
  -- Sub 1: past expiry, auto_close = true -> should be closed
  insert into public.subscriptions (
    customer_id, plan_id, start_date, expiry_date, payment_terms, status
  ) values (
    v_cust_id, v_plan_auto_close, '2026-08-01', '2026-09-01', 'immediate', 'active'
  );

  -- Sub 2: past expiry, auto_close = false -> should NOT be closed
  insert into public.subscriptions (
    customer_id, plan_id, start_date, expiry_date, payment_terms, status
  ) values (
    v_cust_id, v_plan_full, '2026-08-01', '2026-09-01', 'immediate', 'active'
  );

  v_closed_count := public.close_expired_subscriptions();
  call assert_true(v_closed_count = 1, 'close_expired_subscriptions only closes contracts where plan.auto_close is true');

  raise notice '==================================================';
  raise notice 'ALL SQL SUBSCRIPTION FUNCTION TESTS PASSED CLEANLY';
  raise notice '==================================================';
end;
$$;

rollback;
