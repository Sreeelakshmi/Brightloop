-- ==============================================================================
-- BRIGHTLOOP SUBSCRIPTION MANAGEMENT SYSTEM
-- Migration: 20261031121000_initial_schema.sql (Production Verified)
--
-- Security & Architecture Highlights:
--   1. Correct creation order: Tables created before functions/policies that reference them.
--   2. Strict Row Level Security (RLS) enabled on all public tables.
--   3. Functions hardened with `SECURITY DEFINER` and `SET search_path = ''`.
--   4. Trigger execution privileges granted to authenticated/service roles.
--   5. Customers restricted from modifying quotations (acceptance via secure RPC).
--   6. Customers restricted from inserting payments (server-side webhook/action only).
--   7. Profile update trigger preventing role, email, org, or metadata tampering.
--   8. Secure first-admin bootstrap procedure locked down once an admin exists.
--   9. Relational integrity triggers preventing cross-customer entity assignment.
--  10. Partial unique index for duplicate-invoice prevention on recurring cycles.
-- ==============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. BASE UTILITY FUNCTIONS
-- ==============================================================================

-- Timestamp updater
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- ==============================================================================
-- 2. ORGANIZATIONS & PROFILES (User & Staff Management)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
  billing_address JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- RLS Role Check Helpers (Created AFTER public.profiles exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$;

-- Trigger: Always force public signups to 'customer' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    pg_catalog.coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    'customer' -- Explicitly hardcoded; client-provided roles are ignored
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Restrict customer updates to safe profile fields only
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Service Role, DBA, and Admins have unconstrained update rights
  IF public.is_admin() OR pg_catalog.current_setting('role', true) IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Allow first-admin bootstrap execution within bootstrap_first_admin()
  IF pg_catalog.current_setting('brightloop.allow_bootstrap', true) = 'true' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Authenticated customer self-update validation
  IF auth.uid() = OLD.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your assigned role.';
    END IF;

    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Access Denied: You cannot modify your organization assignment.';
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Access Denied: Email identity changes must be verified through Supabase Auth.';
    END IF;

    IF NEW.metadata IS DISTINCT FROM OLD.metadata THEN
      RAISE EXCEPTION 'Access Denied: Privileged metadata cannot be modified directly.';
    END IF;

    -- Allowed safe fields: full_name, avatar_url, phone, billing_address
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Access Denied: Unauthorized profile update.';
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_profile_update ON public.profiles;
CREATE TRIGGER trg_validate_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_update();

-- ==============================================================================
-- 3. FIRST-ADMIN BOOTSTRAP & STAFF ROLE MANAGEMENT
-- ==============================================================================

-- Secure first-admin bootstrap: Can only run ONCE when zero admins exist
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id UUID;
  clean_email TEXT;
BEGIN
  clean_email := pg_catalog.lower(pg_catalog.trim(target_email));

  -- Lockout check: if ANY admin exists, bootstrap is permanently disabled
  IF EXISTS (
    SELECT 1 FROM public.profiles WHERE role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Bootstrap Locked: An administrator already exists. Use set_user_role instead.';
  END IF;

  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE pg_catalog.lower(email) = clean_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Profile for "%" not found. Register the user via standard auth first before bootstrapping.', target_email;
  END IF;

  -- Set session flag for the duration of this transaction to pass validate_profile_update trigger
  PERFORM pg_catalog.set_config('brightloop.allow_bootstrap', 'true', true);

  UPDATE public.profiles
  SET role = 'admin', updated_at = pg_catalog.now()
  WHERE id = target_user_id;

  RETURN 'Successfully promoted ' || target_email || ' to first administrator.';
END;
$$;

-- Admin-only staff/admin role management
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can modify user roles.';
  END IF;

  IF new_role NOT IN ('admin', 'staff', 'customer') THEN
    RAISE EXCEPTION 'Invalid role: %. Permitted roles: admin, staff, customer.', new_role;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User profile with ID % not found.', target_user_id;
  END IF;

  UPDATE public.profiles
  SET role = new_role, updated_at = pg_catalog.now()
  WHERE id = target_user_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'role', new_role
  );
END;
$$;

-- ==============================================================================
-- 4. PRODUCTS, VARIANTS & PLANS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'quarter', 'year')),
  interval_count INTEGER NOT NULL DEFAULT 1 CHECK (interval_count > 0),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  trial_days INTEGER NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- ==============================================================================
