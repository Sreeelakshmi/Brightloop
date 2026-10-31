# Brightloop 2.0 — End-to-End Platform Demo Guide

This document provides the complete 10-minute demo walkthrough script, verified test credentials, demo reset procedures, and a full catalog of all `// TODO: Supabase` integration points across the service layer.

---

## 1. Verified Demo Accounts

All seed passwords satisfy the security policy: `> 8 characters`, `1 uppercase`, `1 lowercase`, and `1 special character`.

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `Admin@Bright2026!` | Full platform access: staff management, tax rules, discount rules, idempotent billing engine, daily scheduler, and demo data reset. |
| **Staff** | `operations@brightloop.io` | `Staff@Bright2026!` | Operations: products, plans, quotation templates, sales quotations, subscription transitions, payment ledger, customer support. Admin routes (`/staff`, `/taxes`, `/discounts`, `/billing-runs`) are strictly blocked. |
| **Customer** | `billing@aerogroup.com` | `Cust@Bright2026!` | Customer portal (`/portal`): can only access their own subscriptions, invoices, and payments. Administrative routes (`/dashboard`, `/reports`, etc.) are blocked. |

Additional Demo Customer Logins:
- `accounts@nexuslogistics.in` / `Cust@Bright2026!`
- `finance@starlightmedia.co` / `Cust@Bright2026!`
- `pay@tatanex.com` / `Cust@Bright2026!`
- `invoicing@mahindratech.in` / `Cust@Bright2026!`

---

## 2. 10-Minute Demo Walkthrough Script

### Step 1: Authentication, Password Policy & Security Engine
1. Navigate to `/signup`.
2. Type a weak password (e.g. `test1234`). Observe the **live 4-point requirement checklist** update dynamically (Length > 8, Uppercase, Lowercase, Special character).
3. Navigate to `/login`. Demonstrate the development quick-login buttons on the footer.
4. Try `/forgot-password` with `admin@brightloop.io`. Navigate to `/dev-mailbox` to inspect the single-use reset email and open the expiring reset token link.

### Step 2: Workforce & RBAC Protection (`/staff`)
1. Log in as **Admin** (`admin@brightloop.io`).
2. Go to `/staff`. View the staff roster, activate/deactivate a staff member, and review the RBAC permission matrix.
3. Log in as **Staff** (`operations@brightloop.io`) in an incognito window and attempt to open `/staff`. Verify that access is immediately blocked and redirected to `/dashboard`.

### Step 3: Product Catalog & Brand Variants (`/products`)
1. Go to `/products`.
2. Inspect the 8 seeded products. Notice **Cloud Telemetry Engine** (`prod-001`) with base price ₹12,000.
3. Observe the **Brand: Odoo** variant which adds **₹560** (effective price = ₹12,560).
4. Click **"Add Product"**. Type a name and adjust the price. Toggle the **"Brand: Odoo (+₹560 extra)"** switch and watch the **Live Effective Price Preview** card calculate the exact total before saving.

### Step 4: Subscription Plans & Contract Flags (`/plans`)
1. Go to `/plans`.
2. Review the 6 contract plans (Daily, Weekly, Monthly, Quarterly, Annual).
3. Point out the policy flags per plan:
   - **Evaluation Daily Spike**: `autoClose: true`, `closableEarly: true`, `pausable: false`, `renewable: false`.
   - **Pro Growth Monthly**: `autoClose: false`, `closableEarly: true`, `pausable: true`, `renewable: true`, minimum quantity = 2.
   - **Enterprise Strategic Annual**: `autoClose: true`, `minimumQuantity: 10`.
4. Point out the **Availability Windows** (e.g., `2026-01-01` to `2026-12-31`).

### Step 5: Fast Quotation Provisioning (`/quotation-templates` &rarr; `/quotations`)
1. Go to `/quotation-templates`.
2. Click **"Use Template"** on the **Startup SaaS Kickstart** or **Odoo ERP Integrated Suite** template.
3. Select customer **AeroGroup Aerospace** and click **"Generate Quotation"**.
4. The system calculates the validity end date (`now + validityDays`), pre-populates product lines with calculated brand variant prices, and creates a quotation subscription.
5. In `/quotations`, observe the new quotation. Show that expired quotations cannot be confirmed.

### Step 6: 5-Stage Subscription Lifecycle & Daily Scheduler (`/subscriptions/[id]`)
1. Open any subscription in `/subscriptions`.
2. Walk through the 5-stage stepper: `Draft` &rarr; `Quotation` &rarr; `Confirmed` &rarr; `Active` &rarr; `Closed`.
3. Try illegal transitions (e.g. attempting to jump from Draft straight to Active) — notice the state machine rejects illegal jumps.
4. Test the policy action buttons:
   - Click **Pause** (allowed only if `plan.pausable === true`).
   - Click **Renew** (extends the contract end date by one year).
   - Click **Close Early** (respects `closableEarly`).
5. Review the **Status Audit History** timeline showing who changed the status, when, and the reason.
6. In `/subscriptions`, click **"Run Scheduler"** as Admin. The daily cron job scans active subscriptions and automatically terminates contracts flagged `autoClose: true` whose end dates have passed.

### Step 7: Statutory Taxes & Promotional Discounts (`/taxes`, `/discounts`)
1. Visit `/taxes`: Review GST 18%, IT Infrastructure Cess 2%, and State VAT 5%.
2. Visit `/discounts`: Inspect **DIWALI20** (20% off), **ENT5000** (₹5,000 flat), and verify the **"Expired"** and **"Limit Reached"** status badges on inactive coupons.

