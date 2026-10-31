-- =============================================================================
-- Catalog and subscription tables
--
-- Creates the eight tables that back the catalog, quotation templates,
-- subscriptions, subscription lines and subscription status history, plus
-- their named CHECK constraints and updated_at triggers. Column names are the
-- snake_case mirror of the camelCase fields in
-- `src/lib/validations/subscription.ts`.
--
-- Dependencies owned by other members (not created here):
--   * public.profiles(id, role) — Member 1, `feature/admin-backend`.
--     `subscriptions.customer_id` references it as planned; see the TODO on
--     that column.
--   * taxes — Member 3, `feature/billing-payments`. `tax_id` columns are plain
--     uuid values without a foreign key until that table lands.
--
-- Re-runnable where practical: tables use `if not exists`, triggers are
-- dropped before creation.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.subscription_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  sales_price numeric(12, 2) not null,
  cost_price numeric(12, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_sales_price_non_negative check (sales_price >= 0),
  constraint products_cost_price_non_negative check (cost_price >= 0)
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.subscription_set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. product_variants
-- ---------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  attribute text not null,
  value text not null,
  extra_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_extra_price_non_negative check (extra_price >= 0),
  constraint product_variants_product_attribute_value_key
    unique (product_id, attribute, value)
);

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row
  execute function public.subscription_set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. plans
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12, 2) not null,
  billing_period text not null,
  min_quantity int not null default 1,
  available_from date,
  available_to date,
  auto_close boolean not null default false,
  closable boolean not null default true,
  pausable boolean not null default true,
  renewable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_price_non_negative check (price >= 0),
  constraint plans_min_quantity_at_least_one check (min_quantity >= 1),
  constraint plans_billing_period_valid
    check (billing_period in ('daily', 'weekly', 'monthly', 'yearly')),
  constraint plans_availability_window_valid check (available_to > available_from)
);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row
  execute function public.subscription_set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. quotation_templates
-- ---------------------------------------------------------------------------
create table if not exists public.quotation_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_id uuid not null references public.plans (id) on delete restrict,
  validity_days int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotation_templates_validity_days_positive check (validity_days > 0)
);

drop trigger if exists quotation_templates_set_updated_at on public.quotation_templates;
create trigger quotation_templates_set_updated_at
  before update on public.quotation_templates
  for each row
  execute function public.subscription_set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. quotation_template_lines
-- ---------------------------------------------------------------------------
create table if not exists public.quotation_template_lines (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.quotation_templates (id) on delete cascade,
  product_id uuid not null,
  variant_id uuid,
  quantity int not null,
  unit_price numeric(12, 2) not null,
  tax_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotation_template_lines_quantity_positive check (quantity > 0),
  constraint quotation_template_lines_unit_price_non_negative check (unit_price >= 0)
);

drop trigger if exists quotation_template_lines_set_updated_at
  on public.quotation_template_lines;
create trigger quotation_template_lines_set_updated_at
  before update on public.quotation_template_lines
  for each row
  execute function public.subscription_set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. subscriptions
-- ---------------------------------------------------------------------------
-- Human-readable numbers look like SUB-000123; the sequence supplies the digits.
create sequence if not exists public.subscription_number_seq;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  number text not null unique
    default ('SUB-' || lpad(nextval('public.subscription_number_seq')::text, 6, '0')),
  -- TODO(member-1): public.profiles is created by the admin-backend
  -- migrations. This reference is intentional and matches the plan.
  customer_id uuid not null references public.profiles (id),
  plan_id uuid not null references public.plans (id) on delete restrict,
  template_id uuid,
  start_date date not null,
  expiry_date date not null,
  payment_terms text not null,
  status text not null default 'draft',
  next_billing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_status_valid
    check (status in ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed')),
  constraint subscriptions_expiry_after_start check (expiry_date > start_date)
);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.subscription_set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. subscription_lines
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_lines (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid,
  quantity int not null,
  unit_price numeric(12, 2) not null,
  tax_id uuid,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_lines_quantity_positive check (quantity > 0),
  constraint subscription_lines_unit_price_non_negative check (unit_price >= 0),
  constraint subscription_lines_amount_non_negative check (amount >= 0)
);

drop trigger if exists subscription_lines_set_updated_at on public.subscription_lines;
create trigger subscription_lines_set_updated_at
  before update on public.subscription_lines
  for each row
  execute function public.subscription_set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. subscription_status_history
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_status_history (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_status_history_from_status_valid
    check (from_status in ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed')),
  constraint subscription_status_history_to_status_valid
    check (to_status in ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'))
);

drop trigger if exists subscription_status_history_set_updated_at
  on public.subscription_status_history;
create trigger subscription_status_history_set_updated_at
  before update on public.subscription_status_history
  for each row
  execute function public.subscription_set_updated_at();
