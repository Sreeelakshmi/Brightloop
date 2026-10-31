# Brightloop API & Domain Contract

**Target Framework:** Next.js 14 App Router  
**Data Access Layer:** Supabase Client & Server SSR Helpers  
**Authentication:** Cookie-based session (`@supabase/ssr`) with Row Level Security (RLS)  
**Security Level:** Production-Hardened (No Direct Financial Updates via Client REST)

---

## 1. Domain Roles & Authorization

| Role | Access Level | Description |
| :--- | :--- | :--- |
| `admin` | Full System Access | Staff management, organization setup, system preferences, role assignment |
| `staff` | Operational Access | Product catalog, pricing plans, quotations, subscriptions, invoices, transactions |
| `customer` | End-User Access | View active subscriptions, download invoices, accept quotations via secure RPC |

---

## 2. Server RPCs & Procedural APIs

### 2.1 Customer Quotation Acceptance (`Member 2` & `Member 4`)
Customers cannot perform direct SQL `UPDATE` on quotations. Acceptance/rejection must be invoked via RPC:

```typescript
// Accept a sent quotation
const { data, error } = await supabase.rpc('accept_quotation', {
  target_quotation_id: 'quotation-uuid-here'
});
// Returns: { success: true, quotation_id: '...', status: 'accepted' }

// Reject a sent quotation
const { data, error } = await supabase.rpc('reject_quotation', {
  target_quotation_id: 'quotation-uuid-here',
  rejection_reason: 'Budget constraints'
});
// Returns: { success: true, quotation_id: '...', status: 'rejected' }
```

### 2.2 First-Admin Bootstrap (`Member 1`)
A one-time operation executed via `createAdminClient()` or Supabase SQL console:

```typescript
// Invoked strictly from trusted server environment using service_role key
const { data, error } = await supabaseAdmin.rpc('bootstrap_first_admin', {
  target_email: 'admin@brightloop.io'
});
```

### 2.3 Staff Role Promotion (`Member 1`)
Administrators can promote or demote users:

```typescript
const { data, error } = await supabase.rpc('set_user_role', {
  target_user_id: 'user-uuid',
  new_role: 'staff' // 'admin' | 'staff' | 'customer'
});
```

---

## 3. Server-Side Payment Processing (`Member 3`)

Customers **cannot** insert directly into `public.payments`. Payment settlement must be handled by a server action or API route using `createAdminClient()`:

- **Route:** `POST /api/billing/webhook` or Server Action `processPayment()`
- **Flow:**
  1. Client sends payment method token/intent.
  2. Server verifies customer ownership of the invoice.
  3. Server charges payment gateway (Stripe/Mock).
  4. Server writes verified transaction to `public.payments`.
  5. Server updates invoice `amount_paid` and `status = 'paid'`.

---

## 4. Standard REST Response Envelope

```typescript
// Success
{
  "success": true,
  "data": T,
  "message"?: string
}

// Error
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details"?: unknown
  }
}
```
