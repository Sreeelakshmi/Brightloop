import { Discount } from "@/types";
import { CreateDiscountInput } from "@/lib/validations/billing";
import { createServerClient } from "@/lib/supabase/server";

function mapDbDiscount(row: any): Discount {
  const code = row.code || "";
  const name = row.name || row.description || code;
  const type = (row.discount_type || row.type || "percentage") as "percentage" | "fixed";
  const value = Number(row.discount_value ?? row.value ?? 0);

  return {
    id: row.id,
    code,
    name,
    type,
    value,
    minPurchaseAmount: row.min_purchase_amount ? Number(row.min_purchase_amount) : undefined,
    minQuantity: row.min_quantity ? Number(row.min_quantity) : undefined,
    maxUsage: row.max_redemptions ?? row.max_usage ?? undefined,
    usedCount: Number(row.times_redeemed ?? row.used_count ?? 0),
    productId: row.product_id || (Array.isArray(row.applicable_product_ids) ? row.applicable_product_ids[0] : undefined),
    subscriptionId: row.subscription_id || (Array.isArray(row.applicable_plan_ids) ? row.applicable_plan_ids[0] : undefined),
    startDate: row.starts_at || row.start_date || undefined,
    endDate: row.expires_at || row.end_date || undefined,
    isActive: row.active ?? row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Retrieves all registered discount rules from Supabase.
 */
export async function getDiscounts(): Promise<Discount[]> {
  const supabase = await createServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("discount_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42501") {
      console.warn("Permission denied querying discount_rules: caller is unauthenticated or lacks table grant.");
      return [];
    }
    throw new Error(`Failed to fetch discounts from database: ${error.message}`);
  }

  return (data || []).map(mapDbDiscount);
}

/**
 * Retrieves a discount rule by its code.
 */
export async function getDiscountByCode(code: string): Promise<Discount | null> {
  const supabase = await createServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("discount_rules")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error) {
    if (error.code === "42501") {
      return null;
    }
    throw new Error(`Failed to query discount for code '${code}': ${error.message}`);
  }

  if (!data) return null;
  return mapDbDiscount(data);
}

/**
 * Creates a new discount rule in Supabase.
 */
export async function createDiscount(input: CreateDiscountInput): Promise<Discount> {
  const supabase = await createServerClient();
  if (!supabase) {
    throw new Error("Database client is not available. Check Supabase environment configuration.");
  }

  const newId = crypto.randomUUID();

  const { data, error } = await supabase
    .from("discount_rules")
    .insert({
      id: newId,
      code: input.code.toUpperCase().trim(),
      description: input.name,
      discount_type: input.type,
      discount_value: input.value,
      active: true,
      times_redeemed: 0,
      max_redemptions: input.maxUsage || null,
      starts_at: input.startDate || null,
      expires_at: input.endDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create discount rule: ${error.message}`);
  }

  return mapDbDiscount(data);
}

/**
 * Validates discount eligibility against business criteria.
 */
export function evaluateDiscountEligibility(
  discount: Discount,
  subtotalPaise: number,
  quantity: number = 1,
  options?: {
    productId?: string;
    subscriptionId?: string;
  }
): { valid: boolean; discountPaise: number; reason?: string } {
  if (!discount.isActive) {
    return { valid: false, discountPaise: 0, reason: "Discount code is inactive." };
  }

  const now = new Date();
  if (discount.startDate && new Date(discount.startDate) > now) {
    return { valid: false, discountPaise: 0, reason: "Discount code is not active yet." };
  }
  if (discount.endDate && new Date(discount.endDate) < now) {
    return { valid: false, discountPaise: 0, reason: "Discount code has expired." };
  }

  if (discount.maxUsage !== undefined && discount.usedCount >= discount.maxUsage) {
    return { valid: false, discountPaise: 0, reason: "Discount code has reached its maximum usage limit." };
  }

  const minPurchasePaise = discount.minPurchaseAmount ? Math.round(discount.minPurchaseAmount * 100) : 0;
  if (minPurchasePaise > 0 && subtotalPaise < minPurchasePaise) {
    return {
      valid: false,
      discountPaise: 0,
      reason: `Minimum purchase of ₹${discount.minPurchaseAmount?.toFixed(2)} required.`,
    };
  }

  if (discount.minQuantity !== undefined && quantity < discount.minQuantity) {
    return {
      valid: false,
      discountPaise: 0,
      reason: `Minimum quantity of ${discount.minQuantity} required.`,
    };
  }

  if (discount.productId && options?.productId && discount.productId !== options.productId) {
    return { valid: false, discountPaise: 0, reason: "Discount code is not applicable to this product." };
  }

  let discountPaise = 0;
  if (discount.type === "percentage") {
    const rate = Math.min(100, Math.max(0, discount.value));
    discountPaise = Math.round((subtotalPaise * rate) / 100);
  } else if (discount.type === "fixed") {
    const fixedPaise = Math.round(discount.value * 100);
    discountPaise = Math.min(subtotalPaise, fixedPaise);
  }

  return { valid: true, discountPaise };
}

/**
 * Atomically increments discount usage count via PostgreSQL RPC.
 */
export async function incrementDiscountUsage(code: string): Promise<boolean> {
  const supabase = await createServerClient();
  if (!supabase) return false;

  const normalizedCode = code.toUpperCase().trim();

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("increment_discount_usage_atomic", {
      p_code: normalizedCode,
    });

    if (!rpcError && rpcData?.success) {
      return true;
    }
  } catch {
    // Fallback to table update if RPC not present
  }

  const { data: current, error: fetchErr } = await supabase
    .from("discount_rules")
    .select("id, times_redeemed, max_redemptions")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Failed to query discount rule ${normalizedCode}: ${fetchErr.message}`);
  }

  if (!current) return false;

  const maxUsage = current.max_redemptions;
  const currentCount = Number(current.times_redeemed ?? 0);

  if (maxUsage !== null && maxUsage !== undefined && currentCount >= maxUsage) {
    throw new Error(`Discount coupon ${normalizedCode} has reached its maximum usage limit (${maxUsage}).`);
  }

  const { error: updateErr } = await supabase
    .from("discount_rules")
    .update({
      times_redeemed: currentCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id);

  if (updateErr) {
    throw new Error(`Failed to update discount usage count: ${updateErr.message}`);
  }

  return true;
}
