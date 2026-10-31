-- ====================================================================
-- Brightloop Migration: 20261031_billing_corrections_v2.sql
-- Module: Member 3 — Hardened Billing Constraints, RLS & Payment RPC
-- ====================================================================

-- 1. CORRECTION: BILLING PERIOD UNIQUENESS (Partial Unique Index)
-- Drop the broad unique constraint that erroneously treated NULL subscription_id as duplicates
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS uq_subscription_period;

-- Partial unique index: strictly enforces idempotency for recurring subscriptions
-- while permitting multiple ad-hoc/manual invoices without a subscription.
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_subscription_period 
ON public.invoices(subscription_id, period_start) 
WHERE subscription_id IS NOT NULL;

-- 2. CORRECTION: FOREIGN KEY RELATIONSHIPS
-- Coordinating with Member 1 (profiles) and Member 2 (subscriptions, products)
DO $$
BEGIN
  -- Foreign key: invoices.customer_id -> profiles(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_customer') THEN
      ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_payments_customer') THEN
      ALTER TABLE public.payments ADD CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;
  END IF;

  -- Foreign key: invoices.subscription_id -> subscriptions(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoices_subscription') THEN
      ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_subscription FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- Foreign key: invoice_items.product_id -> products(id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_invoice_items_product') THEN
      ALTER TABLE public.invoice_items ADD CONSTRAINT fk_invoice_items_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 3. CORRECTION: REFINED ROW LEVEL SECURITY (RLS) POLICIES
-- Drop broad "USING (true)" policies
DROP POLICY IF EXISTS "Allow authenticated read on tax_rules" ON public.tax_rules;
DROP POLICY IF EXISTS "Allow authenticated read on discounts" ON public.discounts;
DROP POLICY IF EXISTS "Allow authenticated read on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated read on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow authenticated read on payments" ON public.payments;

DROP POLICY IF EXISTS "Allow staff write on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow staff write on invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Allow staff write on payments" ON public.payments;
DROP POLICY IF EXISTS "Allow staff write on tax_rules" ON public.tax_rules;
DROP POLICY IF EXISTS "Allow staff write on discounts" ON public.discounts;

-- Fallback helper for get_user_role() in case Member 1's profile migration has not run yet
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()),
    'customer'
  );
$$;

-- --- INVOICES RLS ---
-- Staff, Finance, and Admins can view all invoices
CREATE POLICY invoices_staff_select ON public.invoices
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'));

-- Customers can only view their own invoices
CREATE POLICY invoices_customer_select_own ON public.invoices
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'customer'
    AND customer_id = auth.uid()
  );

-- Staff and Admins can create and modify invoices
CREATE POLICY invoices_staff_manage ON public.invoices
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'));

-- --- INVOICE ITEMS RLS ---
CREATE POLICY invoice_items_staff_select ON public.invoice_items
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'));

CREATE POLICY invoice_items_customer_select_own ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'customer'
    AND EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.customer_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_staff_manage ON public.invoice_items
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'));

-- --- PAYMENTS RLS ---
CREATE POLICY payments_staff_select ON public.payments
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'));

CREATE POLICY payments_customer_select_own ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'customer'
    AND customer_id = auth.uid()
  );

CREATE POLICY payments_staff_manage ON public.payments
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'))
  WITH CHECK (public.get_user_role() IN ('admin', 'owner', 'finance', 'staff'));

-- --- TAX RULES & DISCOUNTS RLS ---
-- Read-only for all authenticated users so customers can see coupon discounts and tax percentages
CREATE POLICY tax_rules_read_all ON public.tax_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY discounts_read_all ON public.discounts
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Managing taxes and discounts is strictly restricted to Finance & Admins
CREATE POLICY tax_rules_finance_manage ON public.tax_rules
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance'))
  WITH CHECK (public.get_user_role() IN ('admin', 'owner', 'finance'));

CREATE POLICY discounts_finance_manage ON public.discounts
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'owner', 'finance'))
  WITH CHECK (public.get_user_role() IN ('admin', 'owner', 'finance'));

-- 4. DATABASE RPC: ATOMIC PAYMENT RECORDING WITH ROW LOCKING
-- Guarantees race-condition prevention, overpayment rejection, and balance deduction in a single transaction.
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
AS $$
DECLARE
  v_invoice RECORD;
  v_payment_id UUID;
  v_new_amount_paid NUMERIC(12,2);
  v_new_amount_due NUMERIC(12,2);
  v_new_status TEXT;
BEGIN
  -- 1. Validation
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  -- 2. Lock invoice row for update (prevents concurrent overpayment)
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice with ID % not found.', p_invoice_id;
  END IF;

  IF v_invoice.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot record payment against a cancelled invoice.';
  END IF;

  IF v_invoice.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot record payment against an unconfirmed draft invoice.';
  END IF;

  IF p_amount > v_invoice.amount_due THEN
    RAISE EXCEPTION 'Overpayment rejected: payment of % exceeds outstanding balance of %.', p_amount, v_invoice.amount_due;
  END IF;

  -- 3. Calculate new balances
  v_new_amount_paid := v_invoice.amount_paid + p_amount;
  v_new_amount_due := v_invoice.total_amount - v_new_amount_paid;
  
  IF v_new_amount_due <= 0.00 THEN
    v_new_status := 'paid';
    v_new_amount_due := 0.00;
  ELSE
    v_new_status := v_invoice.status;
  END IF;

  -- 4. Insert payment transaction
  INSERT INTO public.payments (
    invoice_id,
    customer_id,
    amount,
    currency,
    payment_method,
    status,
    payment_date,
    transaction_reference,
    notes
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
    p_notes
  )
  RETURNING id INTO v_payment_id;

  -- 5. Update invoice
  UPDATE public.invoices
  SET 
    amount_paid = v_new_amount_paid,
    amount_due = v_new_amount_due,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_invoice_id;

  -- 6. Return response
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

