/**
 * Brightloop Telemetry Formatters
 * Formats financial figures, dates, and metrics with tabular numeral guarantees.
 */

export interface FormatMoneyOptions {
  currency?: string;
  locale?: string;
  decimals?: number;
  useIndianFormat?: boolean;
}

/**
 * Formats monetary amounts with tabular figures and configurable currency symbols.
 * Default locale is 'en-IN' to match the system telemetry mockup (e.g. ₹48,92,500).
 */
export function formatMoney(
  amount: number | null | undefined,
  options: FormatMoneyOptions = {}
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "—";
  }

  const {
    currency = "₹",
    locale = "en-IN",
    decimals = 0,
  } = options;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${currency}${formatter.format(amount)}`;
  } catch {
    // Fallback formatting
    return `${currency}${amount.toLocaleString()}`;
  }
}

/**
 * Formats dates into telemetry standard representations.
 * Default format: 'DD.MM.YYYY' (e.g. 31.10.2026) or 'YYYY-MM-DD'.
 */
export function formatDate(
  dateInput: string | number | Date | null | undefined,
  style: "telemetry" | "iso" | "short" | "display" = "telemetry"
): string {
  if (!dateInput) return "—";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  if (style === "telemetry") {
    return `${day}.${month}.${year}`;
  }

  if (style === "iso") {
    return `${year}-${month}-${day}`;
  }

  if (style === "short") {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${day}`;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats plain counts and integer metrics with thousand separators.
 */
export function formatNumber(
  num: number | null | undefined,
  locale: string = "en-IN"
): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formats telemetry percentages with optional delta arrows.
 */
export function formatPercent(
  val: number | null | undefined,
  includeSign: boolean = true
): string {
  if (val === null || val === undefined || isNaN(val)) return "0%";
  const sign = includeSign && val > 0 ? "+" : "";
  return `${sign}${val.toFixed(1)}%`;
}