-- 5. TAX RULES & DISCOUNT RULES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country VARCHAR(2),
  region TEXT,
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  is_inclusive BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE IF NOT EXISTS public.discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  currency VARCHAR(3) CHECK (currency IS NULL OR length(currency) = 3),
  max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
  times_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (times_redeemed >= 0),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- ==============================================================================
-- 6. QUOTATIONS & QUOTATION ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  notes TEXT,
  valid_until TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Secure RPC: Customer acceptance of quotation (Created AFTER public.quotations exists)
CREATE OR REPLACE FUNCTION public.accept_quotation(target_quotation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_quote public.quotations%ROWTYPE;
BEGIN
  SELECT * INTO target_quote
  FROM public.quotations
  WHERE id = target_quotation_id;

  IF target_quote.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found.';
  END IF;

  -- Authorization check: Caller must be the assigned customer or a staff member
  IF target_quote.customer_id != auth.uid() AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access Denied: You do not own this quotation.';
  END IF;

  IF target_quote.status != 'sent' THEN
    RAISE EXCEPTION 'Invalid State: Only quotations in "sent" status can be accepted (current: %).', target_quote.status;
  END IF;

  IF target_quote.valid_until < pg_catalog.now() THEN
    UPDATE public.quotations
    SET status = 'expired', updated_at = pg_catalog.now()
    WHERE id = target_quotation_id;
    RAISE EXCEPTION 'Quotation has expired on %.', target_quote.valid_until;
  END IF;

  UPDATE public.quotations
  SET status = 'accepted', updated_at = pg_catalog.now()
  WHERE id = target_quotation_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'quotation_id', target_quotation_id,
    'status', 'accepted'
  );
END;
$$;

-- Secure RPC: Customer rejection of quotation
CREATE OR REPLACE FUNCTION public.reject_quotation(target_quotation_id UUID, rejection_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_quote public.quotations%ROWTYPE;
BEGIN
  SELECT * INTO target_quote
  FROM public.quotations
  WHERE id = target_quotation_id;

  IF target_quote.id IS NULL THEN
    RAISE EXCEPTION 'Quotation not found.';
  END IF;

  IF target_quote.customer_id != auth.uid() AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access Denied: You do not own this quotation.';
  END IF;

  IF target_quote.status != 'sent' THEN
    RAISE EXCEPTION 'Invalid State: Only quotations in "sent" status can be rejected (current: %).', target_quote.status;
  END IF;

  UPDATE public.quotations
  SET status = 'rejected',
      notes = pg_catalog.coalesce(notes || E'\n[Rejection Note]: ', '[Rejection Note]: ') || pg_catalog.coalesce(rejection_reason, 'No reason provided'),
      updated_at = pg_catalog.now()
  WHERE id = target_quotation_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'quotation_id', target_quotation_id,
    'status', 'rejected'
  );
END;
$$;

-- ==============================================================================
-- 7. SUBSCRIPTIONS & SUBSCRIPTION ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Integrity Trigger: Subscription customer_id must match Quotation customer_id
CREATE OR REPLACE FUNCTION public.validate_subscription_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.quotation_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.quotations
      WHERE id = NEW.quotation_id AND customer_id = NEW.customer_id
    ) THEN
      RAISE EXCEPTION 'Integrity Error: Subscription customer_id must match Quotation customer_id.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_subscription_ownership ON public.subscriptions;
CREATE TRIGGER trg_validate_subscription_ownership
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_ownership();

CREATE TABLE IF NOT EXISTS public.subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- ==============================================================================
-- 8. INVOICES & INVOICE ITEMS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  amount_due NUMERIC(12, 2) NOT NULL CHECK (amount_due >= 0),
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
  due_date TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Integrity Trigger: Invoice customer_id must match Subscription customer_id
CREATE OR REPLACE FUNCTION public.validate_invoice_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.subscription_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = NEW.subscription_id AND customer_id = NEW.customer_id
    ) THEN
      RAISE EXCEPTION 'Integrity Error: Invoice customer_id must match Subscription customer_id.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_invoice_ownership ON public.invoices;
CREATE TRIGGER trg_validate_invoice_ownership
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.validate_invoice_ownership();

-- Duplicate-Invoice Prevention Index: Ensures exactly one invoice per recurring cycle
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_subscription_period
  ON public.invoices (subscription_id, billing_period_start, billing_period_end)
  WHERE subscription_id IS NOT NULL
    AND billing_period_start IS NOT NULL
    AND billing_period_end IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- ==============================================================================
-- 9. PAYMENTS & TRANSACTIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  transaction_reference TEXT UNIQUE,
  payment_method TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (length(currency) = 3),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

