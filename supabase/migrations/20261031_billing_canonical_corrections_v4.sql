-- ====================================================================
-- Brightloop Migration: 20261031_billing_canonical_corrections_v4.sql
-- Module: Member 3 — Canonical Schema Alignment, Atomic RPCs & Hardened RLS
-- ====================================================================

-- 1. NON-DESTRUCTIVE COLUMN EXTENSIONS (SAFE FOR LIVE PRODUCTION)
-- Extend subscriptions with next_billing_date for canonical scheduling
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ;

-- Extend invoices with optional total_amount and notes for full backward compatibility
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Extend tax_rules with optional code and description
ALTER TABLE public.tax_rules 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Extend payments with optional notes and payment_date
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Extend discount_rules with optional min_purchase_amount, min_quantity, product_id, subscription_id
ALTER TABLE public.discount_rules 
ADD COLUMN IF NOT EXISTS min_purchase_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS product_id UUID,
ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- 2. CANONICAL FOREIGN KEYS (Safe IF NOT EXISTS)
DO $$
BEGIN
  -- Foreign key: invoices.customer_id -> profiles(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_customer_v4') THEN
      ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_customer_v4 FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_payments_customer_v4') THEN
      ALTER TABLE public.payments ADD CONSTRAINT fk_payments_customer_v4 FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;
  END IF;

  -- Foreign key: invoices.subscription_id -> subscriptions(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_subscription_v4') THEN
      ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_subscription_v4 FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 3. CANONICAL PARTIAL UNIQUE INDEX (Idempotent recurring billing)
DROP INDEX IF EXISTS public.uq_invoices_subscription_period;
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_subscription_period
ON public.invoices(subscription_id, billing_period_start)
WHERE subscription_id IS NOT NULL;

-- 4. ATOMIC PAYMENT RECORDING RPC (Row-locking, caller authentication & overpayment prevention)
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_invoice_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_amount NUMERIC(12,2) DEFAULT 0.00,
  p_payment_method TEXT DEFAULT 'card',
  p_transaction_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_invoice RECORD;
  v_payment_id UUID;
  v_new_amount_paid NUMERIC(12,2);
  v_new_amount_due NUMERIC(12,2);
  v_new_status TEXT;
BEGIN
  -- 1. Caller Authentication
  v_caller_id := auth.uid();
  v_caller_role := COALESCE(
    (SELECT role::text FROM public.profiles WHERE id = v_caller_id),
    'customer'
  );

  IF current_user != 'service_role' AND v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to record payments.';
  END IF;

  -- 2. Validation of Amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  -- 3. Acquire row lock FOR UPDATE on invoice
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice with ID % not found.', p_invoice_id;
  END IF;

  -- 4. Customer Isolation Check
  IF current_user != 'service_role' AND v_caller_role NOT IN ('owner', 'admin', 'finance', 'staff', 'support') THEN
    IF v_caller_id != v_invoice.customer_id THEN
      RAISE EXCEPTION 'Unauthorized: You do not have permission to pay an invoice belonging to another customer.';
    END IF;
  END IF;

  -- 5. Invoice Status & Balance Validation
  IF v_invoice.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot record payment against a cancelled invoice.';
  END IF;

  IF v_invoice.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot record payment against an unconfirmed draft invoice.';
  END IF;

  IF v_invoice.amount_due <= 0.00 OR v_invoice.status = 'paid' THEN
    RAISE EXCEPTION 'This invoice is already fully settled. No outstanding balance remaining.';
  END IF;

  IF p_amount > v_invoice.amount_due THEN
    RAISE EXCEPTION 'Overpayment rejected: payment of % exceeds outstanding balance of %.', p_amount, v_invoice.amount_due;
  END IF;

  -- 6. Balances Calculation
  v_new_amount_paid := v_invoice.amount_paid + p_amount;
  v_new_amount_due := GREATEST(0.00, v_invoice.amount_due - p_amount);
  
  IF v_new_amount_due <= 0.00 THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := v_invoice.status;
  END IF;

  -- 7. Insert Payment Ledger Entry
  INSERT INTO public.payments (
    id,
    invoice_id,
    customer_id,
    amount,
    currency,
    payment_method,
    status,
    transaction_reference,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    p_invoice_id,
    COALESCE(p_customer_id, v_invoice.customer_id),
    p_amount,
    v_invoice.currency,
    p_payment_method,
    'succeeded',
    COALESCE(p_transaction_reference, 'TXN_' || upper(p_payment_method) || '_' || substr(gen_random_uuid()::text, 1, 8)),
    now(),
    now()
  )
  RETURNING id INTO v_payment_id;

  -- 8. Update Invoice Balances Atomically
  UPDATE public.invoices
  SET
    amount_paid = v_new_amount_paid,
    amount_due = v_new_amount_due,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'invoice_id', p_invoice_id,
    'amount_paid', v_new_amount_paid,
    'amount_due', v_new_amount_due,
    'status', v_new_status
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_invoice_payment FROM public;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment TO authenticated, service_role;

-- 5. ATOMIC RECURRING BILLING RPC
CREATE OR REPLACE FUNCTION public.generate_subscription_recurring_invoice(
  p_subscription_id UUID,
  p_billing_period_start TIMESTAMPTZ,
  p_billing_period_end TIMESTAMPTZ,
  p_due_date TIMESTAMPTZ,
  p_advanced_next_billing_date TIMESTAMPTZ,
  p_subtotal NUMERIC(12,2),
  p_discount_total NUMERIC(12,2),
  p_tax_total NUMERIC(12,2),
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_max_inv_num INTEGER;
  v_item JSONB;
  v_total NUMERIC(12,2);
BEGIN
  -- 1. Lock subscription row FOR UPDATE
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE id = p_subscription_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription % not found.', p_subscription_id;
  END IF;

  IF v_subscription.status != 'active' THEN
    RAISE EXCEPTION 'Subscription % is not in active state (current status: %).', p_subscription_id, v_subscription.status;
  END IF;

  -- 2. Idempotency Check using the canonical billing_period_start column
  IF EXISTS (
    SELECT 1 FROM public.invoices
    WHERE subscription_id = p_subscription_id
      AND billing_period_start = p_billing_period_start
      AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_PERIOD: Invoice already exists for subscription % and period %.', p_subscription_id, p_billing_period_start;
  END IF;

  -- 3. Calculate total
  v_total := GREATEST(0.00, p_subtotal - p_discount_total + p_tax_total);

  -- 4. Sequential Invoice Number Generation
  SELECT COALESCE(MAX(SUBSTRING(invoice_number FROM 'INV-2026-([0-9]+)')::INTEGER), 20)
  INTO v_max_inv_num
  FROM public.invoices;

  v_invoice_number := 'INV-2026-' || LPAD((v_max_inv_num + 1)::TEXT, 4, '0');
  v_invoice_id := gen_random_uuid();

  -- 5. Insert Invoice
  INSERT INTO public.invoices (
    id,
    invoice_number,
    customer_id,
    subscription_id,
    status,
    currency,
    due_date,
    billing_period_start,
    billing_period_end,
    subtotal,
    discount_amount,
    tax_amount,
    amount_paid,
    amount_due,
    created_at,
    updated_at
  )
  VALUES (
    v_invoice_id,
    v_invoice_number,
    v_subscription.customer_id,
    p_subscription_id,
    'confirmed',
    'INR',
    p_due_date,
    p_billing_period_start,
    p_billing_period_end,
    p_subtotal,
    p_discount_total,
    p_tax_total,
    0.00,
    v_total,
    now(),
    now()
  );

  -- 6. Insert Items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO public.invoice_items (
        id,
        invoice_id,
        description,
        quantity,
        unit_price,
        discount_amount,
        tax_amount,
        total_amount,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        v_invoice_id,
        COALESCE(v_item->>'description', 'Subscription item'),
        COALESCE((v_item->>'quantity')::INTEGER, 1),
        COALESCE((v_item->>'unit_price')::NUMERIC, 0.00),
        COALESCE((v_item->>'discount_amount')::NUMERIC, 0.00),
        COALESCE((v_item->>'tax_amount')::NUMERIC, 0.00),
        COALESCE((v_item->>'total_amount')::NUMERIC, 0.00),
        now()
      );
    END LOOP;
  END IF;

  -- 7. Atomically Advance Subscription Schedule
  UPDATE public.subscriptions
  SET
    next_billing_date = p_advanced_next_billing_date,
    current_period_start = p_billing_period_start,
    current_period_end = p_billing_period_end,
    updated_at = now()
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'subscription_id', p_subscription_id,
    'next_billing_date', p_advanced_next_billing_date
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.generate_subscription_recurring_invoice FROM public;
GRANT EXECUTE ON FUNCTION public.generate_subscription_recurring_invoice TO authenticated, service_role;

-- 6. ATOMIC DISCOUNT INCREMENT RPC
CREATE OR REPLACE FUNCTION public.increment_discount_usage_atomic(
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount RECORD;
BEGIN
  -- Acquire row lock FOR UPDATE on discount rule
  SELECT * INTO v_discount
  FROM public.discount_rules
  WHERE code = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Discount code % not found.', p_code;
  END IF;

  IF NOT v_discount.active THEN
    RAISE EXCEPTION 'Discount code % is inactive.', p_code;
  END IF;

  IF v_discount.max_redemptions IS NOT NULL AND v_discount.times_redeemed >= v_discount.max_redemptions THEN
    RAISE EXCEPTION 'Discount coupon % has reached its maximum usage limit (%).', p_code, v_discount.max_redemptions;
  END IF;

  UPDATE public.discount_rules
  SET
    times_redeemed = times_redeemed + 1,
    updated_at = now()
  WHERE id = v_discount.id;

  RETURN jsonb_build_object(
    'success', true,
    'code', v_discount.code,
    'times_redeemed', v_discount.times_redeemed + 1
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_discount_usage_atomic FROM public;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage_atomic TO authenticated, service_role;

-- 7. PRODUCTION ROW LEVEL SECURITY (RLS) POLICIES
-- Grant table privileges to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.tax_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.discount_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT ON public.tax_rules TO anon;
GRANT SELECT ON public.discount_rules TO anon;

-- Enable RLS
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Public read for reference rules
DROP POLICY IF EXISTS "Allow read on tax_rules" ON public.tax_rules;
CREATE POLICY "Allow read on tax_rules" ON public.tax_rules 
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow read on discount_rules" ON public.discount_rules;
CREATE POLICY "Allow read on discount_rules" ON public.discount_rules 
  FOR SELECT TO public USING (true);

-- Drop permissive policies
DROP POLICY IF EXISTS "Allow authenticated read on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated read on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow authenticated read on payments" ON public.payments;

-- Customer Isolation Policies
DROP POLICY IF EXISTS "Customer view own invoices" ON public.invoices;
CREATE POLICY "Customer view own invoices" ON public.invoices 
  FOR SELECT TO authenticated 
  USING (
    customer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support'))
  );

DROP POLICY IF EXISTS "Customer view own invoice items" ON public.invoice_items;
CREATE POLICY "Customer view own invoice items" ON public.invoice_items 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i 
      WHERE i.id = invoice_items.invoice_id AND (
        i.customer_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support'))
      )
    )
  );

DROP POLICY IF EXISTS "Customer view own payments" ON public.payments;
CREATE POLICY "Customer view own payments" ON public.payments 
  FOR SELECT TO authenticated 
  USING (
    customer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support'))
  );

-- Staff Management Policies
DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
CREATE POLICY "Staff manage invoices" ON public.invoices 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support')));

DROP POLICY IF EXISTS "Staff manage invoice_items" ON public.invoice_items;
CREATE POLICY "Staff manage invoice_items" ON public.invoice_items 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support')));

DROP POLICY IF EXISTS "Staff manage payments" ON public.payments;
CREATE POLICY "Staff manage payments" ON public.payments 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff', 'support')));
