/**
 * Brightloop Subscription Pricing & Line Calculations
 *
 * Provides financial calculations for contract lines and subscription totals.
 * All amounts are computed and rounded to 2 decimal places to prevent IEEE 754 float drift.
 *
 * NOTE: The unit_price persisted on a `subscription_lines` row already includes
 * any variant surcharge (variantExtra).
 */

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
 * Interface stub for regional taxes and discount computations.
 *
 * TODO(member-3): Member 3 on `feature/billing-payments` owns the full tax and discount
 * engine. When integrated, wire this stub into Member 3's billing calculation services.
 */
export interface TaxAndDiscountEngine {
  computeLineTaxes?: (lineAmount: number, taxId?: string) => Promise<number>;
  applyDiscounts?: (subtotal: number, couponCode?: string) => Promise<number>;
}

