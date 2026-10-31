# Subscription to Invoice Contract (Stage 5 Billing Handoff)

**Target Audience:** Member 3 (Billing, Invoices & Payments)  
**Author:** Member 2 (Subscriptions & Catalog)  
**Database View:** `public.billable_subscriptions`  
**Helper Function:** `public.next_billing_date_after(d date, period text) -> date`

---

## 1. Overview & Handoff Contract

This contract defines the exact interface between the subscription lifecycle engine (Member 2) and the recurring billing engine (Member 3). 

Member 2 exposes the read-only database view `public.billable_subscriptions`. Member 3's recurring billing job consumes this view to generate invoices and advance the subscription cycle.

---

## 2. View Specification: `public.billable_subscriptions`

### Schema & Column Definitions

| Column Name | SQL Type | TypeScript Equivalent | Description |
| :--- | :--- | :--- | :--- |
| `subscription_id` | `uuid` | `string` | Primary key of the subscription (`subscriptions.id`). |
| `number` | `text` | `string` | Unique human-readable code (e.g. `SUB-000042`). |
| `customer_id` | `uuid` | `string` | Foreign key referencing `profiles.id` / `auth.users.id`. |
| `customer_name` | `text` | `string \| null` | Name from customer profile (`profiles.full_name`). |
| `customer_email` | `text` | `string \| null` | Email from customer profile (`profiles.email`). |
| `plan_id` | `uuid` | `string` | Foreign key referencing `plans.id`. |
| `plan_name` | `text` | `string` | Human-readable name of the plan (e.g. `Monthly Enterprise Plan`). |
| `billing_period` | `text` | `"daily" \| "weekly" \| "monthly" \| "yearly"` | Plan recurrence interval. |
| `payment_terms` | `text` | `"immediate" \| "net_15" \| "net_30" \| "net_60"` | Credit payment terms for due date calculation. |
| `start_date` | `date` | `string` (ISO date) | Contract effective start date. |
| `expiry_date` | `date` | `string` (ISO date) | Contract termination date. |
| `next_billing_date`| `date` | `string` (ISO date) | Next billing occurrence due date (<= `CURRENT_DATE`). |
| `status` | `text` | `"active"` | Always `'active'`. |
| `period_start` | `date` | `string` (ISO date) | **Start of this invoice cycle** (= `next_billing_date`). |
| `period_end` | `date` | `string` (ISO date) | **Inclusive end of this cycle** (`next_billing_date_after - 1 day`). |
| `lines` | `jsonb` | `BillableSubscriptionLine[]` | JSONB array of itemized lines (schema below). |
| `subtotal` | `numeric(12,2)` | `number` | Sum of `subscription_lines.amount` before discounts/taxes. |
| `tax_total` | `numeric(12,2)` | `number` | Baseline tax amount (`0.00` in view; Member 3 applies taxes). |
| `total_amount` | `numeric(12,2)` | `number` | Total invoice amount prior to Member 3 coupon discounts. |

### JSONB Structure of `lines`

Each item in the `lines` array contains:
```json
[
  {
    "line_id": "66666666-6666-6666-0000-000000000001",
    "product_id": "22222222-2222-2222-2222-000000000001",
    "product_name": "Brightloop CRM",
    "variant_id": "22222222-2222-2222-2222-000000000101",
    "quantity": 1,
    "unit_price": 2500.00,
    "tax_id": null,
    "amount": 2500.00
  }
]
```

### Example Row

```json
{
  "subscription_id": "55555555-5555-5555-0000-000000000001",
  "number": "SUB-000001",
  "customer_id": "11111111-1111-1111-1111-000000000001",
  "customer_name": "Acme Technologies",
  "customer_email": "customer01@example.test",
  "plan_id": "33333333-3333-3333-3333-000000000003",
  "plan_name": "Monthly Enterprise Plan",
  "billing_period": "monthly",
  "payment_terms": "net_30",
  "start_date": "2026-09-30",
  "expiry_date": "2027-09-30",
  "next_billing_date": "2026-10-31",
  "status": "active",
  "period_start": "2026-10-31",
  "period_end": "2026-11-29",
  "subtotal": 3300.00,
  "tax_total": 0.00,
  "total_amount": 3300.00,
  "lines": [
    {
      "line_id": "66666666-6666-6666-0000-000000000001",
      "product_id": "22222222-2222-2222-2222-000000000001",
      "product_name": "Brightloop CRM",
      "variant_id": "22222222-2222-2222-2222-000000000101",
      "quantity": 1,
      "unit_price": 2500.00,
      "tax_id": null,
      "amount": 2500.00
    },
    {
      "line_id": "77777777-7777-7777-0000-000000000001",
      "product_id": "22222222-2222-2222-2222-000000000003",
      "product_name": "Priority Support Add-on",
      "variant_id": "22222222-2222-2222-2222-000000000301",
      "quantity": 1,
      "unit_price": 800.00,
      "tax_id": null,
      "amount": 800.00
    }
  ]
}
```

