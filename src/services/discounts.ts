import { Discount } from "@/types";
import { CreateDiscountInput } from "@/lib/validations/billing";
import { rupeesToPaise } from "@/lib/billing/math";

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

export async function getDiscounts(): Promise<Discount[]> {
  return [...discountsStore];
}

export async function getDiscountByCode(code: string): Promise<Discount | null> {
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
 */
export function evaluateDiscountEligibility(
  discount: Discount,
  subtotalPaise: number,
  quantity: number = 1
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
  const existing = discountsStore.find(
    (d) => d.code.toUpperCase() === input.code.toUpperCase()
  );
  if (existing) {
    throw new Error(`Discount code "${input.code}" already exists.`);
  }

  const newDiscount: Discount = {
    id: crypto.randomUUID(),
    code: input.code.toUpperCase(),
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
  const index = discountsStore.findIndex(
    (d) => d.code.toUpperCase() === code.toUpperCase()
  );
  if (index !== -1) {
    discountsStore[index].usedCount += 1;
    discountsStore[index].updatedAt = new Date().toISOString();
  }
}

