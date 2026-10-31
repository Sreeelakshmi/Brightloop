import { Product, Plan, DiscountRule, TaxRule } from "@/types";

/**
 * ============================================================================
 * Pure Business Rules & Calculations (Client & Server Safe)
 * Zero dependencies on next/headers, node modules, or database storage.
 * ============================================================================
 */

/**
 * Calculates effective price: base sales price + variant extra price (e.g. Odoo adds ₹560)
 */
export function calculateEffectivePrice(product: Product, variantId?: string): number {
  if (!variantId) {
    return product.salesPrice;
  }
  const variant = product.variants?.find((v) => v.id === variantId);
  return product.salesPrice + (variant?.extraPrice || 0);
}

/**
 * Validates that a plan is within its availability window
 */
export function validatePlanAvailability(
  plan: Plan,
  dateStr?: string
): { valid: boolean; reason?: string } {
  if (!plan.active) {
    return { valid: false, reason: `Plan ${plan.name} is inactive.` };
  }

  const checkDate = dateStr || new Date().toISOString().slice(0, 10);

  if (plan.availableFrom && checkDate < plan.availableFrom) {
    return {
      valid: false,
      reason: `Plan ${plan.name} is not available until ${plan.availableFrom}.`,
    };
  }

  if (plan.availableTo && checkDate > plan.availableTo) {
    return {
      valid: false,
      reason: `Plan ${plan.name} expired on ${plan.availableTo}.`,
    };
  }

  return { valid: true };
}

/**
 * Validates that subscription line quantity meets plan minimum quantity requirement
 */
export function validatePlanQuantity(
  plan: Plan,
  quantity: number
): { valid: boolean; reason?: string } {
  const min = plan.minimumQuantity || 1;
  if (quantity < min) {
    return {
      valid: false,
      reason: `Plan ${plan.name} requires a minimum quantity of ${min} (provided: ${quantity}).`,
    };
  }
  return { valid: true };
}

/**
 * Checks if a discount coupon has passed its expiration date
 */
export function isDiscountExpired(discount: DiscountRule, todayStr?: string): boolean {
  const checkDate = todayStr || new Date().toISOString().slice(0, 10);
  return checkDate > discount.endDate;
}

/**
 * Checks if a discount coupon has reached its maximum usage limit
 */
export function isDiscountLimitReached(discount: DiscountRule): boolean {
  if (discount.usageLimit === undefined || discount.usageLimit === null) return false;
  return discount.usageCount >= discount.usageLimit;
}

/**
 * Calculates applicable taxes for a line item
 */
export function calculateLineTaxes(
  amount: number,
  productId?: string,
  taxRules?: TaxRule[]
): { totalTax: number; breakdown: Array<{ name: string; rate: number; amount: number }> } {
  if (!taxRules || taxRules.length === 0) {
    return { totalTax: 0, breakdown: [] };
  }

  let totalTax = 0;
  const breakdown: Array<{ name: string; rate: number; amount: number }> = [];

  for (const rule of taxRules) {
    if (!rule.active) continue;

    const isApplicable =
      rule.applicableProducts.includes("all") ||
      (productId && rule.applicableProducts.includes(productId));

    if (isApplicable) {
      const taxAmount =
        rule.type === "percentage"
          ? Math.round((amount * rule.rate) / 100)
          : Math.round(rule.rate);

      totalTax += taxAmount;
      breakdown.push({
        name: rule.name,
        rate: rule.rate,
        amount: taxAmount,
      });
    }
  }

  return { totalTax, breakdown };
}
