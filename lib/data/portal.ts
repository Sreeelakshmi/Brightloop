import {
  Customer,
  Invoice,
  PaginatedResult,
  Payment,
  Subscription,
} from "@/types";
import { getMockStore } from "./mock-generator";
import { shouldUseMockData } from "./dashboard";
import { supabase } from "@/lib/supabase";

/**
 * Customer Portal Data Access Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * SECURITY CONTRACT (Step 9 — Access Control Hardening):
 *   - Every exported function receives `customerId` from the SERVER SESSION
 *     (getCurrentUser().customerId).  The caller MUST NEVER pass a customerId
 *     taken from URL params or request bodies.
 *   - Single-entity getters (`getMySubscription`, `getMyInvoice`) do an
 *     explicit ownership check: if the found row's `customerId` does not match
 *     the session customer, they return `null` so the calling page can call
 *     `notFound()`.  This prevents IDOR (Insecure Direct Object Reference).
 *   - In production, Supabase Row Level Security (see docs/member4-rls-policies.sql)
 *     provides a second independent layer of enforcement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ==========================================
// 1. GET MY SUBSCRIPTIONS
// ==========================================

export async function getMySubscriptions(
  customerId: string
): Promise<Subscription[]> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    const subs = store.subscriptions.filter((s) => s.customerId === customerId);
    // Demo fallback: assign first 3 subscriptions to this customer if no direct match
    if (subs.length === 0) {
      return store.subscriptions.slice(0, 3).map((s) => ({
        ...s,
        customerId,
        customer: store.customers[0],
      }));
    }
    return subs;
  }

  const { data, error } = await supabase
    .from("view_portal_subscriptions")
    .select("*, plan:plans(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

// ==========================================
// 2. GET MY SUBSCRIPTION (SINGLE — OWNERSHIP CHECK)
// ==========================================

export async function getMySubscription(
  id: string,
  customerId: string
): Promise<Subscription | null> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    const found = store.subscriptions.find((s) => s.id === id);
    if (!found) return null;

    // ── OWNERSHIP CHECK ─────────────────────────────────────────────────────
    // If the subscription belongs to a different customer, return null → 404.
    if (found.customerId !== customerId) return null;
    // ────────────────────────────────────────────────────────────────────────

    return found;
  }

  const { data, error } = await supabase
    .from("view_portal_subscriptions")
    .select("*, plan:plans(*), lines:subscription_lines(*)")
    .eq("id", id)
    .eq("customer_id", customerId) // RLS + application-level double-check
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// 3. GET MY INVOICES (PAGINATED)
// ==========================================

export async function getMyInvoices(
  customerId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResult<Invoice>> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    let invoices = store.invoices.filter((i) => i.customerId === customerId);

    // Demo fallback: if customer has zero invoices, borrow first 5 for portal preview
    if (invoices.length === 0) {
      invoices = store.invoices.slice(0, 5).map((inv) => ({
        ...inv,
        customerId,
      }));
    }

    const total = invoices.length;
    const start = (page - 1) * pageSize;
    const data = invoices.slice(start, start + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from("invoices")
    .select("*, lines:invoice_lines(*)", { count: "exact" })
    .eq("customer_id", customerId)
    .order("issue_date", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize) || 1,
  };
}

// ==========================================
// 4. GET MY INVOICE (SINGLE — OWNERSHIP CHECK)
// ==========================================

export async function getMyInvoice(
  id: string,
  customerId: string
): Promise<Invoice | null> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    const found = store.invoices.find((i) => i.id === id);
    if (!found) return null;

    // ── OWNERSHIP CHECK ─────────────────────────────────────────────────────
    if (found.customerId !== customerId) return null;
    // ────────────────────────────────────────────────────────────────────────

    // Ensure invoice lines exist for the printable sheet
    if (!found.lines || found.lines.length === 0) {
      const base = Math.round(found.totalAmount / 1.18);
      const tax = found.totalAmount - base;
      return {
        ...found,
        lines: [
          {
            id: `${found.id}-line-1`,
            invoiceId: found.id,
            description: "Subscription Service — Base Plan",
            quantity: 1,
            unitPrice: base,
            amount: base,
          },
          {
            id: `${found.id}-line-2`,
            invoiceId: found.id,
            description: "GST (18%)",
            quantity: 1,
            unitPrice: tax,
            amount: tax,
          },
        ],
      };
    }

    return found;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*, lines:invoice_lines(*), customer:customers(*)")
    .eq("id", id)
    .eq("customer_id", customerId) // RLS + application-level double-check
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// 5. GET MY PAYMENTS
// ==========================================

export async function getMyPayments(
  customerId: string
): Promise<Payment[]> {
  if (shouldUseMockData()) {
    const store = getMockStore();
    const payments = store.payments.filter((p) => p.customerId === customerId);
    if (payments.length === 0) {
      return store.payments.slice(0, 5).map((p) => ({
        ...p,
        customerId,
      }));
    }
    return payments;
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", customerId)
    .order("payment_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
