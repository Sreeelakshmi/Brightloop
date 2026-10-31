import { DiscountRule } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";
import { isDiscountExpired, isDiscountLimitReached } from "@/lib/business-rules";

export { isDiscountExpired, isDiscountLimitReached };

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listDiscounts(): Promise<DiscountRule[]> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    return db.store.discounts || [];
  }
  // TODO: Supabase implementation
  return [];
}

export async function createDiscountRule(
  input: {
    code: string;
    name: string;
    type: "percentage" | "fixed";
    value: number;
    minPurchaseAmount?: number;
    minQuantity?: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    scope: "subscription" | "product";
    applicableProducts?: string[];
  },
  actorRole: UserRole = "admin"
): Promise<DiscountRule> {
  // Spec requirement: Only Admin can create discount rules
  requireRole(actorRole, ["admin"]);

  if (!input.code?.trim()) throw new Error("Discount coupon code is required.");
  if (!input.name?.trim()) throw new Error("Discount name is required.");
  if (input.value <= 0) throw new Error("Discount value must be greater than zero.");
  if (!input.startDate || !input.endDate) throw new Error("Start and end dates are required.");
  if (input.startDate > input.endDate) throw new Error("Start date cannot be after end date.");

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const cleanCode = input.code.trim().toUpperCase();

    if (db.store.discounts.some((d) => d.code === cleanCode)) {
      throw new Error(`Discount coupon with code '${cleanCode}' already exists.`);
    }

    const id = `disc-${Date.now().toString(36)}`;
    const newRule: DiscountRule = {
      id,
      code: cleanCode,
      name: input.name.trim(),
      type: input.type,
      value: Number(input.value),
      minPurchaseAmount: input.minPurchaseAmount ? Number(input.minPurchaseAmount) : undefined,
      minQuantity: input.minQuantity ? Number(input.minQuantity) : undefined,
      startDate: input.startDate,
      endDate: input.endDate,
      usageLimit: input.usageLimit ? Number(input.usageLimit) : undefined,
      usageCount: 0,
      scope: input.scope,
      applicableProducts: input.applicableProducts,
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.store.discounts.unshift(newRule);
    saveMockDb(db);
    return newRule;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Validates and atomically applies a discount code to an invoice/subscription total
 */
export async function applyDiscountCode(
  code: string,
  subtotal: number,
  quantity = 1,
  todayStr?: string
): Promise<{ discountAmount: number; rule: DiscountRule }> {
  const checkDate = todayStr || new Date().toISOString().slice(0, 10);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const cleanCode = code.trim().toUpperCase();
    const rule = db.store.discounts.find((d) => d.code === cleanCode);

    if (!rule) {
      throw new Error(`Discount code '${cleanCode}' does not exist.`);
    }
    if (isDiscountExpired(rule, checkDate)) {
      throw new Error(`Discount code '${cleanCode}' expired on ${rule.endDate}.`);
    }
    if (!rule.active) {
      throw new Error(`Discount code '${cleanCode}' is disabled.`);
    }
    if (isDiscountLimitReached(rule)) {
      throw new Error(`Discount code '${cleanCode}' has reached its maximum usage limit.`);
    }
    if (rule.minPurchaseAmount && subtotal < rule.minPurchaseAmount) {
      throw new Error(
        `Discount code '${cleanCode}' requires a minimum purchase of ₹${rule.minPurchaseAmount.toLocaleString(
          "en-IN"
        )} (current: ₹${subtotal.toLocaleString("en-IN")}).`
      );
    }
    if (rule.minQuantity && quantity < rule.minQuantity) {
      throw new Error(
        `Discount code '${cleanCode}' requires a minimum quantity of ${rule.minQuantity}.`
      );
    }

    // Calculate discount value
    let discountAmount = 0;
    if (rule.type === "percentage") {
      discountAmount = Math.round((subtotal * rule.value) / 100);
    } else {
      discountAmount = Math.min(rule.value, subtotal);
    }

    // Atomically increment usage count
    rule.usageCount += 1;
    saveMockDb(db);

    return { discountAmount, rule };
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}
