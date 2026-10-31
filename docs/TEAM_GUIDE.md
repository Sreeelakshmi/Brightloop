# Brightloop — 8-Hour Hackathon Team Guide

Welcome to **Brightloop**, an enterprise Subscription Management System developed by our 4-person engineering team. This guide outlines the project architecture, developer workflow, Git conventions, and branch ownership to ensure rapid and conflict-free execution.

---

## 1. Team Branch Assignments & Ownership

To maximize parallel speed during an 8-hour sprint, the codebase is strictly decoupled across 4 feature branches:

| Member | Feature Branch | Core Responsibilities | Key Paths & Directories |
| :--- | :--- | :--- | :--- |
| **Member 1** | `feature/admin-backend` | Authentication, Supabase Client & Server, Products, Plans, Customers, Staff, Settings, Migrations & Seeds | `src/app/(auth)/`, `src/app/(dashboard)/products/`, `src/app/(dashboard)/plans/`, `src/app/(dashboard)/customers/`, `src/app/(dashboard)/staff/`, `src/app/(dashboard)/settings/`, `src/lib/supabase/`, `supabase/` |
| **Member 2** | `feature/subscriptions` | Sales Quotations, Subscription Management, Upgrades/Downgrades, Renewals, Lifecycle State Machine | `src/app/(dashboard)/quotations/`, `src/app/(dashboard)/subscriptions/`, `src/services/subscription-service.ts` |
| **Member 3** | `feature/billing-payments` | Recurring Billing Engine, Invoices, Regional Taxes, Coupons/Discounts, Payment Gateways & Transactions | `src/app/(dashboard)/invoices/`, `src/app/(dashboard)/payments/`, `src/app/api/billing/`, `src/services/billing-service.ts` |
| **Member 4** | `feature/dashboard-ai` | Executive Analytics Dashboard, Interactive Charts (Recharts), Customer Self-Service Portal, Gemini AI Copilot | `src/app/(dashboard)/dashboard/`, `src/app/(customer)/portal/`, `src/app/api/ai/`, `src/components/charts/` |

---

## 2. Project Setup & Prerequisites

### Prerequisites
- **Node.js**: `v18.18.0` or higher (`v20+` recommended)
- **Package Manager**: `npm`
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/Sreeelakshmi/Brightloop.git
cd Brightloop
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env.local
```

Fill in your respective credentials as they become available:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
CRON_SECRET=your-secure-cron-secret
```

> **Note**: `.env.local` is ignored by Git and should never be committed.

### Step 4: Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 3. Git Workflow & Collaboration Rules

### Switching to Your Feature Branch
Always work within your assigned feature branch:

```bash
# Member 1
git checkout feature/admin-backend

# Member 2
git checkout feature/subscriptions

# Member 3
git checkout feature/billing-payments

# Member 4
git checkout feature/dashboard-ai
```

### Committing Changes
Write descriptive, conventional commit messages:
```bash
git add .
git commit -m "feat(subscriptions): implement prorated upgrade calculator"
```

Prefix conventions:
- `feat(...)`: New feature or capability
- `fix(...)`: Bug fix
- `ui(...)`: Component styling or layout tweak
- `refactor(...)`: Code cleanup without behavior change

### Pushing to GitHub
```bash
git push -u origin <your-feature-branch>
```

### Pull Requests (PRs)
1. Go to GitHub and open a Pull Request from your feature branch into `main`.
2. Ensure linting and TypeScript checks pass before requesting review:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   ```
3. Have at least one other team member approve the PR.
4. Merge using **Squash and Merge** or **Rebase and Merge** to maintain a clean history on `main`.

---

## 4. Golden Rules for Zero Merge Conflicts

1. **Strict Directory Boundaries**: 
   - Stick to your designated folder paths.
   - Do not edit routes or components owned by another member without prior agreement.
2. **Shared Types & Constants**:
   - Shared domain entities are defined in `src/types/index.ts`. If you add a new interface, append it cleanly to the file.
3. **Shared UI Components**:
   - Reusable primitives live in `src/components/ui/` (buttons, cards, inputs). Do not modify existing component APIs; extend them via optional props.
4. **Frequent Syncing with `main`**:
   - Before starting a new work session or creating a PR, rebase or pull the latest changes from `main`:
     ```bash
     git checkout main
     git pull origin main
     git checkout <your-feature-branch>
     git merge main
     ```
5. **No Direct Commits to `main`**:
   - The `main` branch is protected for production-ready, verified code.

---

## 5. Verification Commands

Before opening any PR, run the local verification suite:

```bash
# 1. Type checking
npm run type-check

# 2. ESLint
npm run lint

# 3. Production build
npm run build
```

