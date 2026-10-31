/**
 * Brightloop Subscription Pricing & Line Calculations
 *
 * Provides financial calculations for contract lines and subscription totals.
 * Integrated with Member 3's financial math and taxation engine.
 */

import { rupeesToPaise, paiseToRupees, calculateLineItem } from "@/lib/billing/math";

export interface PricingLineInput {
  unitPrice: number;
  variantExtra?: number;
  quantity: number;
}

export interface TaxAndDiscountCalculationStub {
  taxId?: string;
  taxAmount?: number;
  discountId?: string;
  discountAmount?: number;
}

/**
 * Calculates a single line item total:
 * `(unitPrice + variantExtra) * quantity` rounded to 2 decimal places.
 */
export function calculateLine(
  unitPrice: number,
  variantExtra: number = 0,
  quantity: number = 1
): number {
  const safeUnitPrice = Math.max(0, Number(unitPrice) || 0);
  const safeVariantExtra = Math.max(0, Number(variantExtra) || 0);
  const safeQuantity = Math.max(0, Number(quantity) || 0);

  const rawTotal = (safeUnitPrice + safeVariantExtra) * safeQuantity;
  return Math.round((rawTotal + Number.EPSILON) * 100) / 100;
}

/**
 * Computes the grand total for a set of subscription lines.
 * Returns the sum of all individual calculated lines rounded to 2 decimals.
 */
export function calculateSubscriptionTotal(
  lines: PricingLineInput[] = []
): number {
  if (!lines || lines.length === 0) {
    return 0;
  }

  const rawSum = lines.reduce((acc, line) => {
    return acc + calculateLine(line.unitPrice, line.variantExtra ?? 0, line.quantity);
  }, 0);

  return Math.round((rawSum + Number.EPSILON) * 100) / 100;
}

/**
 * Real tax and discount calculations backed by billing math.
 */
export async function computeLineTaxes(lineAmountRupees: number, taxRatePercent: number = 18): Promise<number> {
  const linePaise = rupeesToPaise(lineAmountRupees);
  const item = calculateLineItem({
    quantity: 1,
    unitPricePaise: linePaise,
    taxRatePercent,
  });
  return paiseToRupees(item.taxPaise);
}

export async function applyDiscountToSubtotal(subtotalRupees: number, discountPercent: number = 0): Promise<number> {
  if (discountPercent <= 0) return 0;
  const subtotalPaise = rupeesToPaise(subtotalRupees);
  const discountPaise = Math.round((subtotalPaise * discountPercent) / 100);
  return paiseToRupees(discountPaise);
}

export interface TaxAndDiscountEngine {
  computeLineTaxes?: (lineAmount: number, taxId?: string) => Promise<number>;
  applyDiscounts?: (subtotal: number, couponCode?: string) => Promise<number>;
}

export { rupeesToPaise, paiseToRupees, calculateLineItem };
