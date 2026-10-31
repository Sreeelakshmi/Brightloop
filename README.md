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
- **AI Copilot**: Google Gemini API via `@google/genai`

---

## Folder Structure

```text
brightloop/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── plans/
│   │   │   ├── customers/
│   │   │   ├── staff/
│   │   │   ├── quotations/
│   │   │   ├── subscriptions/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   └── settings/
│   │   ├── (customer)/
│   │   │   └── portal/
│   │   ├── api/
│   │   │   ├── billing/
│   │   │   └── ai/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── auth/
│   │   ├── validations/
│   │   ├── constants/
│   │   └── utils.ts
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seeds/
├── scripts/
├── docs/
│   └── TEAM_GUIDE.md
├── public/
├── .env.example
├── .gitignore
├── README.md
└── package.json
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
```

### 3. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the homepage, dashboard, and placeholder modules.

---

## Team & Collaboration Guide

For detailed branch assignments, folder ownership, and PR workflows, see [docs/TEAM_GUIDE.md](docs/TEAM_GUIDE.md).

- **Member 1**: `feature/admin-backend` (Auth, Supabase, Products, Plans, Customers, Staff, Settings, Database & Seeds)
- **Member 2**: `feature/subscriptions` (Quotations, Subscriptions, Renewals, Lifecycle)
- **Member 3**: `feature/billing-payments` (Recurring billing, Invoices, Discounts, Taxes, Payments)
- **Member 4**: `feature/dashboard-ai` (Dashboard, Customer portal, AI revenue insights)
