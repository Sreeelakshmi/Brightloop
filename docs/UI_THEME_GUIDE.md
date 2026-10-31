# Brightloop — Official UI Theme Guide

This document defines the official design system for the **Brightloop Subscription Management System** based on the reference dashboard architecture.

All team members (**Member 1, Member 2, Member 3, and Member 4**) should follow these conventions and use the pre-built shared components to maintain a cohesive, high-polish visual experience.

---

## 1. Color Palette & Tokens

| Role | Hex | Tailwind Token | CSS Variable Token | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Background** | `#DCE9DF` | `bg-brightloop-bg` | `bg-background` | Full-page background behind content and cards. |
| **Surface / Cards** | `#FFFFFF` | `bg-brightloop-card` / `bg-white` | `bg-card` | Sidebar, KPI bodies, table backgrounds, form cards. |
| **Primary Text** | `#202923` | `text-brightloop-text` | `text-foreground` | Main page titles, primary headers, large stat numbers. |
| **Secondary Sage** | `#8F9F94` | `text-brightloop-sage` | `text-secondary` | Subtitles, labels, timestamps, KPI headers. |
| **Accent Coral** | `#FA8257` | `bg-brightloop-coral` | `bg-primary` | Primary CTA buttons, active states, overdue alerts, accent bars. |
| **Borders** | `#D4DED6` | `border-brightloop-border` | `border-border` | Thin card borders, table dividers, input borders. |
| **Dark Header** | `#202923` | `bg-brightloop-dark` | — | Dark KPI headers (e.g. Total Revenue), dark action buttons (Export CSV). |

---

## 2. Typography & Layout Guidelines

- **Page Titles**: Bold, uppercase sans-serif text (`font-extrabold uppercase tracking-tight text-brightloop-text`).
- **Corner Radius**: 6px to 8px (`rounded-md` or `rounded-lg`).
- **Sidebar**: Pure white background (`bg-white`) with thin right border (`border-r border-border`).
- **KPI Cards**: Header strip with colored banner (`dark`, `sage`, `coral`) and white card body below.
- **Tables**: Soft sage header row (`bg-brightloop-bg`) with bold uppercase columns and white data rows.
- **Action Buttons**: Primary action buttons use Accent Coral (`#FA8257`). Secondary / export actions use Dark Charcoal (`#202923`) or White with thin border (`#D4DED6`).

---

## 3. Shared Pre-Built Components

All components are located in `src/components/ui/` and ready for immediate import.

### A. Page Heading (`PageHeading`)
Renders the standard Brightloop uppercase heading with the geometric hexagon icon, metadata badge, and signature 3-color segmented bar.

```tsx
import { PageHeading } from "@/components/ui/page-heading";
import { Badge } from "@/components/ui/badge";

<PageHeading
  title="SUBSCRIPTIONS OVERVIEW"
  description="Active subscriber agreements, renewals, and lifecycle status"
  badge={<Badge variant="sage">LOG: 31.10.2026</Badge>}
  actions={
    <Button variant="coral">+ New Subscription</Button>
  }
/>
```

### B. KPI Stat Card (`KPICard`)
Renders compact KPI cards with the colored top header banner and bold stat value.

```tsx
import { KPICard } from "@/components/ui/kpi-card";

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard
    title="TOTAL REVENUE"
    value="₹48,92,500"
    description="Collected this period"
    headerVariant="dark"
    showHexagon
  />
  <KPICard
    title="ACTIVE SUBSCRIPTIONS"
    value="1,284"
    description="Currently billing"
    headerVariant="sage"
  />
  <KPICard
    title="OUTSTANDING PAYMENTS"
    value="₹6,41,200"
    description="Awaiting payment"
    headerVariant="sage"
  />
  <KPICard
    title="OVERDUE INVOICES"
    value="37"
    description="Needs follow-up"
    headerVariant="coral"
    valueVariant="coral"
  />
</div>
```

### C. Filter & Action Controls (`FilterBar`)
Renders the standard top filter row with dropdown pills, reset trigger, view toggles, and dark CSV export button.

```tsx
import { FilterBar } from "@/components/ui/filter-bar";

<FilterBar
  onExport={() => handleExportCsv()}
  onReset={() => handleResetFilters()}
/>
```

### D. Table (`Table`, `TableHeader`, `TableHead`, `TableRow`, `TableCell`)
Renders standard tables with the signature soft sage header and white hoverable data rows.

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>INVOICE NO.</TableHead>
      <TableHead>CUSTOMER</TableHead>
      <TableHead>DUE DATE</TableHead>
      <TableHead>DAYS OVERDUE</TableHead>
      <TableHead>BALANCE</TableHead>
      <TableHead>STATUS</TableHead>
      <TableHead>ACTIONS</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-mono">INV-2901</TableCell>
      <TableCell className="font-semibold">AeroGroup</TableCell>
      <TableCell>2026-10-15</TableCell>
      <TableCell className="text-brightloop-coral font-bold">16d</TableCell>
      <TableCell className="font-bold">₹1,48,200</TableCell>
      <TableCell>
        <Badge variant="overdue">OVERDUE</Badge>
      </TableCell>
      <TableCell>
        <Button variant="outline" size="sm">Send reminder</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### E. Badges (`Badge`)
```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="coral">OVERDUE</Badge>
<Badge variant="dark">ADMIN</Badge>
<Badge variant="sage">ACTIVE</Badge>
<Badge variant="outline">PENDING</Badge>
<Badge variant="success">PAID</Badge>
```

### F. Buttons (`Button`)
```tsx
import { Button } from "@/components/ui/button";

<Button variant="coral">Primary Action</Button>
<Button variant="dark">Export CSV</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="secondary">Subtle Action</Button>
```

---

## 4. Member Adoption Checklist

- **Member 2 (Quotations & Subscriptions)**:
  - Use `<PageHeading title="QUOTATIONS" />` and `<PageHeading title="SUBSCRIPTIONS" />`.
  - Use `<FilterBar />` above quotes and subscription tables.
  - Use `<Badge variant="coral|sage|outline" />` for quotation and subscription statuses (`draft`, `sent`, `accepted`, `active`, `past_due`).
- **Member 3 (Billing & Invoicing)**:
  - Use `<Table />` for invoices and payments matching the reference table design.
  - Apply `<Badge variant="overdue">` for unpaid/past-due invoices.
  - Use `<KPICard />` for outstanding balance and payment method summaries.
- **Member 4 (Dashboard & AI Insights)**:
  - Dashboard container automatically inherits `bg-brightloop-bg` (`#DCE9DF`) and white sidebar.
  - Wrap charts in `<Card>` with `border-border shadow-card`.
  - Use chart colors: Dark Charcoal (`#202923`), Sage Green (`#8F9F94`), and Accent Coral (`#FA8257`).