-- Integrity Trigger: Payment customer_id must match Invoice customer_id
CREATE OR REPLACE FUNCTION public.validate_payment_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.invoices
    WHERE id = NEW.invoice_id AND customer_id = NEW.customer_id
  ) THEN
    RAISE EXCEPTION 'Integrity Error: Payment customer_id must match Invoice customer_id.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_payment_ownership ON public.payments;
CREATE TRIGGER trg_validate_payment_ownership
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.validate_payment_ownership();

-- Security Trigger: Prevent unauthorized payment success markings and enforce financial immutability
CREATE OR REPLACE FUNCTION public.validate_payment_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Enforce that payments can only be marked 'succeeded' by authorized server-side operations
  IF NEW.status = 'succeeded' THEN
    -- Must have a valid transaction_reference from the payment gateway
    IF NEW.transaction_reference IS NULL OR pg_catalog.trim(NEW.transaction_reference) = '' THEN
      RAISE EXCEPTION 'Payment Validation Error: Succeeded payments must have a valid transaction_reference from the payment gateway.';
    END IF;

    -- Block unauthorized client-side updates from directly setting 'succeeded'
    -- Permitted roles: service_role (payment webhooks / server actions) and postgres (DBA console)
    IF pg_catalog.current_setting('role', true) NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
      -- If invoked by authenticated staff, require the authorized server payment processor flag
      IF NOT (public.is_staff() AND pg_catalog.current_setting('brightloop.authorized_payment_processor', true) = 'true') THEN
        RAISE EXCEPTION 'Access Denied: Payment success confirmation must be performed by the authorized server-side payment processor.';
      END IF;
    END IF;
  END IF;

  -- Ensure settled payments are immutable: amount, currency, and invoice_id cannot be tampered with
  IF TG_OP = 'UPDATE' AND OLD.status IN ('succeeded', 'refunded') THEN
    IF NEW.amount IS DISTINCT FROM OLD.amount OR
       NEW.currency IS DISTINCT FROM OLD.currency OR
       NEW.invoice_id IS DISTINCT FROM OLD.invoice_id THEN
      RAISE EXCEPTION 'Immutable Payment: Financial details (amount, currency, invoice) of a settled payment cannot be modified.';
    END IF;

    -- A succeeded payment can only transition to 'refunded'
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'refunded' THEN
      RAISE EXCEPTION 'Invalid State Transition: A settled payment can only transition to "refunded" (attempted: %).', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_payment_transition ON public.payments;
CREATE TRIGGER trg_validate_payment_transition
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.validate_payment_transition();

-- ==============================================================================
-- 10. UPDATED_AT TRIGGERS FOR ALL TABLES
-- ==============================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'organizations', 'profiles', 'products', 'product_variants', 'plans',
        'tax_rules', 'discount_rules', 'quotations', 'subscriptions',
        'subscription_items', 'invoices', 'payments'
      )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
      CREATE TRIGGER trg_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END;
$$;

