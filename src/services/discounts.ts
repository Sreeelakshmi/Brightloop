import { Discount } from "@/types";
import { CreateDiscountInput } from "@/lib/validations/billing";
import { rupeesToPaise } from "@/lib/billing/math";
import { createServerClient } from "@/lib/supabase/server";

// Default deterministic discounts based on seed data
let discountsStore: Discount[] = [
  {
    id: "22222222-2222-4000-8000-000000000001",
    code: "WELCOME20",
    name: "New Subscriber 20% Off",
    type: "percentage",
    value: 20.0,
    minPurchaseAmount: 1000.0,
    minQuantity: 1,
    maxUsage: 500,
    usedCount: 42,
    isActive: true,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "22222222-2222-4000-8000-000000000002",
    code: "STARTUP500",
    name: "Flat Rs. 500 Startup Credit",
    type: "fixed",
    value: 500.0,
    minPurchaseAmount: 2000.0,
    minQuantity: 1,
    maxUsage: 200,
    usedCount: 18,
    isActive: true,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "22222222-2222-4000-8000-000000000003",
    code: "HACKATHON10",
    name: "Odoo Hackathon Special 10%",
    type: "percentage",
    value: 10.0,
    minPurchaseAmount: 500.0,
    minQuantity: 1,
    maxUsage: 1000,
    usedCount: 85,
    isActive: true,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "22222222-2222-4000-8000-000000000004",
    code: "ANNUAL15",
    name: "Annual Plan Incentive 15%",
    type: "percentage",
    value: 15.0,
    minPurchaseAmount: 5000.0,
    minQuantity: 1,
    maxUsage: 300,
    usedCount: 31,
    isActive: true,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

function mapDbDiscount(row: any): Discount {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    value: Number(row.value),
    minPurchaseAmount: row.min_purchase_amount ? Number(row.min_purchase_amount) : 0,
    minQuantity: row.min_quantity ? Number(row.min_quantity) : 1,
    maxUsage: row.max_usage ? Number(row.max_usage) : undefined,
    usedCount: Number(row.used_count || 0),
    productId: row.product_id || undefined,
    subscriptionId: row.subscription_id || undefined,
    startDate: row.start_date || undefined,
    endDate: row.end_date || undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDiscounts(): Promise<Discount[]> {
  const supabase = createServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDbDiscount);
      }
    } catch {
      // Fallback
    }
  }

  return [...discountsStore];
}

export async function getDiscountByCode(code: string): Promise<Discount | null> {
  const supabase = createServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .ilike("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        return mapDbDiscount(data);
      }
    } catch {
      // Fallback
    }
  }

  const discount = discountsStore.find(
    (d) => d.code.toUpperCase() === code.toUpperCase() && d.isActive
  );
  return discount ? { ...discount } : null;
}

export interface DiscountValidationResult {
  valid: boolean;
  reason?: string;
  discountPaise: number;
  discountRecord?: Discount;
}

/**
 * Validates discount eligibility against purchase constraints and calculates discount in paise.
 * Supports product-specific, subscription-specific, expiry, and quantity rules.
 */
export function evaluateDiscountEligibility(
  discount: Discount,
  subtotalPaise: number,
  quantity: number = 1,
  options?: { productId?: string; subscriptionId?: string }
): DiscountValidationResult {
  const now = new Date();

  // Active check
  if (!discount.isActive) {
    return { valid: false, reason: "Discount code is inactive.", discountPaise: 0 };
  }

  // Date validity
  if (discount.startDate && new Date(discount.startDate) > now) {
    return { valid: false, reason: "Discount code is not active yet.", discountPaise: 0 };
  }
  if (discount.endDate && new Date(discount.endDate) < now) {
    return { valid: false, reason: "Discount code has expired.", discountPaise: 0 };
  }

  // Product-specific check
  if (discount.productId && options?.productId && discount.productId !== options.productId) {
    return {
      valid: false,
      reason: "Discount code is not valid for this specific product tier.",
      discountPaise: 0,
    };
  }

  // Subscription-specific check
  if (discount.subscriptionId && options?.subscriptionId && discount.subscriptionId !== options.subscriptionId) {
    return {
      valid: false,
      reason: "Discount code is restricted to a different subscription account.",
      discountPaise: 0,
    };
  }

  // Usage limit
  if (discount.maxUsage && discount.usedCount >= discount.maxUsage) {
    return { valid: false, reason: "Discount usage limit has been reached.", discountPaise: 0 };
  }

  // Minimum quantity
  if (discount.minQuantity && quantity < discount.minQuantity) {
    return {
      valid: false,
      reason: `Requires minimum purchase quantity of ${discount.minQuantity}.`,
      discountPaise: 0,
    };
  }

  // Minimum purchase amount
  const minPurchasePaise = discount.minPurchaseAmount
    ? rupeesToPaise(discount.minPurchaseAmount)
    : 0;
  if (subtotalPaise < minPurchasePaise) {
    return {
      valid: false,
      reason: `Requires minimum purchase amount of ₹${discount.minPurchaseAmount?.toFixed(2)}.`,
      discountPaise: 0,
    };
  }

  // Compute discount paise
  let discountPaise = 0;
  if (discount.type === "percentage") {
    const rate = Math.min(100, Math.max(0, discount.value));
    discountPaise = Math.round((subtotalPaise * rate) / 100);
  } else if (discount.type === "fixed") {
    discountPaise = Math.min(subtotalPaise, rupeesToPaise(discount.value));
  }

  return {
    valid: true,
    discountPaise,
    discountRecord: discount,
  };
}

export async function createDiscount(input: CreateDiscountInput): Promise<Discount> {
  const code = input.code.toUpperCase();
  const supabase = createServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .insert({
          code,
          name: input.name,
          type: input.type,
          value: input.value,
          min_purchase_amount: input.minPurchaseAmount ?? 0,
          min_quantity: input.minQuantity ?? 1,
          max_usage: input.maxUsage,
          used_count: 0,
          start_date: input.startDate,
          end_date: input.endDate,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const created = mapDbDiscount(data);
      discountsStore.unshift(created);
      return created;
    } catch (err: any) {
      if (err.message && !err.message.includes("fetch failed")) {
        throw err;
      }
    }
  }

  // Local store fallback
  const existing = discountsStore.find((d) => d.code.toUpperCase() === code);
  if (existing) {
    throw new Error(`Discount code "${code}" already exists.`);
  }

  const newDiscount: Discount = {
    id: crypto.randomUUID(),
    code,
    name: input.name,
    type: input.type,
    value: input.value,
    minPurchaseAmount: input.minPurchaseAmount ?? 0,
    minQuantity: input.minQuantity ?? 1,
    maxUsage: input.maxUsage,
    usedCount: 0,
    startDate: input.startDate,
    endDate: input.endDate,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  discountsStore.unshift(newDiscount);
  return { ...newDiscount };
}

export async function incrementDiscountUsage(code: string): Promise<void> {
  const normalizedCode = code.toUpperCase();
  const supabase = createServerClient();

  if (supabase) {
    try {
      // Use atomic update
      const { data } = await supabase
        .from("discounts")
        .select("used_count")
        .eq("code", normalizedCode)
        .single();

      if (data) {
        await supabase
          .from("discounts")
          .update({
            used_count: (data.used_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("code", normalizedCode);
      }
    } catch {
      // Fallback to local
    }
  }

  const index = discountsStore.findIndex(
    (d) => d.code.toUpperCase() === normalizedCode
  );
  if (index !== -1) {
    discountsStore[index].usedCount += 1;
    discountsStore[index].updatedAt = new Date().toISOString();
  }
}