### Step 8: Idempotent Automated Billing Engine (`/billing-runs`)
1. Go to `/billing-runs` as Admin and click **"Run Billing Engine Now"**.
2. The engine scans all active subscriptions, calculates line items with taxes and discounts, and generates new invoices with sequence `INV-XXXX`.
3. Click **"Run Billing Engine Now"** a second time immediately.
4. Notice **Invoices Created: 0, Invoices Skipped: 1284** — the unique period key `(subId_periodStart_periodEnd)` guarantees **ZERO duplicate invoices**.

### Step 9: Invoices, Overdue Reminders & Payments (`/invoices`, `/payments`)
1. Go to `/invoices`. Check the **"Overdue Only"** filter.
2. Click **"Send Reminder"** on an overdue invoice. Open `/dev-mailbox` to see the dispatched reminder notice.
3. Open an invoice detail page (`/invoices/[id]`). Show the printable invoice sheet, overdue alert banner, line items, and tax breakdown.
4. Click **"Record Payment"**:
   - Type an amount higher than the balance (e.g., ₹2,000,000) &rarr; notice the overpayment validation error.
   - Enter a partial payment (e.g., ₹50,000) &rarr; notice the balance decreases and payment history timeline updates.
   - Settle the full remaining balance &rarr; the invoice status immediately flips to **PAID**.
5. In `/payments`, observe the 3-segment summary line updating with total collections by gateway (UPI, Cards, Wire Transfer).

### Step 10: Real-Time Telemetry Dashboard (`/dashboard`)
1. Navigate to `/dashboard`.
2. Notice all KPIs (Total Revenue, Active Subscriptions, Outstanding Balance, Overdue Count, Collection Rate, MRR, ARR) reflect the live stateful database changes.
3. Apply customer and plan filters from the telemetry filter bar &rarr; charts and overdue table update instantly.

### Step 11: Customer Self-Service Portal (`/portal`)
1. Log in as **Customer** (`billing@aerogroup.com` / `Cust@Bright2026!`).
2. The customer is automatically routed to `/portal`.
3. In `/portal/subscriptions`, the customer sees only AeroGroup's active contracts.
4. Open a subscription detail: test the **Pause**, **Renew**, and **Close** buttons.
5. In `/portal/invoices/[id]`, review the customer invoice sheet and click **"Download PDF"** / Print.
6. Try changing the URL ID to another customer's subscription or invoice &rarr; returns **404 Not Found** (IDOR cross-customer access is strictly blocked).

---

## 3. How to Reset Demo Data

If demo transactions clutter the database during testing or presentation:
1. Log in as **Admin** (`admin@brightloop.io`).
2. Go to **Settings** or invoke the reset action.
3. Alternatively, delete the `.demo-data/` folder and restart the application, or execute:
   ```typescript
   import { resetMockDb } from "@/lib/mock/db";
   resetMockDb();
   ```
This restores all 1 Admin, 3 Staff, 50 Customers, 8 Products, 6 Plans, 3 Quotation Templates, 3 Tax Rules, 4 Discounts, and 2,240 baseline subscriptions and invoices.

---

## 4. Production Supabase Swap-In Index (`// TODO: Supabase`)

Every service in `lib/services/` is structured for instantaneous production switch by setting `USE_MOCK_DATA=false` and supplying standard Supabase environment variables.

| Domain Service | File Path | Integration Functions |
| :--- | :--- | :--- |
| **Authentication & RBAC** | `lib/services/auth.ts`, `users.ts` | `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`, `supabase.auth.resetPasswordForEmail()`, `supabase.from('staff_users')` |
| **Products & Variants** | `lib/services/products.ts` | `supabase.from('products').select('*, variants(*)')`, `.insert()`, `.update()`, `.eq('id', id)` |
| **Subscription Plans** | `lib/services/plans.ts` | `supabase.from('plans').select('*')`, `.insert()`, `.update()` |
| **Quotation Templates** | `lib/services/quotations.ts` | `supabase.from('quotation_templates').select('*, lines(*)')`, `.insert()` |
| **Subscriptions & Lifecycle** | `lib/services/subscriptions.ts` | `supabase.from('subscriptions').select('*, lines(*), history(*)')`, `.insert()`, `.update()`, `rpc('transition_subscription')` |
| **Tax Rules & Tariffs** | `lib/services/taxes.ts` | `supabase.from('tax_rules').select('*')`, `.insert()`, `.update()` |
| **Discounts & Coupons** | `lib/services/discounts.ts` | `supabase.from('discount_rules').select('*')`, `rpc('apply_discount_atomic')` |
| **Billing Engine** | `lib/services/billing.ts` | `supabase.rpc('run_automated_billing')`, `supabase.from('billing_runs').insert()` |
| **Invoices Ledger** | `lib/services/invoices.ts` | `supabase.from('invoices').select('*, lines(*)')`, `.update({ status: 'confirmed' })` |
| **Payments Gateway** | `lib/services/payments.ts` | `supabase.from('payments').insert()`, `supabase.from('invoices').update({ balance, paid_amount })` |
| **Telemetry Analytics** | `lib/data/dashboard.ts` | `supabase.rpc('get_dashboard_kpis')`, `supabase.rpc('get_revenue_over_time')` |
| **Customer Portal** | `lib/data/portal.ts` | `supabase.from('view_portal_subscriptions')`, `supabase.from('view_portal_invoices')` (enforced with Supabase Row Level Security) |

---
*Brightloop Telemetry & Billing Platform — Verified Green Build (31 Oct 2026)*
