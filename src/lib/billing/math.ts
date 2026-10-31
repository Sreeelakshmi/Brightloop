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

/**
 * Add months to a date clamping to month-end when day exceeds target month length.
 * Correctly handles edge cases like Jan 31 + 1 month -> Feb 28 (or Feb 29 in leap year).
 */
export function addMonthsClamped(dateInput: Date | string, months: number): Date {
  const d = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput.getTime());
  const originalDay = d.getUTCDate();
  const originalHours = d.getUTCHours();
  const originalMinutes = d.getUTCMinutes();
  const originalSeconds = d.getUTCSeconds();
  const originalMs = d.getUTCMilliseconds();

  const targetYear = d.getUTCFullYear();
  const targetMonth = d.getUTCMonth() + months;

  // Day 1 of target month in UTC
  const result = new Date(Date.UTC(targetYear, targetMonth, 1, originalHours, originalMinutes, originalSeconds, originalMs));

  // Determine last day of target month (day 0 of month + 1)
  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();

  // Clamp to valid day
  result.setUTCDate(Math.min(originalDay, lastDayOfTargetMonth));
  return result;
}

/**
 * Advances a billing date by daily, weekly, monthly, quarterly, or yearly frequency.
 * Enforces month-end date clamping (e.g. Jan 31 -> Feb 28).
 */
export function advanceBillingDate(
  currentDateStr: string,
  interval: string
): { nextBillingDate: string; nextPeriodEnd: string } {
  const current = new Date(currentDateStr);
  const freq = interval.toLowerCase();

  let nextStart: Date;
  let nextEnd: Date;

  switch (freq) {
    case "day":
    case "daily": {
      nextStart = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      nextEnd = new Date(nextStart.getTime() + 24 * 60 * 60 * 1000);
      break;
    }
    case "week":
    case "weekly": {
      nextStart = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
      nextEnd = new Date(nextStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    }
    case "quarter":
    case "quarterly": {
      nextStart = addMonthsClamped(current, 3);
      nextEnd = addMonthsClamped(nextStart, 3);
      break;
    }
    case "year":
    case "yearly":
    case "annual": {
      nextStart = addMonthsClamped(current, 12);
      nextEnd = addMonthsClamped(nextStart, 12);
      break;
    }
    case "month":
    case "monthly":
    default: {
      nextStart = addMonthsClamped(current, 1);
      nextEnd = addMonthsClamped(nextStart, 1);
      break;
    }
  }

  // End of cycle is 1 second before next cycle starts
  nextEnd = new Date(nextEnd.getTime() - 1000);

  return {
    nextBillingDate: nextStart.toISOString(),
    nextPeriodEnd: nextEnd.toISOString(),
  };
}

