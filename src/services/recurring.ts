import { SubscriptionBillingContract, DetailedInvoice, BillingFrequency, BillingInterval } from "@/types";
import { createInvoice } from "./invoices";

// Active subscriptions store (integrating Member 2 contract)
let activeSubscriptionsStore: SubscriptionBillingContract[] = [
  {
    subscriptionId: "sub-odoo-001",
    customerId: "a0000000-0000-4000-8000-000000000001",
    customerName: "Astra Tech Solutions",
    customerEmail: "billing@astratech.in",
    planId: "plan-cloud-enterprise",
    planName: "Enterprise Cloud Subscription",
    quantity: 1,
    unitPricePaise: 499900,
    billingInterval: "month",
    currentPeriodStart: "2026-10-01T00:00:00Z",
    currentPeriodEnd: "2026-10-31T23:59:59Z",
    nextBillingDate: "2026-10-31T00:00:00Z", // Due for recurring run
    status: "active",
    taxRuleCode: "GST_18",
  },
  {
    subscriptionId: "sub-odoo-002",
    customerId: "a0000000-0000-4000-8000-000000000002",
    customerName: "Nexora Analytics",
    customerEmail: "finance@nexora.io",
    planId: "plan-pro-business",
    planName: "Pro Business Plan",
    quantity: 1,
    unitPricePaise: 299900,
    billingInterval: "month",
    currentPeriodStart: "2026-10-02T00:00:00Z",
    currentPeriodEnd: "2026-11-01T23:59:59Z",
    nextBillingDate: "2026-11-01T00:00:00Z",
    status: "active",
    taxRuleCode: "GST_18",
    discountCode: "WELCOME20",
  },
  {
    subscriptionId: "sub-odoo-003",
    customerId: "a0000000-0000-4000-8000-000000000005",
    customerName: "Zenith Retail Tech",
    customerEmail: "pay@zenithretail.in",
    planId: "plan-pos-hub",
    planName: "Retail POS Backend Integration Hub",
    quantity: 2,
    unitPricePaise: 425000,
    billingInterval: "month",
    currentPeriodStart: "2026-10-25T00:00:00Z",
    currentPeriodEnd: "2026-11-24T23:59:59Z",
    nextBillingDate: "2026-11-25T00:00:00Z",
    status: "active",
    taxRuleCode: "GST_18",
  },
  {
    subscriptionId: "sub-odoo-004",
    customerId: "a0000000-0000-4000-8000-000000000003",
    customerName: "Kite Fintech Labs",
    customerEmail: "accounts@kitefintech.com",
    planId: "plan-api-metered-weekly",
    planName: "High-Frequency FinTech Gateway",
    quantity: 1,
    unitPricePaise: 150000,
    billingInterval: "week",
    currentPeriodStart: "2026-10-24T00:00:00Z",
    currentPeriodEnd: "2026-10-30T23:59:59Z",
    nextBillingDate: "2026-10-31T00:00:00Z", // Due for recurring run
    status: "active",
    taxRuleCode: "GST_18",
  },
  {
    subscriptionId: "sub-odoo-005",
    customerId: "a0000000-0000-4000-8000-000000000004",
    customerName: "CloudScale Systems",
    customerEmail: "ops@cloudscale.net",
    planId: "plan-dev-sandbox-daily",
    planName: "On-Demand Cloud Sandbox",
    quantity: 1,
    unitPricePaise: 25000,
    billingInterval: "day",
    currentPeriodStart: "2026-10-30T00:00:00Z",
    currentPeriodEnd: "2026-10-30T23:59:59Z",
    nextBillingDate: "2026-10-31T00:00:00Z", // Due for recurring run
    status: "active",
    taxRuleCode: "GST_18",
  },
];

/**
 * Calculates next date advancing by interval safely
 * Supports daily, weekly, monthly, quarterly, and yearly frequencies
 */
