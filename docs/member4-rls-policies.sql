-- ============================================================================
-- Brightloop – Supabase Row Level Security Policies
-- Member 4 (Dashboard / Portal) | Step 9: Access Control Hardening
--
-- Author : Member 4 (feature/dashboard-ai)
-- Status : PROPOSED — for Member 1 (feature/admin-backend) to review and merge
-- Applies to : PostgreSQL / Supabase (uses auth.jwt() and auth.uid())
--
-- Contract:
--   • Customers can SELECT only rows that belong to their own customer record.
--   • Admin / Staff can SELECT all rows (read-only via dashboard & reports).
--   • Only Members 1 and 2 (server-side service roles) should INSERT / UPDATE /
--     DELETE — no RLS policies are defined for those operations here; they are
--     controlled by the service-role key and NOT exposed to the browser client.
-- ============================================================================

-- ─── HELPER: expose app_metadata.role from the JWT ────────────────────────────
-- Member 1 must ensure the Supabase Auth hook or trigger stores the user role
-- into auth.users.app_metadata as: { "role": "admin" | "staff" | "customer" }
-- The customer record ID must be stored as: { "customer_id": "<uuid>" }
-- Both are available inside RLS policies via auth.jwt() -> 'app_metadata'.
-- ─────────────────────────────────────────────────────────────────────────────


-- ============================================================================
-- 1. SUBSCRIPTIONS
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Customers can only read their own subscriptions
CREATE POLICY "portal_customers_own_subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'customer'
    AND customer_id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
  );

-- Admin and Staff can read all subscriptions
CREATE POLICY "admin_staff_read_all_subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff')
  );


-- ============================================================================
-- 2. SUBSCRIPTION_LINES
-- ============================================================================

ALTER TABLE subscription_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_customers_own_subscription_lines"
  ON subscription_lines
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions
      WHERE customer_id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
    )
  );

CREATE POLICY "admin_staff_read_all_subscription_lines"
  ON subscription_lines
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff')
  );


-- ============================================================================
-- 3. INVOICES
-- ============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_customers_own_invoices"
  ON invoices
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'customer'
    AND customer_id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
  );

CREATE POLICY "admin_staff_read_all_invoices"
  ON invoices
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff')
  );


-- ============================================================================
-- 4. INVOICE_LINES
-- ============================================================================

ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_customers_own_invoice_lines"
  ON invoice_lines
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE customer_id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
    )
  );

CREATE POLICY "admin_staff_read_all_invoice_lines"
  ON invoice_lines
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff')
  );


-- ============================================================================
-- 5. PAYMENTS
-- ============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_customers_own_payments"
  ON payments
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'customer'
    AND customer_id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
  );

CREATE POLICY "admin_staff_read_all_payments"
  ON payments
  FOR SELECT
  USING (
    auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff')
  );


-- ============================================================================
-- RECOMMENDED INDEXES (performance — also see docs/member4-db-requests.md)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id  ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status       ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id       ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status            ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date          ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id       ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id        ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_lines_sub_id  ON subscription_lines(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id   ON invoice_lines(invoice_id);

