import { getSupabaseClient } from "@/services/supabase-client";
import { mapPlanRowToPlan } from "@/services/catalog-mappers";
import type {
  PaginationParams,
  PaginatedResult,
  PlanRow,
} from "@/types/catalog";
import type {
  SubscriptionLineWithId,
  SubscriptionStatusHistoryItem,
  SubscriptionWithDetails,
} from "@/types/subscription-services";
import type {
  PaymentTerms,
  SubscriptionCreate,
  SubscriptionLine,
  SubscriptionStatus,
} from "@/types/subscription";

export interface SubscriptionListParams extends PaginationParams {
  status?: SubscriptionStatus;
  customerId?: string;
}

export interface SubscriptionRow {
  id: string;
  number: string;
  customer_id: string;
  plan_id: string;
  template_id: string | null;
  start_date: string;
  expiry_date: string;
  payment_terms: string;
  status: string;
  next_billing_date: string | null;
  created_at: string;
  updated_at: string;
  plans?: PlanRow | null;
  subscription_lines?: SubscriptionLineRow[];
  subscription_status_history?: StatusHistoryRow[];
  profiles?: {
    id: string;
    email?: string;
    full_name?: string;
  } | null;
}

export interface SubscriptionLineRow {
  id: string;
  subscription_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number | string;
  tax_id: string | null;
  amount: number | string;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryRow {
  id: string;
  subscription_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
  created_at?: string;
}

export function mapSubscriptionLineRow(row: SubscriptionLineRow): SubscriptionLineWithId {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    productId: row.product_id,
    variantId: row.variant_id ?? undefined,
    quantity: row.quantity,
    unitPrice: typeof row.unit_price === "number" ? row.unit_price : Number(row.unit_price),
    taxId: row.tax_id ?? undefined,
    amount: typeof row.amount === "number" ? row.amount : Number(row.amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapStatusHistoryRow(row: StatusHistoryRow): SubscriptionStatusHistoryItem {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    fromStatus: (row.from_status as SubscriptionStatus) || null,
    toStatus: row.to_status as SubscriptionStatus,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
    createdAt: row.created_at,
  };
}

export function mapSubscriptionRow(
  row: SubscriptionRow,
  lines: SubscriptionLineRow[] = [],
  history: StatusHistoryRow[] = []
): SubscriptionWithDetails {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    planId: row.plan_id,
    templateId: row.template_id,
    startDate: row.start_date,
    expiryDate: row.expiry_date,
    paymentTerms: row.payment_terms as PaymentTerms,
    status: row.status as SubscriptionStatus,
    nextBillingDate: row.next_billing_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    plan: row.plans ? mapPlanRowToPlan(row.plans) : null,
    lines: (row.subscription_lines ?? lines).map(mapSubscriptionLineRow),
    history: (row.subscription_status_history ?? history).map(mapStatusHistoryRow),
    customer: row.profiles
      ? {
          id: row.profiles.id,
          email: row.profiles.email,
          name: row.profiles.full_name,
        }
      : null,
  };
}

/**
 * List subscriptions with optional status, search, and customerId filtering.
 */
export async function listSubscriptions(
  params: SubscriptionListParams = {}
): Promise<PaginatedResult<SubscriptionWithDetails>> {
  const { page = 1, pageSize = 20, status, search, customerId } = params;
  const supabase = getSupabaseClient();

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  let query = supabase
    .from("subscriptions")
    .select("*, plans(*), subscription_lines(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  if (search && search.trim().length > 0) {
    query = query.or(`number.ilike.%${search.trim()}%,payment_terms.ilike.%${search.trim()}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to list subscriptions: ${error.message}`);
  }

  const items = (data ?? []).map((row: any) =>
    mapSubscriptionRow(row as SubscriptionRow)
  );

  return {
    data: items,
    total: count ?? items.length,
  };
}

/**
 * Retrieve a full subscription detail with lines, plan, and status change audit trail.
 */
export async function getSubscription(
  id: string
): Promise<SubscriptionWithDetails | null> {
  const supabase = getSupabaseClient();

  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .select("*, plans(*), subscription_lines(*), subscription_status_history(*)")
    .eq("id", id)
    .maybeSingle();

  if (subError) {
    throw new Error(`Failed to fetch subscription: ${subError.message}`);
  }

  if (!subData) return null;

  return mapSubscriptionRow(subData as SubscriptionRow);
}

/**
 * Create a new subscription from an existing quotation template via atomic database RPC.
 */
export async function createSubscriptionFromTemplate(input: {
  templateId: string;
  customerId: string;
  startDate: string;
  expiryDate: string;
  paymentTerms: string;
}): Promise<SubscriptionWithDetails> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("create_subscription_from_template", {
    template_id: input.templateId,
    customer_id: input.customerId,
    start_date: input.startDate,
    expiry_date: input.expiryDate,
    payment_terms: input.paymentTerms,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create subscription from template.");
  }

  return getSubscription(data.id) as Promise<SubscriptionWithDetails>;
}

/**
 * Create a new draft subscription directly with custom lines (without a template).
 */
export async function createSubscriptionDraft(
  input: SubscriptionCreate
): Promise<SubscriptionWithDetails> {
  const supabase = getSupabaseClient();

  const { data: subData, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      customer_id: input.customerId,
      plan_id: input.planId,
      start_date: input.startDate,
      expiry_date: input.expiryDate,
      payment_terms: input.paymentTerms,
      status: "draft",
    })
    .select()
    .single();

  if (subError || !subData) {
    throw new Error(`Failed to create draft subscription: ${subError?.message ?? "Unknown error"}`);
  }

  const subId = subData.id;

  if (input.lines && input.lines.length > 0) {
    const lineInserts = input.lines.map((l: SubscriptionLine) => ({
      subscription_id: subId,
      product_id: l.productId,
      variant_id: l.variantId ?? null,
      quantity: l.quantity,
      unit_price: l.unitPrice,
      tax_id: l.taxId ?? null,
      amount: Math.round(l.quantity * l.unitPrice * 100) / 100,
    }));

    const { error: linesError } = await supabase
      .from("subscription_lines")
      .insert(lineInserts);

    if (linesError) {
      throw new Error(`Failed to save subscription lines: ${linesError.message}`);
    }
  }

  // Record initial status history
  await supabase.from("subscription_status_history").insert({
    subscription_id: subId,
    from_status: null,
    to_status: "draft",
    changed_at: new Date().toISOString(),
  });

  return (await getSubscription(subId))!;
}

/**
 * Transition subscription lifecycle state via the PostgreSQL security-definer function.
 */
export async function changeSubscriptionStatus(
  id: string,
  newStatus: SubscriptionStatus
): Promise<SubscriptionWithDetails> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("change_subscription_status", {
    sub_id: id,
    new_status: newStatus,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (await getSubscription(data.id || id))!;
}

/**
 * Renew an active subscription, extending its expiry_date by the plan billing period.
 */
export async function renewSubscription(
  id: string
): Promise<SubscriptionWithDetails> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("renew_subscription", {
    sub_id: id,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (await getSubscription(data.id || id))!;
}