export function advanceBillingDate(
  currentDateStr: string,
  interval: BillingInterval | BillingFrequency | string
): { nextBillingDate: string; nextPeriodEnd: string } {
  const current = new Date(currentDateStr);
  const nextStart = new Date(current);
  const nextEnd = new Date(current);

  const freq = interval.toLowerCase();

  switch (freq) {
    case "day":
    case "daily":
      nextStart.setDate(nextStart.getDate() + 1);
      nextEnd.setDate(nextEnd.getDate() + 2);
      break;
    case "week":
    case "weekly":
      nextStart.setDate(nextStart.getDate() + 7);
      nextEnd.setDate(nextEnd.getDate() + 14);
      break;
    case "quarter":
    case "quarterly":
      nextStart.setMonth(nextStart.getMonth() + 3);
      nextEnd.setMonth(nextEnd.getMonth() + 6);
      break;
    case "year":
    case "yearly":
    case "annual":
      nextStart.setFullYear(nextStart.getFullYear() + 1);
      nextEnd.setFullYear(nextEnd.getFullYear() + 2);
      break;
    case "month":
    case "monthly":
    default:
      nextStart.setMonth(nextStart.getMonth() + 1);
      nextEnd.setMonth(nextEnd.getMonth() + 2);
      break;
  }

  nextEnd.setSeconds(nextEnd.getSeconds() - 1);

  return {
    nextBillingDate: nextStart.toISOString(),
    nextPeriodEnd: nextEnd.toISOString(),
  };
}

export interface RecurringBillingResult {
  runTimestamp: string;
  processedCount: number;
  invoicesCreated: DetailedInvoice[];
  skippedDuplicateCount: number;
  errors: { subscriptionId: string; error: string }[];
}

/**
 * Core Recurring Billing Execution Engine
 * Enforces atomic invoice generation and date advancement with idempotency lock
 */
export async function runRecurringBilling(options?: {
  targetDate?: string;
  dryRun?: boolean;
}): Promise<RecurringBillingResult> {
  const targetTime = options?.targetDate ? new Date(options.targetDate) : new Date();
  const runTimestamp = new Date().toISOString();

  // Find eligible subscriptions
  const dueSubscriptions = activeSubscriptionsStore.filter(
    (sub) => sub.status === "active" && new Date(sub.nextBillingDate) <= targetTime
  );

  const result: RecurringBillingResult = {
    runTimestamp,
    processedCount: dueSubscriptions.length,
    invoicesCreated: [],
    skippedDuplicateCount: 0,
    errors: [],
  };

  for (const sub of dueSubscriptions) {
    try {
      // 1. Calculate due date (14 days from billing date)
      const billingDateObj = new Date(sub.nextBillingDate);
      const dueDateObj = new Date(billingDateObj);
      dueDateObj.setDate(dueDateObj.getDate() + 14);

      // Period dates
      const periodStart = sub.nextBillingDate;
      const { nextBillingDate: advancedDate, nextPeriodEnd: periodEnd } = advanceBillingDate(
        sub.nextBillingDate,
        sub.billingInterval
      );

      if (options?.dryRun) {
        result.skippedDuplicateCount++;
        continue;
      }

      // 2. Create Invoice
      const newInvoice = await createInvoice({
        customerId: sub.customerId,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
        subscriptionId: sub.subscriptionId,
        dueDate: dueDateObj.toISOString(),
        periodStart,
        periodEnd,
        notes: `Automated recurring billing for ${sub.planName} (${sub.billingInterval} cycle)`,
        items: [
          {
            description: `${sub.planName} (${sub.billingInterval} cycle)`,
            quantity: sub.quantity,
            unitPricePaise: sub.unitPricePaise,
            taxRatePercent: 18,
            discountCode: sub.discountCode,
          },
        ],
      });

      // 3. Atomically advance next_billing_date ONLY after successful invoice creation
      sub.currentPeriodStart = periodStart;
      sub.currentPeriodEnd = periodEnd;
      sub.nextBillingDate = advancedDate;

      result.invoicesCreated.push(newInvoice);
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        result.skippedDuplicateCount++;
        // Sync date so subscription doesn't remain perpetually stuck on already-billed period
        const { nextBillingDate: advancedDate } = advanceBillingDate(
          sub.nextBillingDate,
          sub.billingInterval
        );
        sub.nextBillingDate = advancedDate;
      } else {
        result.errors.push({
          subscriptionId: sub.subscriptionId,
          error: err.message || "Failed to process recurring billing.",
        });
      }
    }
  }

  return result;
}

export async function getActiveSubscriptions(): Promise<SubscriptionBillingContract[]> {
  return [...activeSubscriptionsStore];
}
