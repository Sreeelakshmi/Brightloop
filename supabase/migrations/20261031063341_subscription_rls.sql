-- =============================================================================
-- Subscription tables: indexes, role helper and RLS
--
-- Runs after `..._subscription_tables.sql`. It adds the lookup and
-- billing-schedule indexes, the `public.get_user_role()` helper used by the
-- policies, enables RLS on all eight tables and installs admin, staff and
-- customer policies.
--
-- Access model:
--   * admin    — full access on every table (including delete).
--   * staff    — read/write on subscriptions, subscription lines, quotation
--                templates and template lines; read-only on products,
--                product_variants, plans and status history. No delete.
--   * customer — read-only on their own subscriptions and those subscriptions'
--                lines, plus plans and products.
--   * status history is append-only from the application's point of view: no
--     insert/update/delete policy exists for staff or customers, so writes are
--     limited to the security-definer status-change function added in Stage 4.
--
-- Re-runnable: policies are dropped before creation, indexes use
-- `if not exists`.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

create index if not exists subscriptions_customer_id_idx
  on public.subscriptions (customer_id);

create index if not exists subscriptions_plan_id_idx
  on public.subscriptions (plan_id);

-- Partial index for the recurring billing engine, which only scans active
-- contracts that are due.
create index if not exists subscriptions_next_billing_date_active_idx
  on public.subscriptions (next_billing_date)
  where status = 'active';

create index if not exists subscription_lines_subscription_id_idx
  on public.subscription_lines (subscription_id);

create index if not exists product_variants_product_id_idx
  on public.product_variants (product_id);

create index if not exists quotation_template_lines_template_id_idx
  on public.quotation_template_lines (template_id);

create index if not exists subscription_status_history_subscription_id_idx
  on public.subscription_status_history (subscription_id);

-- ---------------------------------------------------------------------------
-- Role helper
-- ---------------------------------------------------------------------------
-- Reads the caller's role from public.profiles. `role` is cast to text so the
-- function works whether the column is text or an enum.
--
-- TODO(member-1): public.profiles(id, role) is created by the admin-backend
-- migrations and does not exist yet; the policies below depend on it.
create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text
  from public.profiles
  where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.plans enable row level security;
alter table public.quotation_templates enable row level security;
alter table public.quotation_template_lines enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_lines enable row level security;
alter table public.subscription_status_history enable row level security;

-- ---------------------------------------------------------------------------
-- Admin: full access
-- ---------------------------------------------------------------------------
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists product_variants_admin_all on public.product_variants;
create policy product_variants_admin_all on public.product_variants
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists plans_admin_all on public.plans;
create policy plans_admin_all on public.plans
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists quotation_templates_admin_all on public.quotation_templates;
create policy quotation_templates_admin_all on public.quotation_templates
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists quotation_template_lines_admin_all on public.quotation_template_lines;
create policy quotation_template_lines_admin_all on public.quotation_template_lines
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists subscriptions_admin_all on public.subscriptions;
create policy subscriptions_admin_all on public.subscriptions
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists subscription_lines_admin_all on public.subscription_lines;
create policy subscription_lines_admin_all on public.subscription_lines
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

drop policy if exists subscription_status_history_admin_all on public.subscription_status_history;
create policy subscription_status_history_admin_all on public.subscription_status_history
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Staff: read/write subscriptions, templates and lines; read-only catalog
-- ---------------------------------------------------------------------------
drop policy if exists subscriptions_staff_select on public.subscriptions;
create policy subscriptions_staff_select on public.subscriptions
  for select to authenticated
  using (public.get_user_role() = 'staff');

drop policy if exists subscriptions_staff_insert on public.subscriptions;
create policy subscriptions_staff_insert on public.subscriptions
  for insert to authenticated
  with check (public.get_user_role() = 'staff');

drop policy if exists subscriptions_staff_update on public.subscriptions;
create policy subscriptions_staff_update on public.subscriptions
  for update to authenticated
  using (public.get_user_role() = 'staff')
  with check (public.get_user_role() = 'staff');

