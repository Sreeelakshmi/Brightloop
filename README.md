# Brightloop

> **Enterprise Subscription Management System**  
> Developed for an 8-hour hackathon by a 4-member engineering team.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18, TypeScript strict mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Backend & Auth**: [Supabase](https://supabase.com/)

---

## Folder Structure

```text
brightloop/
├── app/
│   ├── (admin)/          ← Dashboard, Reports, Customers, etc.
│   ├── portal/           ← Customer Portal (overview, subscriptions, invoices, payments)
│   ├── api/              ← Route handlers (auth, reports CSV export)
│   ├── login/
│   └── layout.tsx
├── components/
│   ├── ui-shared/        ← Design system (StatCard, DataTable, StatusBadge, etc.)
│   ├── dashboard/        ← Admin dashboard charts & KPI sections
│   ├── reports/          ← Reports tabs & tables
│   ├── portal/           ← Customer portal components
│   └── layout/           ← AdminShell, PortalHeader, AdminSidebar
├── lib/
│   ├── auth.ts           ← Session helpers (stub; Member 1 wires real Supabase Auth)
│   ├── formatters.ts     ← formatMoney, formatDate, formatNumber, formatPercent
│   ├── supabase.ts
│   └── data/
│       ├── mock-generator.ts  ← 2,240 subscriptions, 387 invoices, 350 payments
│       ├── dashboard.ts
│       └── portal.ts     ← All portal data functions (ownership-enforced)
├── middleware.ts          ← Route protection (admin/staff vs customer)
├── types/index.ts
├── test/                 ← Vitest unit tests
├── docs/
│   ├── member4-rls-policies.sql    ← Supabase RLS SQL for Member 1
│   ├── member4-db-requests.md      ← SQL views, RPCs & index proposals
│   └── member4-final-report.md
├── .env.example
└── README.md
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_USE_MOCK_DATA=true for offline development
```

### 3. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

**Demo login** (simulated via cookie, no real auth required in mock mode):

| Role | Cookie value | Lands on |
|------|-------------|----------|
| Admin | `brightloop_role=admin` | `/dashboard` |
| Staff | `brightloop_role=staff` | `/dashboard` |
| Customer | `brightloop_role=customer` | `/portal` |

Use the Login page UI (radio buttons) or set the cookie directly in DevTools.

---

## Team & Collaboration Guide

For detailed branch assignments, folder ownership, and PR workflows, see [docs/TEAM_GUIDE.md](docs/TEAM_GUIDE.md).

- **Member 1**: `feature/admin-backend` (Auth, Supabase, Products, Plans, Customers, Staff, Settings, DB & Seeds)
- **Member 2**: `feature/subscriptions` (Quotations, Subscriptions, Renewals, Lifecycle)
- **Member 3**: `feature/billing-payments` (Recurring billing, Invoices, Discounts, Taxes, Payments)
- **Member 4**: `feature/dashboard-ai` (Dashboard, Customer portal, AI revenue insights)

---

## Member 4: How to Run, Test and Deploy

> **Branch**: `feature/dashboard-ai`  
> **Owner**: Member 4

### Running Locally

```bash
# Install
npm install

# Copy env vars (mock mode on by default)
cp .env.example .env.local

# Dev server (http://localhost:3000)
npm run dev
```

### Running Tests

```bash
# Unit tests (Vitest)
npm run test

# Type check
npm run type-check

# Lint
npm run lint
```

All 5 test suites must pass:
- `test/route-protection.test.ts` — middleware guards
- `test/portal.test.ts` — portal data access
- `test/access-control.test.ts` — **Step 9 IDOR & cross-role ownership checks**
- `test/dashboard-kpis.test.ts` — KPI computations
- `test/filter-to-query.test.ts` — filter logic
- `test/reports.test.ts` — report data layer

### Production Build

```bash
npm run build
# Must complete with 0 TypeScript errors, 0 lint errors, exit code 0
```

### Deploying to Vercel

1. **Connect repo to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import `github.com/Sreeelakshmi/Brightloop`
   - Set **Root Directory** to `.` (project root, not `src/`)
   - Framework preset: **Next.js**

2. **Set Environment Variables** in Vercel dashboard → Settings → Environment Variables:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |
   | `NEXT_PUBLIC_USE_MOCK_DATA` | `false` (production) or `true` (demo) |
   | `USE_MOCK_DATA` | `false` (production) or `true` (demo) |

3. **Deploy**: Click "Deploy". Vercel will run `npm run build` automatically.

4. **Switching from mock to real data**:
   - Set `USE_MOCK_DATA=false` and `NEXT_PUBLIC_USE_MOCK_DATA=false`
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are real
   - Member 1 must apply `docs/member4-rls-policies.sql` to the Supabase project before go-live

### Pages Delivered (Member 4)

| Route | Description |
|-------|-------------|
| `/dashboard` | Admin Revenue Overview — KPI cards, 3 Recharts charts, overdue invoice table, CSV export |
| `/reports` | Admin Reports — 4 tabs (SUBSCRIPTIONS/REVENUE/PAYMENTS/INVOICES), filter bar, DataTable, CSV export |
| `/portal` | Customer overview — greeting, 3 stat cards, upcoming renewals timeline, recent invoices |
| `/portal/subscriptions` | Customer subscription card grid with status filter |
| `/portal/subscriptions/[id]` | Subscription detail — stepper, renewal panel, order lines, Renew/Pause/Close actions |
| `/portal/invoices` | Customer invoice table — status/overdue filters, pagination, PDF download icon |
| `/portal/invoices/[id]` | Printable invoice sheet — overdue banner, line items, totals, payment timeline, PDF placeholder |
| `/portal/payments` | Customer payment history — method breakdown bar, method filter, table |
| `/api/reports/export` | Streaming CSV export (admin/staff only, formula-injection safe) |
