# Member 4 (Frontend Lead + DevOps) Database Requests & RPC Architecture

**Target**: Member 1 (Database Lead / Backend)  
**Author**: Member 4 (`feature/dashboard-portal`)  
**Context**: To ensure sub-100ms dashboard telemetry loading and avoid pulling thousands of rows into client/edge JavaScript runtimes, Member 4 requests the following PostgreSQL views, stored procedures (RPCs), and performance indexes.

---

## 1. Architectural Principles

1. **Server-Side Aggregations**: KPI sums, overdue counts, and cohort metrics must execute within PostgreSQL query planner, returning a single scalar/JSON object to the frontend.
2. **Indexed Pagination**: Telemetry tables and reports use `LIMIT` / `OFFSET` (or keyset pagination) with total count estimation.
3. **No Direct Schema Changes by Member 4**: Per team rules, Member 4 proposes these SQL definitions for Member 1 to review, modify, and migrate.

---

## 2. Recommended PostgreSQL Stored Procedures (RPCs)

### 2.1 `get_dashboard_kpis`
Calculates top-line telemetry indicators for the Admin Revenue Overview.

```sql
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_plan_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_revenue NUMERIC := 0;
  v_active_subs INT := 0;
  v_outstanding NUMERIC := 0;
  v_overdue_count INT := 0;
  v_mrr NUMERIC := 0;
  v_arr NUMERIC := 0;
  v_collection_rate NUMERIC := 0;
BEGIN
  -- 1. Active Subscriptions Count & MRR
  SELECT 
    COUNT(*),
    COALESCE(SUM(
      CASE 
        WHEN p.billing_cycle = 'annual' THEN p.amount / 12.0
        WHEN p.billing_cycle = 'quarterly' THEN p.amount / 3.0
        ELSE p.amount
      END
    ), 0)
  INTO v_active_subs, v_mrr
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.status = 'active'
    AND (p_customer_id IS NULL OR s.customer_id = p_customer_id)
    AND (p_plan_id IS NULL OR s.plan_id = p_plan_id);

  v_arr := v_mrr * 12.0;

  -- 2. Total Collected Revenue
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_revenue
  FROM payments pay
  WHERE pay.status = 'succeeded'
    AND (p_start_date IS NULL OR pay.payment_date >= p_start_date)
    AND (p_end_date IS NULL OR pay.payment_date <= p_end_date)
    AND (p_customer_id IS NULL OR pay.customer_id = p_customer_id);

  -- 3. Outstanding Payments & Overdue Invoices
  SELECT 
    COALESCE(SUM(balance), 0),
    COUNT(*)
  INTO v_outstanding, v_overdue_count
  FROM invoices inv
  WHERE inv.status = 'overdue'
    AND (p_customer_id IS NULL OR inv.customer_id = p_customer_id);

  -- 4. Collection Rate
  IF (v_total_revenue + v_outstanding) > 0 THEN
    v_collection_rate := ROUND((v_total_revenue / (v_total_revenue + v_outstanding)) * 100.0, 1);
  ELSE
    v_collection_rate := 100.0;
  END IF;

  RETURN jsonb_build_object(
    'total_revenue', v_total_revenue,
    'active_subscriptions', v_active_subs,
    'outstanding_payments', v_outstanding,
    'overdue_invoices', v_overdue_count,
    'collection_rate', v_collection_rate,
    'mrr', v_mrr,
    'arr', v_arr
  );
END;
$$;
```

---

### 2.2 `get_revenue_over_time`
Aggregates monthly/weekly revenue buckets for the telemetry bar chart.

```sql
CREATE OR REPLACE FUNCTION public.get_revenue_over_time(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  period_label TEXT,
  period_date DATE,
  revenue NUMERIC,
  is_latest BOOLEAN
)
LANGUAGE sql
STABLE
AS $$
  WITH monthly AS (
    SELECT 
      TO_CHAR(date_trunc('month', payment_date), 'Mon DD') AS period_label,
      date_trunc('month', payment_date)::DATE AS period_date,
      SUM(amount) AS revenue,
      ROW_NUMBER() OVER (ORDER BY date_trunc('month', payment_date) DESC) AS rank
    FROM payments
    WHERE status = 'succeeded'
      AND (p_start_date IS NULL OR payment_date >= p_start_date)
      AND (p_end_date IS NULL OR payment_date <= p_end_date)
      AND (p_customer_id IS NULL OR customer_id = p_customer_id)
    GROUP BY date_trunc('month', payment_date)
    ORDER BY period_date ASC
    LIMIT 6
  )
  SELECT 
    period_label,
    period_date,
    revenue,
    (rank = 1) AS is_latest
  FROM monthly;
$$;
```

