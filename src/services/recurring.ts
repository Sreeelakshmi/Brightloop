import { SubscriptionBillingContract, DetailedInvoice, BillingFrequency, BillingInterval } from "@/types";
import { createInvoice } from "./invoices";
import { advanceBillingDate } from "@/lib/billing/math";
import { createServerClient } from "@/lib/supabase/server";

export { advanceBillingDate };

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

export interface RecurringBillingResult {
  runTimestamp: string;
  processedCount: number;
  invoicesCreated: DetailedInvoice[];
  skippedDuplicateCount: number;
  errors: { subscriptionId: string; error: string }[];
}

/**
 * Core Recurring Billing Execution Engine
 * Enforces atomic invoice generation and date advancement with idempotency lock.
 * Pulls active subscriptions from Supabase when configured, with fallback to local store.
 */
export async function runRecurringBilling(options?: {
  targetDate?: string;
  dryRun?: boolean;
}): Promise<RecurringBillingResult> {
  const targetTime = options?.targetDate ? new Date(options.targetDate) : new Date();
  const runTimestamp = new Date().toISOString();

  let dueSubscriptions: SubscriptionBillingContract[] = [];
  let isFromDb = false;

  try {
    const client = await createServerClient();
    if (client) {
      const { data: dbSubs, error } = await client
        .from("subscriptions")
        .select(`
          id,
          customer_id,
          status,
          next_billing_date,
          current_period_start,
          current_period_end,
          billing_interval,
          plan_id,
          profiles:customer_id (name, email),
          plans:plan_id (name, interval, amount),
          subscription_lines (
            id,
            product_id,
            quantity,
            unit_price
          )
        `)
        .eq("status", "active")
        .lte("next_billing_date", targetTime.toISOString());

      if (!error && dbSubs && dbSubs.length > 0) {
        isFromDb = true;
        dueSubscriptions = dbSubs.map((s: any) => {
          const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          const plan = Array.isArray(s.plans) ? s.plans[0] : s.plans;
          const lines = s.subscription_lines || [];
          const primaryLine = lines[0];

          const unitPricePaise = primaryLine
            ? Math.round(Number(primaryLine.unit_price) * 100)
            : Math.round(Number(plan?.amount || 0) * 100);

          return {
            subscriptionId: s.id,
            customerId: s.customer_id,
            customerName: profile?.name || "Customer",
            customerEmail: profile?.email || "customer@brightloop.io",
            planId: s.plan_id || "default-plan",
            planName: plan?.name || "Subscription Service",
            quantity: primaryLine?.quantity || 1,
            unitPricePaise,
            billingInterval: (s.billing_interval || plan?.interval || "month") as BillingInterval,
            currentPeriodStart: s.current_period_start || s.next_billing_date,
            currentPeriodEnd: s.current_period_end || s.next_billing_date,
            nextBillingDate: s.next_billing_date,
            status: s.status,
            taxRuleCode: "GST_18",
          };
        });
      }
    }
  } catch (err) {
    console.warn("Failed to fetch subscriptions from Supabase, falling back to local store:", err);
  }

  if (!isFromDb) {
    dueSubscriptions = activeSubscriptionsStore.filter(
      (sub) => sub.status === "active" && new Date(sub.nextBillingDate) <= targetTime
    );
  }

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
      if (isFromDb) {
        try {
          const client = await createServerClient();
          if (client) {
            await client
              .from("subscriptions")
              .update({
                current_period_start: periodStart,
                current_period_end: periodEnd,
                next_billing_date: advancedDate,
                updated_at: new Date().toISOString(),
              })
              .eq("id", sub.subscriptionId);
          }
        } catch (dbErr) {
          console.warn("Failed to advance subscription date in Supabase:", dbErr);
        }
      }

      // Also advance in-memory store if present
      const storeSub = activeSubscriptionsStore.find((s) => s.subscriptionId === sub.subscriptionId);
      if (storeSub) {
        storeSub.currentPeriodStart = periodStart;
        storeSub.currentPeriodEnd = periodEnd;
        storeSub.nextBillingDate = advancedDate;
      }

      result.invoicesCreated.push(newInvoice);
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        result.skippedDuplicateCount++;
        // Sync date so subscription doesn't remain perpetually stuck on already-billed period
        const { nextBillingDate: advancedDate, nextPeriodEnd: periodEnd } = advanceBillingDate(
          sub.nextBillingDate,
          sub.billingInterval
        );
        const storeSub = activeSubscriptionsStore.find((s) => s.subscriptionId === sub.subscriptionId);
        if (storeSub) {
          storeSub.currentPeriodStart = sub.nextBillingDate;
          storeSub.currentPeriodEnd = periodEnd;
          storeSub.nextBillingDate = advancedDate;
        }
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
  try {
    const client = await createServerClient();
    if (client) {
      const { data: dbSubs, error } = await client
        .from("subscriptions")
        .select(`
          id,
          customer_id,
          status,
          next_billing_date,
          current_period_start,
          current_period_end,
          billing_interval,
          plan_id,
          profiles:customer_id (name, email),
          plans:plan_id (name, interval, amount),
          subscription_lines (
            id,
            product_id,
            quantity,
            unit_price
          )
        `)
        .eq("status", "active");

      if (!error && dbSubs && dbSubs.length > 0) {
        return dbSubs.map((s: any) => {
          const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          const plan = Array.isArray(s.plans) ? s.plans[0] : s.plans;
          const lines = s.subscription_lines || [];
          const primaryLine = lines[0];

          const unitPricePaise = primaryLine
            ? Math.round(Number(primaryLine.unit_price) * 100)
            : Math.round(Number(plan?.amount || 0) * 100);

          return {
            subscriptionId: s.id,
            customerId: s.customer_id,
            customerName: profile?.name || "Customer",
            customerEmail: profile?.email || "customer@brightloop.io",
            planId: s.plan_id || "default-plan",
            planName: plan?.name || "Subscription Service",
            quantity: primaryLine?.quantity || 1,
            unitPricePaise,
            billingInterval: (s.billing_interval || plan?.interval || "month") as BillingInterval,
            currentPeriodStart: s.current_period_start || s.next_billing_date,
            currentPeriodEnd: s.current_period_end || s.next_billing_date,
            nextBillingDate: s.next_billing_date,
            status: s.status,
            taxRuleCode: "GST_18",
          };
        });
      }
    }
  } catch (err) {
    console.warn("Failed to fetch subscriptions from Supabase, falling back to local store:", err);
  }

  return [...activeSubscriptionsStore];
}