drop policy if exists subscription_lines_staff_select on public.subscription_lines;
create policy subscription_lines_staff_select on public.subscription_lines
  for select to authenticated
  using (public.get_user_role() = 'staff');

drop policy if exists subscription_lines_staff_insert on public.subscription_lines;
create policy subscription_lines_staff_insert on public.subscription_lines
  for insert to authenticated
  with check (public.get_user_role() = 'staff');

drop policy if exists subscription_lines_staff_update on public.subscription_lines;
create policy subscription_lines_staff_update on public.subscription_lines
  for update to authenticated
  using (public.get_user_role() = 'staff')
  with check (public.get_user_role() = 'staff');

drop policy if exists quotation_templates_staff_select on public.quotation_templates;
create policy quotation_templates_staff_select on public.quotation_templates
  for select to authenticated
  using (public.get_user_role() = 'staff');

drop policy if exists quotation_templates_staff_insert on public.quotation_templates;
create policy quotation_templates_staff_insert on public.quotation_templates
  for insert to authenticated
  with check (public.get_user_role() = 'staff');

drop policy if exists quotation_templates_staff_update on public.quotation_templates;
create policy quotation_templates_staff_update on public.quotation_templates
  for update to authenticated
  using (public.get_user_role() = 'staff')
  with check (public.get_user_role() = 'staff');

drop policy if exists quotation_template_lines_staff_select on public.quotation_template_lines;
create policy quotation_template_lines_staff_select on public.quotation_template_lines
  for select to authenticated
  using (public.get_user_role() = 'staff');

drop policy if exists quotation_template_lines_staff_insert on public.quotation_template_lines;
create policy quotation_template_lines_staff_insert on public.quotation_template_lines
  for insert to authenticated
  with check (public.get_user_role() = 'staff');

drop policy if exists quotation_template_lines_staff_update on public.quotation_template_lines;
create policy quotation_template_lines_staff_update on public.quotation_template_lines
  for update to authenticated
  using (public.get_user_role() = 'staff')
  with check (public.get_user_role() = 'staff');

drop policy if exists products_staff_select on public.products;
create policy products_staff_select on public.products
  for select to authenticated
  using (public.get_user_role() = 'staff');

drop policy if exists product_variants_staff_select on public.product_variants;
create policy product_variants_staff_select on public.product_variants
  for select to authenticated
  using (public.get_user_role() = 'staff');

drop policy if exists plans_staff_select on public.plans;
create policy plans_staff_select on public.plans
  for select to authenticated
  using (public.get_user_role() = 'staff');

drop policy if exists subscription_status_history_staff_select on public.subscription_status_history;
create policy subscription_status_history_staff_select on public.subscription_status_history
  for select to authenticated
  using (public.get_user_role() = 'staff');

-- ---------------------------------------------------------------------------
-- Customer: read-only on their own subscriptions, their lines and the catalog
-- ---------------------------------------------------------------------------
drop policy if exists subscriptions_customer_select_own on public.subscriptions;
create policy subscriptions_customer_select_own on public.subscriptions
  for select to authenticated
  using (
    public.get_user_role() = 'customer'
    and customer_id = auth.uid()
  );

drop policy if exists subscription_lines_customer_select_own on public.subscription_lines;
create policy subscription_lines_customer_select_own on public.subscription_lines
  for select to authenticated
  using (
    public.get_user_role() = 'customer'
    and exists (
      select 1
      from public.subscriptions s
      where s.id = subscription_lines.subscription_id
        and s.customer_id = auth.uid()
    )
  );

drop policy if exists plans_customer_select on public.plans;
create policy plans_customer_select on public.plans
  for select to authenticated
  using (public.get_user_role() = 'customer');

drop policy if exists products_customer_select on public.products;
create policy products_customer_select on public.products
  for select to authenticated
  using (public.get_user_role() = 'customer');
