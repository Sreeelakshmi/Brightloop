import { requireUser } from "@/lib/auth/require-user";
import { getSupabaseClient } from "@/services/supabase-client";
import type { UserRole } from "@/types";
import type {
  BillableSubscription,
  BillableSubscriptionLine,
  BillingPeriod,
  PaymentTerms,
} from "@/types/subscription";

export interface GetBillableSubscriptionsParams {
  page?: number;
  pageSize?: number;
  asOf?: string;
}

export interface BillableSubscriptionLineRow {
  line_id?: string;
  product_id: string;
  product_name?: string;
  variant_id?: string | null;
  quantity: number;
  unit_price: number | string;
  tax_id?: string | null;
  amount: number | string;
}

export interface BillableSubscriptionRow {
  subscription_id: string;
  id?: string;
  number: string;
  customer_id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  plan_id: string;
  plan_name?: string;
  billing_period: string;
  payment_terms: string;
  start_date: string;
  expiry_date: string;
  next_billing_date: string;
  status: string;
  period_start: string;
  period_end: string;
  lines?: BillableSubscriptionLineRow[] | null;
  subtotal: number | string;
  tax_total: number | string;
  total_amount: number | string;
  created_at?: string;
  updated_at?: string;
}

const STAFF_ROLES: UserRole[] = ["owner", "admin", "finance", "support"];

/**
 * Maps a single raw database row from the `billable_subscriptions` view
 * (including its JSONB aggregated lines) to the typed `BillableSubscription` contract.
 */
export function mapBillableSubscriptionRow(
  row: BillableSubscriptionRow
): BillableSubscription {
  const lines: BillableSubscriptionLine[] = (row.lines ?? []).map((l) => ({
    id: l.line_id,
    lineId: l.line_id,
    productId: l.product_id,
    productName: l.product_name,
    variantId: l.variant_id ?? undefined,
    quantity: Number(l.quantity),
    unitPrice: typeof l.unit_price === "number" ? l.unit_price : Number(l.unit_price),
    taxId: l.tax_id ?? undefined,
    amount: typeof l.amount === "number" ? l.amount : Number(l.amount),
  }));

  return {
    id: row.subscription_id || row.id || "",
    subscriptionId: row.subscription_id || row.id || "",
    number: row.number,
    customerId: row.customer_id,
    customerName: row.customer_name ?? null,
    customerEmail: row.customer_email ?? null,
    planId: row.plan_id,
    planName: row.plan_name,
    billingPeriod: row.billing_period as BillingPeriod,
    paymentTerms: row.payment_terms as PaymentTerms,
    startDate: row.start_date,
    expiryDate: row.expiry_date,
    nextBillingDate: row.next_billing_date,
    status: "active",
    periodStart: row.period_start,
    periodEnd: row.period_end,
    subtotal: typeof row.subtotal === "number" ? row.subtotal : Number(row.subtotal),
    taxTotal: typeof row.tax_total === "number" ? row.tax_total : Number(row.tax_total),
    totalAmount: typeof row.total_amount === "number" ? row.total_amount : Number(row.total_amount),
    lines,
  };
}

/**
 * Fetch billable subscriptions currently due for invoicing.
 *
 * Restricted to internal staff (admin, owner, finance, support).
 * Customers are rejected before any database query executes.
 */
export async function getBillableSubscriptions(
  params: GetBillableSubscriptionsParams = {}
): Promise<{ data: BillableSubscription[]; total: number }> {
  // 1. Authenticate and enforce role gate
  const user = await requireUser();
  if (!user || !STAFF_ROLES.includes(user.role)) {
    throw new Error("Unauthorized: only admin and staff can access billable subscriptions");
  }

  const { page = 1, pageSize = 50, asOf } = params;
  const supabase = getSupabaseClient();

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  let query = supabase
    .from("billable_subscriptions")
    .select("*", { count: "exact" })
    .order("next_billing_date", { ascending: true });

  if (asOf) {
    query = query.lte("next_billing_date", asOf);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to fetch billable subscriptions: ${error.message}`);
  }

  const mappedData = (data ?? []).map((row: any) =>
    mapBillableSubscriptionRow(row as BillableSubscriptionRow)
  );

  return {
    data: mappedData,
    total: count ?? mappedData.length,
  };
}