---

### 2.3 `get_subscriptions_by_status`
Generates subscription breakdown for telemetry progress visualization.

```sql
CREATE OR REPLACE FUNCTION public.get_subscriptions_by_status(
  p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  status TEXT,
  label TEXT,
  count BIGINT,
  percentage NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH total AS (
    SELECT COUNT(*)::NUMERIC AS total_count 
    FROM subscriptions 
    WHERE (p_customer_id IS NULL OR customer_id = p_customer_id)
  )
  SELECT 
    s.status::TEXT,
    INITCAP(s.status::TEXT) AS label,
    COUNT(*) AS count,
    ROUND((COUNT(*) / NULLIF((SELECT total_count FROM total), 0)) * 100.0, 1) AS percentage
  FROM subscriptions s
  WHERE (p_customer_id IS NULL OR s.customer_id = p_customer_id)
  GROUP BY s.status;
$$;
```

---

## 3. Recommended PostgreSQL Views

### 3.1 `view_overdue_invoices`
Denormalized view for the Dashboard overdue invoice list.

```sql
CREATE OR REPLACE VIEW public.view_overdue_invoices AS
SELECT 
  inv.id,
  inv.invoice_no,
  inv.customer_id,
  c.name AS customer_name,
  c.company AS customer_company,
  inv.issue_date,
  inv.due_date,
  GREATEST(0, (CURRENT_DATE - inv.due_date::DATE)) AS days_overdue,
  inv.total_amount,
  inv.balance,
  inv.currency,
  inv.status
FROM invoices inv
JOIN customers c ON c.id = inv.customer_id
WHERE inv.status = 'overdue'
ORDER BY days_overdue DESC, inv.balance DESC;
```

### 3.2 `view_portal_subscriptions`
Customer portal scoped view joining customer, plan, and billing telemetry.

```sql
CREATE OR REPLACE VIEW public.view_portal_subscriptions AS
SELECT 
  s.id,
  s.subscription_number,
  s.customer_id,
  s.plan_id,
  p.name AS plan_name,
  p.billing_cycle,
  p.amount AS plan_amount,
  s.status,
  s.start_date,
  s.end_date,
  s.renewal_date,
  s.total_amount,
  s.currency,
  s.created_at
FROM subscriptions s
JOIN plans p ON p.id = s.plan_id;
```

---

## 4. Suggested Performance Indexes

To support high-throughput telemetry queries without full table scans:

```sql
-- 1. Invoices overdue index
CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date 
  ON invoices(status, due_date DESC) 
  WHERE status = 'overdue';

-- 2. Customer scoped invoices
CREATE INDEX IF NOT EXISTS idx_invoices_customer_status 
  ON invoices(customer_id, status, issue_date DESC);

-- 3. Active subscriptions count and MRR calculation
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_plan 
  ON subscriptions(status, plan_id) 
  INCLUDE (customer_id);

-- 4. Succeeded payments revenue aggregation
CREATE INDEX IF NOT EXISTS idx_payments_status_date_amount 
  ON payments(status, payment_date DESC) 
  INCLUDE (amount, customer_id);

-- 5. Payment method breakdown
CREATE INDEX IF NOT EXISTS idx_payments_method_date 
  ON payments(method, payment_date);
```

---

## 5. Security & Row-Level Security (RLS) Guidance

For Customer Portal endpoints (`getMyInvoices`, `getMySubscriptions`, `getMyPayments`), ensure RLS enforces:
```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portal users view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = customer_id);
```
*(In mock mode `USE_MOCK_DATA=true`, all queries are evaluated in-memory and bypass Supabase).*

