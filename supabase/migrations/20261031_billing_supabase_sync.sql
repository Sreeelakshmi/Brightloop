-- ====================================================================
-- Brightloop Migration: 20261031_billing_supabase_sync.sql
-- Module: Member 3 — Schema Synchronization & Access Grants
-- ====================================================================

-- 1. EXTEND EXISTING LIVE TABLES NON-DESTRUCTIVELY
-- Add canonical next_billing_date to subscriptions if not already present
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS next_billing_date date;

-- Add code to tax_rules if not already present
ALTER TABLE public.tax_rules 
ADD COLUMN IF NOT EXISTS code text;

-- Add total_amount to invoices if not already present
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS total_amount numeric(12,2);

-- 2. CREATE PARTIAL UNIQUE INDEX FOR RECURRING BILLING IDEMPOTENCY
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_subscription_period 
ON public.invoices(subscription_id, billing_period_start) 
WHERE subscription_id IS NOT NULL;

-- 3. PERMISSIONS AND GRANTS
-- Grant table privileges to authenticated users so PostgREST allows RLS policy evaluation
GRANT SELECT, INSERT, UPDATE ON public.tax_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.discount_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invoice_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT ON public.tax_rules TO anon;
GRANT SELECT ON public.discount_rules TO anon;

-- 4. ROW LEVEL SECURITY REFINEMENT
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Read policies for public reference data
DROP POLICY IF EXISTS "Allow read on tax_rules" ON public.tax_rules;
CREATE POLICY "Allow read on tax_rules" ON public.tax_rules 
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow read on discount_rules" ON public.discount_rules;
CREATE POLICY "Allow read on discount_rules" ON public.discount_rules 
  FOR SELECT TO public USING (true);

-- Customer isolation: customers can only view their own invoices and payments
DROP POLICY IF EXISTS "Customer view own invoices" ON public.invoices;
CREATE POLICY "Customer view own invoices" ON public.invoices 
  FOR SELECT TO authenticated 
  USING (
    customer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff'))
  );

DROP POLICY IF EXISTS "Customer view own invoice items" ON public.invoice_items;
CREATE POLICY "Customer view own invoice items" ON public.invoice_items 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i 
      WHERE i.id = invoice_items.invoice_id AND (
        i.customer_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff'))
      )
    )
  );

DROP POLICY IF EXISTS "Customer view own payments" ON public.payments;
CREATE POLICY "Customer view own payments" ON public.payments 
  FOR SELECT TO authenticated 
  USING (
    customer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff'))
  );

-- Staff write policies
DROP POLICY IF EXISTS "Staff manage invoices" ON public.invoices;
CREATE POLICY "Staff manage invoices" ON public.invoices 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff')));

DROP POLICY IF EXISTS "Staff manage invoice_items" ON public.invoice_items;
CREATE POLICY "Staff manage invoice_items" ON public.invoice_items 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff')));

DROP POLICY IF EXISTS "Staff manage payments" ON public.payments;
CREATE POLICY "Staff manage payments" ON public.payments 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'finance', 'staff')));

