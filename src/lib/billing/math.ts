/**
 * Brightloop Financial Arithmetic & Precision Engine
 * 
 * Strict compliance with Member 3 specification:
 * - All calculations in integer paise (1 INR = 100 paise)
 * - Safe rounding policy to eliminate IEEE 754 floating point drift
 * - Strict server-side validation of totals and overpayment rejection
 */

export interface LineItemCalculationInput {
  quantity: number;
  unitPricePaise: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number; // percentage (e.g. 10 for 10%) or fixed paise (e.g. 50000 for ₹500)
  taxRatePercent?: number; // e.g. 18 for 18% GST
}

export interface LineItemCalculationResult {
  quantity: number;
  unitPricePaise: number;
  subtotalPaise: number;
  discountPaise: number;
  taxablePaise: number;
  taxRatePercent: number;
  taxPaise: number;
  totalPaise: number;
}

export interface InvoiceCalculationSummary {
  subtotalPaise: number;
  discountTotalPaise: number;
  taxTotalPaise: number;
  totalPaise: number;
  amountPaidPaise: number;
  amountDuePaise: number;
  items: LineItemCalculationResult[];
}

/**
 * Convert Rupees (float or integer) to integer paise.
 * e.g., 49.99 -> 4999, 100 -> 10000
 */
export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || !isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Convert integer paise to Rupees (number with 2 decimal places).
 * e.g., 4999 -> 49.99
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise) || !isFinite(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

/**
 * Format paise into Indian Rupee standard format (e.g. ₹1,24,999.00).
 */
export function formatINR(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Calculate financial totals for a single invoice line item.
 * 
 * Sequence:
 * 1. Subtotal = quantity * unitPricePaise
 * 2. Discount:
 *    - percentage: round(Subtotal * (discountValue / 100))
 *    - fixed: min(Subtotal, discountValue)
 * 3. Taxable Base = max(0, Subtotal - Discount)
 * 4. Tax = round(Taxable Base * (taxRatePercent / 100))
 * 5. Line Total = Taxable Base + Tax
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const quantity = Math.max(1, Math.floor(input.quantity || 1));
  const unitPricePaise = Math.max(0, Math.floor(input.unitPricePaise || 0));
  const subtotalPaise = quantity * unitPricePaise;

  let discountPaise = 0;
  if (input.discountType && input.discountValue && input.discountValue > 0) {
    if (input.discountType === "percentage") {
      const rate = Math.min(100, Math.max(0, input.discountValue));
      discountPaise = Math.round((subtotalPaise * rate) / 100);
    } else if (input.discountType === "fixed") {
      discountPaise = Math.min(subtotalPaise, Math.max(0, Math.floor(input.discountValue)));
    }
  }

  const taxablePaise = Math.max(0, subtotalPaise - discountPaise);
  const taxRatePercent = Math.max(0, input.taxRatePercent || 0);
  const taxPaise = Math.round((taxablePaise * taxRatePercent) / 100);
  const totalPaise = taxablePaise + taxPaise;

  return {
    quantity,
    unitPricePaise,
    subtotalPaise,
    discountPaise,
    taxablePaise,
    taxRatePercent,
    taxPaise,
    totalPaise,
  };
}

/**
 * Recalculate full invoice totals from raw items.
 * Ensures consistent precision across all line items and enforces non-negative sums.
 */
export function calculateInvoiceTotals(
  items: LineItemCalculationInput[],
  amountPaidPaise: number = 0
): InvoiceCalculationSummary {
  const calculatedItems = items.map(calculateLineItem);

  const subtotalPaise = calculatedItems.reduce((acc, item) => acc + item.subtotalPaise, 0);
  const discountTotalPaise = calculatedItems.reduce((acc, item) => acc + item.discountPaise, 0);
  const taxTotalPaise = calculatedItems.reduce((acc, item) => acc + item.taxPaise, 0);
  const totalPaise = calculatedItems.reduce((acc, item) => acc + item.totalPaise, 0);

  const safeAmountPaidPaise = Math.min(totalPaise, Math.max(0, Math.floor(amountPaidPaise || 0)));
  const amountDuePaise = Math.max(0, totalPaise - safeAmountPaidPaise);

  return {
    subtotalPaise,
    discountTotalPaise,
    taxTotalPaise,
    totalPaise,
    amountPaidPaise: safeAmountPaidPaise,
    amountDuePaise,
    items: calculatedItems,
  };
}

/**
 * Validate a payment amount against an outstanding invoice balance.
 * Returns error string if invalid, or null if valid.
 */
export function validatePaymentAmount(paymentPaise: number, amountDuePaise: number): string | null {
  if (isNaN(paymentPaise) || paymentPaise <= 0) {
    return "Payment amount must be greater than zero.";
  }
  if (paymentPaise > amountDuePaise) {
    return `Payment amount (${formatINR(paymentPaise)}) cannot exceed outstanding balance (${formatINR(amountDuePaise)}).`;
  }
  return null;
}

