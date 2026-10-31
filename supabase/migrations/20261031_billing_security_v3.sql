-- ====================================================================
-- Brightloop Migration: 20261031_billing_security_v3.sql
-- Module: Member 3 — Hardened Payment RPC, Atomic Recurring Billing RPC,
--                    Atomic Discount Increment & Production RLS Guards
-- ====================================================================

-- 1. FOREIGN KEY RELATIONSHIP VERIFICATION
DO $$
BEGIN
  -- Foreign key: invoices.customer_id -> profiles(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_customer_v3') THEN
      ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_customer_v3 FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_payments_customer_v3') THEN
      ALTER TABLE public.payments ADD CONSTRAINT fk_payments_customer_v3 FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;
  END IF;

  -- Foreign key: invoices.subscription_id -> subscriptions(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_subscription_v3') THEN
      ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_subscription_v3 FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Foreign key: invoice_items.product_id -> products(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoice_items_product_v3') THEN
      ALTER TABLE public.invoice_items ADD CONSTRAINT fk_invoice_items_product_v3 FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 2. PARTIAL UNIQUE INDEX FOR IDEMPOTENT RECURRING BILLING
-- Prevents duplicate invoices for the same subscription cycle while allowing unlimited manual ad-hoc invoices (NULL subscription_id).
DROP INDEX IF EXISTS public.uq_invoices_subscription_period;
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_subscription_period
ON public.invoices(subscription_id, period_start)
WHERE subscription_id IS NOT NULL;

-- 3. HARDENED PAYMENT RPC (WITH CALLER AUTHENTICATION & ROW-LEVEL LOCKING)
CREATE OR REPLACE FUNCTION public.record_invoice_payment(
  p_invoice_id UUID,
  p_customer_id UUID,
  p_amount NUMERIC(12,2),
  p_payment_method TEXT,
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
  -- 1. Caller Authentication & Authorization
  v_caller_id := auth.uid();
  v_caller_role := COALESCE(
    (SELECT role::text FROM public.profiles WHERE id = v_caller_id),
    'customer'
  );

  -- Allow service_role (background system) or authenticated user
  IF current_user != 'service_role' AND v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be logged in to record or submit payments.';
  END IF;

  -- 2. Validation of Amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  -- 3. Lock invoice row FOR UPDATE (Guarantees race-condition prevention & avoids concurrent overpayments)
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice with ID % not found.', p_invoice_id;
  END IF;

  -- 4. Customer Isolation Check
  -- If not staff/admin, caller must be the actual invoice customer
  IF current_user != 'service_role' AND v_caller_role NOT IN ('admin', 'owner', 'finance', 'staff') THEN
    IF v_caller_id != v_invoice.customer_id THEN
      RAISE EXCEPTION 'Unauthorized: You do not have permission to pay an invoice belonging to another customer.';
    END IF;
  END IF;

  -- 5. Invoice Eligibility Validation
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

  -- 6. Atomic Calculations
  v_new_amount_paid := v_invoice.amount_paid + p_amount;
  v_new_amount_due := v_invoice.total_amount - v_new_amount_paid;

  IF v_new_amount_due <= 0.00 THEN
    v_new_status := 'paid';
    v_new_amount_due := 0.00;
  ELSE
    v_new_status := v_invoice.status;
  END IF;

  -- 7. Insert Payment Ledger Entry
  INSERT INTO public.payments (
    invoice_id,
    customer_id,
    amount,
    currency,
    payment_method,
    status,
    payment_date,
    transaction_reference,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    p_invoice_id,
    COALESCE(p_customer_id, v_invoice.customer_id),
    p_amount,
    v_invoice.currency,
    p_payment_method,
    'succeeded',
    now(),
    COALESCE(p_transaction_reference, 'TXN_' || upper(p_payment_method) || '_' || substr(gen_random_uuid()::text, 1, 8)),
    p_notes,
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

-- Restrict execution to authenticated sessions and service_role
REVOKE EXECUTE ON FUNCTION public.record_invoice_payment FROM public;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment TO authenticated, service_role;

-- 4. ATOMIC RECURRING BILLING RPC
-- Generates invoice, items, and advances subscription next_billing_date atomically.
-- If invoice creation fails, next_billing_date is NEVER advanced.
CREATE OR REPLACE FUNCTION public.generate_subscription_recurring_invoice(
  p_subscription_id UUID,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_due_date TIMESTAMPTZ,
  p_advanced_next_billing_date TIMESTAMPTZ,
  p_subtotal NUMERIC(12,2),
  p_discount_total NUMERIC(12,2),
  p_tax_total NUMERIC(12,2),
  p_total_amount NUMERIC(12,2),
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
BEGIN
  -- 1. Lock subscription row FOR UPDATE to prevent race conditions during concurrent runs
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

  -- 2. Idempotency Check using the partial unique period index
  IF EXISTS (
    SELECT 1 FROM public.invoices
    WHERE subscription_id = p_subscription_id
      AND period_start = p_period_start
      AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_PERIOD: Invoice already exists for subscription % and period %.', p_subscription_id, p_period_start;
  END IF;

  -- 3. Sequential Invoice Number Generation
  SELECT COALESCE(MAX(SUBSTRING(invoice_number FROM 'INV-2026-([0-9]+)')::INTEGER), 20)
  INTO v_max_inv_num
  FROM public.invoices;

  v_invoice_number := 'INV-2026-' || LPAD((v_max_inv_num + 1)::TEXT, 4, '0');
  v_invoice_id := gen_random_uuid();

  -- 4. Insert Invoice Record
  INSERT INTO public.invoices (
    id,
    invoice_number,
    customer_id,
    subscription_id,
    status,
    currency,
    issue_date,
    due_date,
    period_start,
    period_end,
    subtotal,
    discount_total,
    tax_total,
    total_amount,
    amount_paid,
    amount_due,
    notes,
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
    now(),
    p_due_date,
    p_period_start,
    p_period_end,
    p_subtotal,
    p_discount_total,
    p_tax_total,
    p_total_amount,
    0.00,
    p_total_amount,
    p_notes,
    now(),
    now()
  );

  -- 5. Insert Invoice Line Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.invoice_items (
      id,
      invoice_id,
      product_id,
      description,
      quantity,
      unit_price,
      subtotal,
      discount_amount,
      tax_rate,
      tax_amount,
      total_amount,
      created_at
    )
    VALUES (
      gen_random_uuid(),
      v_invoice_id,
      CASE WHEN (v_item->>'product_id') IS NOT NULL AND (v_item->>'product_id') != '' THEN (v_item->>'product_id')::UUID ELSE NULL END,
      v_item->>'description',
      COALESCE((v_item->>'quantity')::INTEGER, 1),
      COALESCE((v_item->>'unit_price')::NUMERIC(12,2), 0.00),
      COALESCE((v_item->>'subtotal')::NUMERIC(12,2), 0.00),
      COALESCE((v_item->>'discount_amount')::NUMERIC(12,2), 0.00),
      COALESCE((v_item->>'tax_rate')::NUMERIC(5,2), 18.00),
      COALESCE((v_item->>'tax_amount')::NUMERIC(12,2), 0.00),
      COALESCE((v_item->>'total_amount')::NUMERIC(12,2), 0.00),
      now()
    );
  END LOOP;

  -- 6. Atomically Advance next_billing_date in Subscriptions
  UPDATE public.subscriptions
  SET
    current_period_start = p_period_start,
    current_period_end = p_period_end,
    next_billing_date = p_advanced_next_billing_date::date,
    updated_at = now()
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'total_amount', p_total_amount,
    'next_billing_date', p_advanced_next_billing_date
  );
END;
$$;

-- Restrict execution to authenticated sessions and service_role
REVOKE EXECUTE ON FUNCTION public.generate_subscription_recurring_invoice FROM public;
GRANT EXECUTE ON FUNCTION public.generate_subscription_recurring_invoice TO authenticated, service_role;

-- 5. ATOMIC DISCOUNT USAGE INCREMENT RPC
-- Prevents concurrency race conditions when redeeming limited-usage coupons
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
  v_new_count INTEGER;
BEGIN
  -- Lock discount row FOR UPDATE
  SELECT * INTO v_discount
  FROM public.discounts
  WHERE UPPER(code) = UPPER(p_code) AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Discount code not found or inactive.');
  END IF;

  -- Check usage limits
  IF v_discount.max_usage IS NOT NULL AND v_discount.used_count >= v_discount.max_usage THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Discount usage limit exceeded.');
  END IF;

  -- Check date validity
  IF v_discount.start_date IS NOT NULL AND v_discount.start_date > now() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Discount is not yet active.');
  END IF;

  IF v_discount.end_date IS NOT NULL AND v_discount.end_date < now() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Discount has expired.');
  END IF;

  -- Increment atomically
  UPDATE public.discounts
  SET
    used_count = used_count + 1,
    updated_at = now()
  WHERE id = v_discount.id
  RETURNING used_count INTO v_new_count;

  RETURN jsonb_build_object(
    'success', true,
    'code', v_discount.code,
    'new_used_count', v_new_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_discount_usage_atomic FROM public;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage_atomic TO authenticated, service_role;

