-- =============================================================================
-- Subscription Lifecycle, Template & Renewal Database Functions
--
-- Stage 4 functions managing subscriptions in a single atomic transaction:
--   1. change_subscription_status: strictly enforced state transitions, plan
--      flags (pausable, closable), next_billing_date activation, and audit history.
--   2. create_subscription_from_template: provisions a draft contract, copies
--      template lines with calculated amounts, and records initial history.
--   3. renew_subscription: extends active subscription expiry_date by the
--      plan's billing period (daily, weekly, monthly, yearly).
--   4. close_expired_subscriptions: batch job to close overdue subscriptions
--      for plans with auto_close enabled.
--
-- NOTE: close_expired_subscriptions is not scheduled here; scheduled execution
-- will be hooked up via pg_cron or a secured Next.js cron route by the team.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. change_subscription_status
-- ---------------------------------------------------------------------------
create or replace function public.change_subscription_status(
  sub_id uuid,
  new_status text
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_updated public.subscriptions%rowtype;
  v_caller_role text;
  v_next_billing_date date;
begin
  -- a. Check caller permissions (admin or staff only)
  v_caller_role := public.get_user_role();
  if auth.uid() is null or v_caller_role not in ('admin', 'staff') then
    raise exception 'Forbidden: Only administrators and staff can change subscription status';
  end if;

  -- b. Lock subscription and retrieve its plan
  select * into v_sub
  from public.subscriptions
  where id = sub_id
  for update;

  if not found then
    raise exception 'Subscription not found';
  end if;

  select * into v_plan
  from public.plans
  where id = v_sub.plan_id;

  if not found then
    raise exception 'Plan associated with subscription was not found';
  end if;

  -- c. Reject any move outside the allowed state transition matrix
  -- Allowed moves:
  --   draft -> quotation
  --   quotation -> confirmed, draft
  --   confirmed -> active
  --   active -> closed, paused
  --   paused -> active, closed
  --   closed -> (nothing)
  if not (
    (v_sub.status = 'draft' and new_status = 'quotation') or
    (v_sub.status = 'quotation' and new_status in ('confirmed', 'draft')) or
    (v_sub.status = 'confirmed' and new_status = 'active') or
    (v_sub.status = 'active' and new_status in ('closed', 'paused')) or
    (v_sub.status = 'paused' and new_status in ('active', 'closed'))
  ) then
    raise exception 'Invalid transition: % -> %', v_sub.status, new_status;
  end if;

  -- d. Check plan flags
  if new_status = 'paused' and not v_plan.pausable then
    raise exception 'Plan does not allow pausing';
  end if;

  if new_status = 'closed' and v_sub.status in ('active', 'paused') and not v_plan.closable then
    raise exception 'Plan does not allow closing';
  end if;

  -- e & f. Set next_billing_date if moving to active and currently null
  v_next_billing_date := v_sub.next_billing_date;
  if new_status = 'active' and v_sub.next_billing_date is null then
    v_next_billing_date := v_sub.start_date;
  end if;

  update public.subscriptions
  set status = new_status,
      next_billing_date = v_next_billing_date,
      updated_at = now()
  where id = sub_id
  returning * into v_updated;

  -- g. Insert history audit record
  insert into public.subscription_status_history (
    subscription_id,
    from_status,
    to_status,
    changed_by,
    changed_at
  ) values (
    sub_id,
    v_sub.status,
    new_status,
    auth.uid(),
    now()
  );

  return v_updated;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. create_subscription_from_template
-- ---------------------------------------------------------------------------
create or replace function public.create_subscription_from_template(
  template_id uuid,
  customer_id uuid,
  start_date date,
  expiry_date date,
  payment_terms text
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tpl public.quotation_templates%rowtype;
  v_sub public.subscriptions%rowtype;
  v_caller_role text;
begin
  -- Validate caller permissions
  v_caller_role := public.get_user_role();
  if auth.uid() is null or v_caller_role not in ('admin', 'staff') then
    raise exception 'Forbidden: Only administrators and staff can create subscriptions';
  end if;

  -- Validate dates
  if expiry_date <= start_date then
    raise exception 'expiryDate must be after startDate';
  end if;

  -- Validate template existence
  select * into v_tpl
  from public.quotation_templates
  where id = template_id;

  if not found then
    raise exception 'Quotation template not found';
  end if;

  -- Create subscription row with default status 'draft' and sequence-generated number
  insert into public.subscriptions (
    customer_id,
    plan_id,
    template_id,
    start_date,
    expiry_date,
    payment_terms,
    status
  ) values (
    customer_id,
    v_tpl.plan_id,
    template_id,
    start_date,
    expiry_date,
    payment_terms,
    'draft'
  )
  returning * into v_sub;

  -- Copy template lines into subscription_lines
  insert into public.subscription_lines (
    subscription_id,
    product_id,
    variant_id,
    quantity,
    unit_price,
    tax_id,
    amount
  )
  select
    v_sub.id,
    tl.product_id,
    tl.variant_id,
    tl.quantity,
    tl.unit_price,
    tl.tax_id,
    (tl.quantity * tl.unit_price)
  from public.quotation_template_lines tl
  where tl.template_id = template_id;

  -- Write initial status history entry
  insert into public.subscription_status_history (
    subscription_id,
    from_status,
    to_status,
    changed_by,
    changed_at
  ) values (
    v_sub.id,
    null,
    'draft',
    auth.uid(),
    now()
  );

  return v_sub;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. renew_subscription
-- ---------------------------------------------------------------------------
create or replace function public.renew_subscription(
  sub_id uuid
)
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subscriptions%rowtype;
  v_plan public.plans%rowtype;
  v_new_expiry date;
  v_updated public.subscriptions%rowtype;
  v_caller_role text;
begin
  -- Validate caller permissions
  v_caller_role := public.get_user_role();
  if auth.uid() is null or v_caller_role not in ('admin', 'staff') then
    raise exception 'Forbidden: Only administrators and staff can renew subscriptions';
  end if;

  -- Lock subscription and retrieve plan
  select * into v_sub
  from public.subscriptions
  where id = sub_id
  for update;

  if not found then
    raise exception 'Subscription not found';
  end if;

  if v_sub.status <> 'active' then
    raise exception 'Only active subscriptions can be renewed';
  end if;

  select * into v_plan
  from public.plans
  where id = v_sub.plan_id;

  if not found then
    raise exception 'Associated plan not found';
  end if;

  if not v_plan.renewable then
    raise exception 'Plan does not allow renewals';
  end if;

  -- Calculate new expiry date based on plan billing period
  case v_plan.billing_period
    when 'daily' then
      v_new_expiry := (v_sub.expiry_date + interval '1 day')::date;
    when 'weekly' then
      v_new_expiry := (v_sub.expiry_date + interval '1 week')::date;
    when 'monthly' then
      v_new_expiry := (v_sub.expiry_date + interval '1 month')::date;
    when 'yearly' then
      v_new_expiry := (v_sub.expiry_date + interval '1 year')::date;
    else
      v_new_expiry := (v_sub.expiry_date + interval '1 month')::date;
  end case;

  update public.subscriptions
  set expiry_date = v_new_expiry,
      updated_at = now()
  where id = sub_id
  returning * into v_updated;

  -- Note: No status history row written because status remains unchanged
  return v_updated;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. close_expired_subscriptions
-- ---------------------------------------------------------------------------
create or replace function public.close_expired_subscriptions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed_count int := 0;
  r record;
begin
  for r in
    select s.id, s.status
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.status in ('active', 'paused')
      and s.expiry_date < current_date
      and p.auto_close = true
    for update of s
  loop
    update public.subscriptions
    set status = 'closed',
        updated_at = now()
    where id = r.id;

    insert into public.subscription_status_history (
      subscription_id,
      from_status,
      to_status,
      changed_by,
      changed_at
    ) values (
      r.id,
      r.status,
      'closed',
      null,
      now()
    );

    v_closed_count := v_closed_count + 1;
  end loop;

  return v_closed_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants and Revokes
-- ---------------------------------------------------------------------------
revoke execute on function public.change_subscription_status(uuid, text) from public, anon;
grant execute on function public.change_subscription_status(uuid, text) to authenticated;

revoke execute on function public.create_subscription_from_template(uuid, uuid, date, date, text) from public, anon;
grant execute on function public.create_subscription_from_template(uuid, uuid, date, date, text) to authenticated;

revoke execute on function public.renew_subscription(uuid) from public, anon;
grant execute on function public.renew_subscription(uuid) to authenticated;

revoke execute on function public.close_expired_subscriptions() from public, anon;
grant execute on function public.close_expired_subscriptions() to authenticated;