-- ==============================================================================
-- 11. INDEXES FOR PERFORMANCE & CONCURRENCY
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_plans_product_active ON public.plans(product_id, active);
CREATE INDEX IF NOT EXISTS idx_tax_rules_country_region ON public.tax_rules(country, region) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_discount_rules_code ON public.discount_rules(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_quotations_customer_status ON public.quotations(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_status ON public.subscriptions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription ON public.subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON public.invoices(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_status ON public.payments(customer_id, status);

-- ==============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles viewable by staff or self"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_staff());

CREATE POLICY "Users can update their own safe profile fields"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- ORGANIZATIONS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Organizations viewable by organization members or staff"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    public.is_staff() OR
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Organizations manageable by admins"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- PRODUCTS, VARIANTS & PLANS RLS (Public Read Catalog, Staff Managed)
-- ------------------------------------------------------------------------------
CREATE POLICY "Active products viewable by everyone"
  ON public.products FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Products manageable by staff"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Active variants viewable by everyone"
  ON public.product_variants FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Variants manageable by staff"
  ON public.product_variants FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Active plans viewable by everyone"
  ON public.plans FOR SELECT
  USING (active = true OR public.is_staff());

CREATE POLICY "Plans manageable by staff"
  ON public.plans FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- TAX & DISCOUNT RULES RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Active tax rules viewable by authenticated users"
  ON public.tax_rules FOR SELECT
  TO authenticated
  USING (active = true OR public.is_staff());

CREATE POLICY "Tax rules manageable by staff"
  ON public.tax_rules FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Active discount rules viewable by authenticated users"
  ON public.discount_rules FOR SELECT
  TO authenticated
  USING (active = true OR public.is_staff());

CREATE POLICY "Discount rules manageable by staff"
  ON public.discount_rules FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- QUOTATIONS & QUOTATION ITEMS RLS (Customer Read Only, Staff Managed)
-- ------------------------------------------------------------------------------
CREATE POLICY "Quotations viewable by customer owner or staff"
  ON public.quotations FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_staff());

-- Customers cannot directly INSERT, UPDATE, or DELETE quotations
CREATE POLICY "Quotations manageable by staff only"
  ON public.quotations FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Quotation items viewable by customer owner or staff"
  ON public.quotation_items FOR SELECT
  TO authenticated
  USING (
    public.is_staff() OR
    quotation_id IN (SELECT id FROM public.quotations WHERE customer_id = auth.uid())
  );

CREATE POLICY "Quotation items manageable by staff only"
  ON public.quotation_items FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- SUBSCRIPTIONS & SUBSCRIPTION ITEMS RLS (Customer Read Only, Staff Managed)
-- ------------------------------------------------------------------------------
CREATE POLICY "Subscriptions viewable by customer owner or staff"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_staff());

CREATE POLICY "Subscriptions manageable by staff only"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Subscription items viewable by customer owner or staff"
  ON public.subscription_items FOR SELECT
  TO authenticated
  USING (
    public.is_staff() OR
    subscription_id IN (SELECT id FROM public.subscriptions WHERE customer_id = auth.uid())
  );

CREATE POLICY "Subscription items manageable by staff only"
  ON public.subscription_items FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- INVOICES & INVOICE ITEMS RLS (Customer Read Only, Staff Managed)
-- ------------------------------------------------------------------------------
CREATE POLICY "Invoices viewable by customer owner or staff"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_staff());

CREATE POLICY "Invoices manageable by staff only"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "Invoice items viewable by customer owner or staff"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (
    public.is_staff() OR
    invoice_id IN (SELECT id FROM public.invoices WHERE customer_id = auth.uid())
  );

CREATE POLICY "Invoice items manageable by staff only"
  ON public.invoice_items FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ------------------------------------------------------------------------------
-- PAYMENTS RLS (Customer Read Only, Staff & Server Managed)
-- ------------------------------------------------------------------------------
CREATE POLICY "Payments viewable by customer owner or staff"
  ON public.payments FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR public.is_staff());

-- Customer direct INSERT removed. Payments must be recorded via verified server-side logic
CREATE POLICY "Payments manageable by staff only"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ==============================================================================
-- 13. RESTRICTED FUNCTION EXECUTION & SCHEMA PERMISSIONS
-- ==============================================================================

-- Revoke default public execution across all functions in public schema
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Essential Trigger Functions Execution Grants:
-- Required so that statements triggering them (signup, profile updates, ownership checks) do not fail
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.validate_profile_update() TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.validate_subscription_ownership() TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.validate_invoice_ownership() TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.validate_payment_ownership() TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.validate_payment_transition() TO authenticated, service_role, postgres;

-- RLS Helper Functions (anon needs is_staff() for evaluating public catalog policies)
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role, postgres;

-- Application RPCs for authenticated users
GRANT EXECUTE ON FUNCTION public.accept_quotation(UUID) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.reject_quotation(UUID, TEXT) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO authenticated, service_role, postgres;

-- Restricted First-Admin Bootstrap: ONLY executable by trusted DBA / backend service role
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(TEXT) TO service_role, postgres;

-- Schema & Table Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Service role has full unconstrained access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Public read for active catalog
GRANT SELECT ON public.products, public.product_variants, public.plans TO anon;

-- Authenticated permissions (further restricted by RLS policies)
GRANT SELECT ON public.products, public.product_variants, public.plans TO authenticated;
GRANT SELECT ON public.tax_rules, public.discount_rules TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.quotations, public.quotation_items TO authenticated;
GRANT SELECT ON public.subscriptions, public.subscription_items TO authenticated;
GRANT SELECT ON public.invoices, public.invoice_items TO authenticated;
GRANT SELECT ON public.payments TO authenticated;

-- Staff modification grants (RLS policy enforces is_staff() = true)
GRANT INSERT, UPDATE, DELETE ON public.products, public.product_variants, public.plans TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tax_rules, public.discount_rules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quotations, public.quotation_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subscriptions, public.subscription_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.invoices, public.invoice_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
