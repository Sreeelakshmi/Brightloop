# Brightloop ?" Complete Page & Route Inventory

This inventory documents all application pages, layouts, API route handlers, and server actions across the Brightloop platform, mapping their route paths, module owners, authorization boundaries, and live operational status.

---

## 1. Application Pages & Routes

| URL Path | File Path | Member Module | Access Control (Guards & Real Code) | Description | Sidebar Link | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Shared / Member 1 | **Public** (Middleware redirects authenticated customer &rarr; `/portal`, admin/staff &rarr; `/dashboard`) | Product landing page, team architectural overview, and direct route preview directory | No | Works |
| `/login` | `src/app/(auth)/login/page.tsx` | Member 1 (`feature/admin-backend`) | **Public** (Middleware redirects authenticated customer &rarr; `/portal`, admin/staff &rarr; `/dashboard`) | User sign-in form with email & password, password visibility toggle, and recovery links | No | Works |
| `/signup` | `src/app/(auth)/signup/page.tsx` | Member 1 (`feature/admin-backend`) | **Public** | Customer registration form (full name, email, password, confirm password; defaults strictly to customer role) | No | Works |
| `/register` | `src/app/(auth)/register/page.tsx` | Member 1 (`feature/admin-backend`) | **Public** | Duplicate registration page; renders the exact same `SignupForm` component as `/signup` | No | Works (Duplicate) |
| `/forgot-password` | `src/app/(auth)/forgot-password/page.tsx` | Member 1 (`feature/admin-backend`) | **Public** | Password reset request form initiating Supabase Auth password recovery emails | No | Works |
| `/reset-password` | `src/app/(auth)/reset-password/page.tsx` | Member 1 (`feature/admin-backend`) | **Public** (Requires recovery session from email link) | Password update form for entering and confirming new password | No | Works |
| `/customer` | `src/app/(customer)/customer/page.tsx` | Member 1 (`feature/admin-backend`) | **Customer** (`(customer)/layout.tsx` `requireAuth()` + `session.ts`) | Customer dashboard landing page with KPI cards and portal navigation cards | No (Header only) | Works |
| `/portal` | `src/app/(customer)/portal/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Customer Only** (`(customer)/portal/layout.tsx` `requireAuth(["customer"])` + `middleware.ts`) | Customer self-service portal overview with stat cards, upcoming renewals timeline, and recent invoices | Yes (Footer link) | Works |
| `/portal/account` | `src/app/(customer)/portal/account/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Customer Only** (`(customer)/portal/layout.tsx` `requireAuth(["customer"])` + `middleware.ts`) | Organization profile and notification preferences telemetry | No | Placeholder |
| `/portal/invoices` | `src/app/(customer)/portal/invoices/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Customer Only** (`requireAuth(["customer"])` + `middleware.ts`) | Customer invoice ledger with status and overdue filters, balance tracking, and PDF download links | No | Works |
| `/portal/invoices/[id]` | `src/app/(customer)/portal/invoices/[id]/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Customer Only** (`(customer)/portal/layout.tsx` + `middleware.ts`) | Printable invoice statement, itemized breakdown, and settlement payment history | No | Works (Hardcoded `cust-001`) |
| `/portal/payments` | `src/app/(customer)/portal/payments/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Customer Only** (`requireAuth(["customer"])` + `middleware.ts`) | Settled customer payments ledger, payment method summary cards, and method filters | No | Works |
| `/portal/subscriptions` | `src/app/(customer)/portal/subscriptions/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Customer Only** (`(customer)/portal/layout.tsx` + `middleware.ts`) | Customer subscription contract cards with status filtering and details navigation | No | Works |
| `/portal/subscriptions/[id]` | `src/app/(customer)/portal/subscriptions/[id]/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Customer Only** (`(customer)/portal/layout.tsx` + `middleware.ts`) | Contract detail view with lifecycle status stepper, renewal info, line items, and action buttons | No | Works |
| `/admin` | `src/app/(dashboard)/admin/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin Only** (`(dashboard)/layout.tsx` `requireRole(["admin", "staff"])` + page `requireRole(["admin"])`) | Administrator console with infrastructure security KPIs and links to core admin modules | No (Flagged: No link) | Works |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Executive Analytics Dashboard (Revenue Overview) with KPI cards, Recharts charts, and overdue invoices | Yes (`/dashboard`) | Works |
| `/reports` | `src/app/(dashboard)/reports/page.tsx` | Member 4 (`feature/dashboard-ai`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Subscription and revenue intelligence tabs (Subscriptions, Revenue, Payments, Invoices) with CSV export | Yes (`/reports`) | Works |
| `/customers` | `src/app/(dashboard)/customers/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Placeholder module for customer accounts directory, search, LTV metrics, and tax IDs | Yes (`/customers`) | Placeholder |
| `/subscriptions` | `src/app/(dashboard)/subscriptions/page.tsx` | Member 2 (`feature/subscriptions`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Subscription agreements data table with search, status filters, and pagination | Yes (`/subscriptions`) | Works |
| `/subscriptions/new` | `src/app/(dashboard)/subscriptions/new/page.tsx` | Member 2 (`feature/subscriptions`) | **Admin & Staff** (`(dashboard)/layout.tsx` + page `user.role !== "customer"`) | Form to create a new subscription agreement from a template or custom draft | No | Works |
| `/subscriptions/[id]` | `src/app/(dashboard)/subscriptions/[id]/page.tsx` | Member 2 (`feature/subscriptions`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Subscription details view with lifecycle actions (Activate, Pause, Resume, Close, Renew) and line items | No | Works |
| `/invoices` | `src/app/(dashboard)/invoices/page.tsx` | Member 3 (`feature/billing-payments`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Invoice ledger with manual invoice generator modal and recurring billing trigger | Yes (`/invoices`) | Works |
| `/invoices/[id]` | `src/app/(dashboard)/invoices/[id]/page.tsx` | Member 3 (`feature/billing-payments`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Tax invoice details sheet with line items, tax calculations, and payment recording modal | No | Works |
| `/payments` | `src/app/(dashboard)/payments/page.tsx` | Member 3 (`feature/billing-payments`) | **Admin & Staff** (`(dashboard)/layout.tsx` + `middleware.ts`) | Payment transaction ledger, method tracking, and demo payment gateway simulator | Yes (`/payments`) | Works |
| `/products` | `src/app/(dashboard)/products/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin & Staff** (`(dashboard)/layout.tsx` `requireRole(["admin", "staff"])`) | Product catalog list with search, pricing summary, and Create Product button (Admin only) | Yes (`/products`) | Works |
| `/products/new` | `src/app/(dashboard)/products/new/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin Only** (Layout allows staff, but page explicitly blocks staff with "Access Restricted") | Product creation form with sales price, cost price, notes, and dynamic variant attributes editor | No | Works |
| `/products/[id]` | `src/app/(dashboard)/products/[id]/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin Only** (Layout allows staff, but page explicitly blocks staff with "Access Restricted") | Product editor form with variant management and pricing controls | No | Works |
| `/plans` | `src/app/(dashboard)/plans/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin & Staff** (`(dashboard)/layout.tsx` `requireRole(["admin", "staff"])`) | Pricing plans catalog list with billing intervals, currencies, and Create Plan button (Admin only) | Yes (`/plans`) | Works |
| `/plans/new` | `src/app/(dashboard)/plans/new/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin Only** (Layout allows staff, but page explicitly blocks staff with "Access Restricted") | Pricing plan builder (plan code, name, billing frequency, trial days, closeable/renewable flags) | No | Works |
| `/plans/[id]` | `src/app/(dashboard)/plans/[id]/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin Only** (Layout allows staff, but page explicitly blocks staff with "Access Restricted") | Pricing plan editor form for updating terms and lifecycle parameters | No | Works |
| `/quotations` | `src/app/(dashboard)/quotations/page.tsx` | Member 2 (`feature/subscriptions`) | **Admin & Staff** (`(dashboard)/layout.tsx` `requireRole(["admin", "staff"])`) | Proposal & quotation templates list with search, pagination, and Create Template button | Yes (`/quotations`) | Needs migration `20261031063340_subscription_tables.sql` (`quotation_templates`) |
| `/quotations/new` | `src/app/(dashboard)/quotations/new/page.tsx` | Member 2 (`feature/subscriptions`) | **Admin & Staff** (`(dashboard)/layout.tsx` + page `user.role !== "customer"`) | Form to create reusable quotation templates with plan selection, payment terms, and product lines | No | Needs migration `20261031063340_subscription_tables.sql` (`quotation_templates`) |
| `/quotations/[id]` | `src/app/(dashboard)/quotations/[id]/page.tsx` | Member 2 (`feature/subscriptions`) | **Admin & Staff** (`(dashboard)/layout.tsx` + page `user.role !== "customer"`) | Form to edit existing quotation template parameters and included line items | No | Needs migration `20261031063340_subscription_tables.sql` (`quotation_templates`) |
| `/staff` | `src/app/(dashboard)/staff/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin & Staff** (`(dashboard)/layout.tsx` + page `requireRole(["admin", "staff"])`) | Placeholder module for staff member roster, RBAC assignments, and invitations | Yes (`/staff`) | Placeholder |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | Member 1 (`feature/admin-backend`) | **Admin Only** (`(dashboard)/layout.tsx` + page `requireRole(["admin"])`) | Placeholder module for organization profile, default currency, API keys, and webhooks | Yes (`/settings`) | Placeholder |
| `/settings/billing` | `src/app/(dashboard)/settings/billing/page.tsx` | Member 3 (`feature/billing-payments`) | **Admin & Staff** (`(dashboard)/layout.tsx` `requireRole(["admin", "staff"])`) | Regional tax rules management, discount coupons list, and tax/discount configuration forms | No (Subroute) | Needs migration `20261031_billing_payments.sql` (`discounts`) |
| `/admin/plans` | `src/app/admin/plans/page.tsx` | Member 1 (`feature/admin-backend`) | **Public / Redirect** (Redirects to `/plans`, where `(dashboard)/layout.tsx` protects access) | Immediate server redirect to `/plans` | No | Works (Redirect) |
| `/admin/products` | `src/app/admin/products/page.tsx` | Member 1 (`feature/admin-backend`) | **Public / Redirect** (Redirects to `/products`, where `(dashboard)/layout.tsx` protects access) | Immediate server redirect to `/products` | No | Works (Redirect) |

---

## 2. API Routes

| HTTP Method | Route URL | File Path | Member Module | Required Role / Guard | Description | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/ai` | `src/app/api/ai/route.ts` | Member 4 (`feature/dashboard-ai`) | **Public / None** | Placeholder route returning JSON status for Gemini AI copilot integration | Placeholder |
| `GET` | `/api/billing` | `src/app/api/billing/route.ts` | Member 3 (`feature/billing-payments`) | **Authenticated** (`getAuthenticatedUser()`; Admin/Staff see all; Customer sees self) | Recurring billing engine diagnostics and due subscription telemetry | Works |
| `POST` | `/api/billing` | `src/app/api/billing/route.ts` | Member 3 (`feature/billing-payments`) | **Admin, Staff, Finance, Owner** OR Bearer `CRON_SECRET` | Trigger automated recurring billing run and generate invoices | Works |
| `GET` | `/api/export/overdue-invoices` | `src/app/api/export/overdue-invoices/route.ts` | Member 4 (`feature/dashboard-ai`) | **None (Unguarded)** | CSV export of all overdue customer invoices, companies, and balances | **Security Gap** |
| `GET` | `/api/reports/export` | `src/app/api/reports/export/route.ts` | Member 4 (`feature/dashboard-ai`) | **Admin or Staff** (`AUTH_COOKIE_NAME` cookie check + `middleware.ts`) | RFC 4180 and Formula-Injection protected CSV streaming export for report tabs | Works |
| `GET` | `/auth/callback` | `src/app/auth/callback/route.ts` | Member 1 (`feature/admin-backend`) | **Public** | Supabase Auth OAuth and email confirmation code exchange handler | Works |
| `POST` | `/auth/logout` | `src/app/auth/logout/route.ts` | Member 1 (`feature/admin-backend`) | **Public** | Clears active Supabase session and redirects to `/login` (HTTP 303) | Works |
| `GET` | `/auth/logout` | `src/app/auth/logout/route.ts` | Member 1 (`feature/admin-backend`) | **Public** | Clears active Supabase session and redirects to `/login` | Works |

---

## 3. Server Actions

| Action Name | Source File | Member Module | Required Role / Guard | Mutation Target |
| :--- | :--- | :--- | :--- | :--- |
| `loginAction` | `src/lib/auth/actions.ts` | Member 1 | **Public** | Authenticates credentials with Supabase Auth |
| `signupAction` | `src/lib/auth/actions.ts` | Member 1 | **Public** | Registers new customer account in Supabase Auth |
| `logoutAction` | `src/lib/auth/actions.ts` | Member 1 | **Public** | Signs out user session |
| `forgotPasswordAction` | `src/lib/auth/actions.ts` | Member 1 | **Public** | Triggers Supabase password recovery email |
| `resetPasswordAction` | `src/lib/auth/actions.ts` | Member 1 | **Public (Recovery Session)** | Updates password for authenticated recovery user |
| `createPlanAction` | `src/app/(dashboard)/plans/actions.ts` | Member 1 | **Admin Only** (`user.role === "admin"`) | Inserts new pricing plan into `plans` table |
| `updatePlanAction` | `src/app/(dashboard)/plans/actions.ts` | Member 1 | **Admin Only** (`user.role === "admin"`) | Updates pricing plan in `plans` table |
| `deletePlanAction` | `src/app/(dashboard)/plans/actions.ts` | Member 1 | **Admin Only** (`user.role === "admin"`) | Deletes pricing plan from `plans` table |
| `createProductAction` | `src/app/(dashboard)/products/actions.ts` | Member 1 | **Admin Only** (`user.role === "admin"`) | Inserts product and variants into database |
| `updateProductAction` | `src/app/(dashboard)/products/actions.ts` | Member 1 | **Admin Only** (`user.role === "admin"`) | Updates product and variants in database |
| `deleteProductAction` | `src/app/(dashboard)/products/actions.ts` | Member 1 | **Admin Only** (`user.role === "admin"`) | Deletes product from `products` table |
| `createTemplateAction` | `src/app/(dashboard)/quotations/actions.ts` | Member 2 | **Admin & Staff** (`user.role !== "customer"`) | Inserts quotation template and items |
| `updateTemplateAction` | `src/app/(dashboard)/quotations/actions.ts` | Member 2 | **Admin & Staff** (`user.role !== "customer"`) | Updates quotation template and items |
| `deleteTemplateAction` | `src/app/(dashboard)/quotations/actions.ts` | Member 2 | **Admin Only** (`user.role === "admin" \|\| user.role === "owner"`) | Deletes quotation template from database |
| `createSubscriptionFromTemplateAction` | `src/app/(dashboard)/subscriptions/actions.ts` | Member 2 | **Admin & Staff** (`user.role !== "customer"`) | Generates active subscription from quotation template |
| `createSubscriptionDraftAction` | `src/app/(dashboard)/subscriptions/actions.ts` | Member 2 | **Admin & Staff** (`user.role !== "customer"`) | Creates custom subscription contract in draft status |
| `changeSubscriptionStatusAction` | `src/app/(dashboard)/subscriptions/actions.ts` | Member 2 | **Admin & Staff** (`user.role !== "customer"`) | Executes subscription lifecycle status transition |
| `renewSubscriptionAction` | `src/app/(dashboard)/subscriptions/actions.ts` | Member 2 | **Admin & Staff** (`user.role !== "customer"`) | Extends active subscription term and recalculates dates |
| `recordPaymentAction` | `src/app/actions/billing.ts` | Member 3 | **Unguarded in Action** (Relies on RLS) | Records payment against invoice in `payments` table |
| `updateInvoiceStatusAction` | `src/app/actions/billing.ts` | Member 3 | **Unguarded in Action** (Relies on RLS) | Updates invoice status (draft, confirmed, paid, etc.) |
| `runRecurringBillingAction` | `src/app/actions/billing.ts` | Member 3 | **Unguarded in Action** (Relies on RLS) | Executes recurring billing generator on all due subscriptions |
| `createTaxRuleAction` | `src/app/actions/billing.ts` | Member 3 | **Unguarded in Action** (Relies on RLS) | Inserts regional tax rule in `tax_rules` table |
| `createDiscountAction` | `src/app/actions/billing.ts` | Member 3 | **Unguarded in Action** (Relies on RLS) | Inserts promotional discount coupon in `discounts` table |
| `createManualInvoiceAction` | `src/app/actions/billing.ts` | Member 3 | **Unguarded in Action** (Relies on RLS) | Creates manual invoice and line items in `invoices` table |
| `processDemoPaymentAction` | `src/app/actions/billing.ts` | Member 3 | **Unguarded in Action** (Relies on RLS) | Simulates payment settlement gateway transaction |

---

## 4. Gaps, Inconsistencies & Bug Reports

### Critical Architectural Flaws:
1. **Cookie vs. Supabase Session Desync (Primary Reason Customer Portal Fails to Open)**:
   - **Location**: `src/middleware.ts` (lines 9-14) vs. `src/lib/auth/actions.ts` (`loginAction`, lines 51-54).
   - **Problem**: `middleware.ts` strictly gates routes using the cookie `brightloop_role` (`AUTH_COOKIE_NAME`). However, `loginAction` signs in via Supabase Auth (`supabase.auth.signInWithPassword`), which sets Supabase SSR session cookies but **never sets the `brightloop_role` cookie**.
   - **Consequence**: Upon logging in, any subsequent navigation to `/portal`, `/dashboard`, or protected subroutes is intercepted by `middleware.ts`. Because `brightloop_role` is missing, middleware flags the user as unauthenticated and redirects them back to `/login`.
2. **Hardcoded Mock Fallback in Server Action Guard**:
   - **Location**: `src/lib/auth/require-user.ts` (lines 17-23).
   - **Problem**: `requireUser()` returns a static mock user: `{ id: "00000000-0000-0000-0000-000000000001", email: "admin@brightloop.io", role: "admin" }`.
   - **Consequence**: All actions and pages importing `requireUser` (Plans, Products, Quotations, Subscriptions) always treat the caller as `admin`, ignoring real Supabase session data and role restrictions.
3. **Dual Authentication Frameworks**:
   - **Location**: `src/lib/auth/index.ts` vs. `src/lib/auth/session.ts`.
   - **Problem**: Two conflicting auth abstractions coexist. `src/lib/auth/index.ts` uses role cookie fallbacks and defaults to `DEFAULT_USERS.admin`, while `src/lib/auth/session.ts` queries `public.profiles`. Pages and layouts inconsistently import from one or the other (e.g. `(customer)/layout.tsx` uses `session.ts` while `(customer)/portal/layout.tsx` uses `index.ts`).

### Route Gaps & Security Weaknesses:
4. **Unguarded API Route**:
   - **Location**: `src/app/api/export/overdue-invoices/route.ts` (lines 5-32).
   - **Problem**: The endpoint exports all overdue invoices, company names, and balances in CSV format with **zero authentication or role verification**. Furthermore, it is missing from `src/middleware.ts` matcher.
5. **Unguarded Financial Server Actions**:
   - **Location**: `src/app/actions/billing.ts`.
   - **Problem**: Functions `recordPaymentAction`, `updateInvoiceStatusAction`, `runRecurringBillingAction`, `createTaxRuleAction`, `createDiscountAction`, `createManualInvoiceAction`, and `processDemoPaymentAction` do not perform session or role verification in TypeScript code, relying entirely on database RLS.
6. **Duplicate Routes**:
   - `/signup` (`src/app/(auth)/signup/page.tsx`) and `/register` (`src/app/(auth)/register/page.tsx`) render identical `SignupForm` components.
   - `/admin/plans` and `/admin/products` duplicate navigation by acting as standalone redirects to `/plans` and `/products`.
7. **Missing Database Tables on Remote Supabase (`ppyzmfcnkhykucaspkyx.supabase.co`)**:
   - `quotation_templates`, `quotation_template_lines`, and `subscription_lines` (from migration `20261031063340_subscription_tables.sql`) are missing, causing `/quotations` and `/quotations/new` to fail with error `PGRST205`.
   - `discounts` (from migration `20261031_billing_payments.sql`) is missing, causing `/settings/billing` discounts query to fail with error `PGRST205`.
8. **Hardcoded Customer ID in Portal Invoice Detail**:
   - **Location**: `src/app/(customer)/portal/invoices/[id]/page.tsx` (line 18).
   - **Problem**: Hardcodes `const customerId = "cust-001"`, failing to isolate or display records belonging to the actual authenticated customer.
9. **Password Policy Discrepancy**:
   - **Location**: `src/lib/auth/actions.ts` (line 133) and `src/components/auth/signup-form.tsx` (line 56).
   - **Problem**: Code only enforces `password.length < 6`. The specified complex password rule (>8 characters, uppercase, lowercase, special character) is not checked on either client or server.
10. **Navigation & Sidebar Inconsistencies**:
    - Route `/admin` has no link in `src/components/layout/sidebar.tsx`.
    - `src/components/layout/navbar.tsx` hardcodes a static `"ADMIN"` badge for every logged-in user regardless of real database profile role.
    - On `/customer` landing page (`src/app/(customer)/customer/page.tsx`), all 3 cards link to `/portal` rather than deep-linking to `/portal/subscriptions`, `/portal/invoices`, and `/portal/payments`.

---

## 5. Environment Variables Inventory

| Variable Name | Where Used in Code | Visibility / Scope | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase.ts` | **Public** (Client & Server) | Supabase project endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase.ts` | **Public** (Client & Server) | Standard Supabase Anonymous public API key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase.ts` | **Public** (Client & Server) | Supabase Publishable / Anon key alias |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase/server.ts` (`createAdminClient()`), seed scripts | **Server-Only** (Secret) | High-privilege key that bypasses PostgreSQL RLS |
| `GEMINI_API_KEY` | `src/app/api/ai/route.ts` (planned in `.env.example`) | **Server-Only** (Secret) | Google Gemini AI Copilot API key for revenue insights |
| `CRON_SECRET` | `src/app/api/billing/route.ts` | **Server-Only** (Secret) | Bearer secret for authenticating automated cron billing runs |
| `ENABLE_DEMO_PAYMENT_GATEWAY` | `src/services/payments.ts` | **Server-Only** | Feature toggle enabling simulated payment gateway transactions |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `src/lib/supabase.ts`, `src/lib/data/dashboard.ts` | **Public** (Client & Server) | Global toggle enabling mock telemetry data fallback |
| `USE_MOCK_DATA` | `src/lib/data/dashboard.ts` | **Server-Only** | Server-side toggle enabling mock dashboard metrics |
| `NODE_ENV` | Next.js runtime, build tools, tests | **Runtime / Server-Only** | Specifies runtime mode (`development`, `production`, `test`) |