---

## 3. Ownership of `next_billing_date`

1. **Member 2 initializes `next_billing_date`:**
   - When a subscription status transitions to `'active'` (via `public.change_subscription_status`), Member 2 sets `next_billing_date = start_date`.
2. **Member 3 advances `next_billing_date`:**
   - In the billing job, after successfully creating an invoice and its items, Member 3 **MUST** advance `subscriptions.next_billing_date` in the **SAME atomic database transaction**:
   ```sql
   update public.subscriptions
   set next_billing_date = public.next_billing_date_after(next_billing_date, 'monthly') -- or plan's billing_period
   where id = :subscription_id;
   ```
   - Always call `public.next_billing_date_after(d, period)` to ensure date calculations and month-end clampings remain consistent across the application.

---

## 4. Idempotency & Concurrency

- Member 3's `invoices` table defines:
  ```sql
  CONSTRAINT uq_subscription_period UNIQUE NULLS NOT DISTINCT (subscription_id, period_start)
  ```
- Use `period_start` from `public.billable_subscriptions` as the value for `invoices.period_start`.
- If an invoice generation job is interrupted or retried, this unique constraint prevents double-invoicing for the same cycle.

---

## 5. Catch-Up Loop for Overdue Subscriptions

If a subscription was overdue by multiple billing cycles (e.g., cron was offline for 3 months), the view returns the subscription once with its oldest overdue `next_billing_date`.

The billing job should execute a catch-up loop:
```ts
while (subscription.next_billing_date <= today && subscription.next_billing_date <= subscription.expiry_date) {
  // 1. Generate invoice for [period_start, period_end]
  // 2. Advance next_billing_date = next_billing_date_after(next_billing_date, billing_period)
  // 3. Commit transaction
}
```

---

## 6. Exclusions from the View

The view filters rows using:
```sql
where
  s.status = 'active'
  and s.next_billing_date is not null
  and s.next_billing_date <= current_date
  and s.next_billing_date <= s.expiry_date;
```

| State / Condition | Excluded? | Reason |
| :--- | :--- | :--- |
| `status = 'draft'` | Yes | Contract not finalized; not legally binding. |
| `status = 'quotation'` | Yes | Awaiting customer signature or review. |
| `status = 'confirmed'` | Yes | Awaiting activation. |
| `status = 'paused'` | Yes | Billing halted by customer/staff. |
| `status = 'closed'` | Yes | Contract terminated or expired. |
| `next_billing_date > CURRENT_DATE` | Yes | Future cycle; not yet due. |
| `next_billing_date > expiry_date` | Yes | Contract term has elapsed; needs renewal or closure. |

---

## 7. Status Rules & Plan Flags

| Plan Flag | When `false` | When `true` |
| :--- | :--- | :--- |
| `pausable` | Cannot transition `active -> paused`. Staff/customer cannot freeze billing. | Subscription can be paused and resumed. |
| `closable` | Cannot transition to `closed` before `expiry_date`. | Can be cancelled or terminated early. |
| `renewable` | Cannot be renewed past `expiry_date`. | Can be extended by adding another period. |
| `auto_close` | At expiry, status remains unchanged until manually closed. | Automatically closed at expiry by scheduled maintenance. |

---

## 8. Known Gaps & Separation of Concerns

1. **Taxes & Tax Rules:**
   - Member 2 provides baseline line amounts and `tax_id` placeholders.
   - Member 3 owns `tax_rules` and computes final line and total taxes.
2. **Discounts & Coupons:**
   - Member 3 owns `discounts` and promotional codes applied during invoicing.
3. **Payments:**
   - Payment processing, payment gateway integration, and webhook reconciliation belong exclusively to Member 3.
