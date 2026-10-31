import {
  SubscriptionBillingContract,
  DetailedInvoice,
  BillingInterval,
  BillingFrequency,
} from "@/types";
import { createInvoice, getInvoiceById } from "./invoices";
import {
  advanceBillingDate,
  calculateInvoiceTotals,
  LineItemCalculationInput,
  paiseToRupees,
} from "@/lib/billing/math";
import { evaluateDiscountEligibility, getDiscountByCode, incrementDiscountUsage } from "./discounts";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";

export { advanceBillingDate };

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
 * Pulls active subscriptions from Supabase database.
 */
export async function runRecurringBilling(options?: {
  targetDate?: string;
  dryRun?: boolean;
}): Promise<RecurringBillingResult> {
  const targetTime = options?.targetDate ? new Date(options.targetDate) : new Date();
  const runTimestamp = new Date().toISOString();

  // Use admin client for automated / background billing execution across customer accounts
  const client = (await createAdminClient()) || (await createServerClient());
  if (!client) {
    throw new Error("Database client is not available for recurring billing.");
  }

  const { data: dbSubs, error: subsError } = await client
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      status,
      current_period_start,
      current_period_end,
      plan_id,
      profiles:customer_id (full_name, email),
      plans:plan_id (name, price, billing_period)
    `)
    .eq("status", "active");

  if (subsError) {
    if (subsError.code === "42501") {
      console.warn("Permission denied fetching subscriptions: unauthenticated or lacks table grant.");
      return {
        runTimestamp,
        processedCount: 0,
        invoicesCreated: [],
        skippedDuplicateCount: 0,
        errors: [],
      };
    }
    throw new Error(`Failed to fetch active subscriptions: ${subsError.message}`);
  }

  const allActive: SubscriptionBillingContract[] = (dbSubs || []).map((s: any) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    const plan = Array.isArray(s.plans) ? s.plans[0] : s.plans;

    const unitPricePaise = Math.round(Number(plan?.price ?? 0) * 100);
    const planPeriod = plan?.billing_period || "monthly";
    const billingInterval: BillingInterval | BillingFrequency =
      planPeriod === "daily" ? "day" :
      planPeriod === "weekly" ? "week" :
      planPeriod === "yearly" ? "year" : "month";

    const nextBillingDate = s.next_billing_date || s.current_period_end || new Date().toISOString();

    return {
      subscriptionId: s.id,
      customerId: s.customer_id,
      customerName: profile?.full_name || profile?.name || "Customer",
      customerEmail: profile?.email || "customer@brightloop.io",
      planId: s.plan_id || "default-plan",
      planName: plan?.name || "Subscription Service",
      quantity: 1,
      unitPricePaise,
      billingInterval,
      currentPeriodStart: s.current_period_start || nextBillingDate,
      currentPeriodEnd: s.current_period_end || nextBillingDate,
      nextBillingDate,
      status: s.status,
      taxRuleCode: "GST_18",
      discountCode: s.discount_code || undefined,
    };
  });

  const dueSubscriptions = allActive.filter(
    (sub) => new Date(sub.nextBillingDate) <= targetTime
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
      const billingDateObj = new Date(sub.nextBillingDate);
      const dueDateObj = new Date(billingDateObj);
      dueDateObj.setDate(dueDateObj.getDate() + 14);

      const periodStart = sub.nextBillingDate;
      const { nextBillingDate: advancedDate, nextPeriodEnd: periodEnd } = advanceBillingDate(
        sub.nextBillingDate,
        sub.billingInterval
      );

      if (options?.dryRun) {
        result.skippedDuplicateCount++;
        continue;
      }

      // Check idempotency first before processing
      const { data: existingInv } = await client
        .from("invoices")
        .select("id, invoice_number")
        .eq("subscription_id", sub.subscriptionId)
        .eq("billing_period_start", periodStart)
        .neq("status", "cancelled")
        .maybeSingle();

      if (existingInv) {
        result.skippedDuplicateCount++;
        // Idempotency: advance period in DB so subscription does not stay permanently stuck
        await client
          .from("subscriptions")
          .update({
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.subscriptionId);
        continue;
      }

      // Compute pricing, discounts, and taxes
      let discountType: "percentage" | "fixed" | undefined;
      let discountValue: number | undefined;
      let discountCodeToIncrement: string | undefined;

      if (sub.discountCode) {
        const discount = await getDiscountByCode(sub.discountCode);
        if (discount) {
          const itemSubtotal = sub.quantity * sub.unitPricePaise;
          const evalResult = evaluateDiscountEligibility(
            discount,
            itemSubtotal,
            sub.quantity,
            { subscriptionId: sub.subscriptionId }
          );
          if (evalResult.valid) {
            discountType = discount.type;
            discountValue = discount.type === "percentage" ? discount.value : evalResult.discountPaise;
            discountCodeToIncrement = discount.code;
          }
        }
      }

      const calcInput: LineItemCalculationInput = {
        quantity: sub.quantity,
        unitPricePaise: sub.unitPricePaise,
        discountType,
        discountValue,
        taxRatePercent: 18,
      };

      const totals = calculateInvoiceTotals([calcInput], 0);

      const dbItems = [
        {
          description: `${sub.planName} (${sub.billingInterval} cycle)`,
          quantity: sub.quantity,
          unit_price: paiseToRupees(sub.unitPricePaise),
          discount_amount: paiseToRupees(totals.items[0].discountPaise),
          tax_amount: paiseToRupees(totals.items[0].taxPaise),
          total_amount: paiseToRupees(totals.items[0].totalPaise),
        },
      ];

      // 1. Attempt Atomic PostgreSQL RPC if deployed
      let generatedInvoice: DetailedInvoice | null = null;
      try {
        const { data: rpcData, error: rpcError } = await client.rpc(
          "generate_subscription_recurring_invoice",
          {
            p_subscription_id: sub.subscriptionId,
            p_period_start: periodStart,
            p_period_end: periodEnd,
            p_due_date: dueDateObj.toISOString(),
            p_advanced_next_billing_date: advancedDate,
            p_subtotal: paiseToRupees(totals.subtotalPaise),
            p_discount_total: paiseToRupees(totals.discountTotalPaise),
            p_tax_total: paiseToRupees(totals.taxTotalPaise),
            p_total_amount: paiseToRupees(totals.totalPaise),
            p_items: dbItems,
            p_notes: `Automated recurring billing for ${sub.planName} (${sub.billingInterval} cycle)`,
          }
        );

        if (!rpcError && rpcData?.invoice_id) {
          generatedInvoice = await getInvoiceById(rpcData.invoice_id);
        } else if (rpcError?.message?.includes("DUPLICATE_PERIOD") || rpcError?.message?.includes("already exists")) {
          result.skippedDuplicateCount++;
          continue;
        }
      } catch {
        // Fallback to application-level creation
      }

      if (!generatedInvoice) {
        generatedInvoice = await createInvoice({
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

        // Advance date ONLY after successful invoice creation
        await client
          .from("subscriptions")
          .update({
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.subscriptionId);
      }

      if (discountCodeToIncrement) {
        await incrementDiscountUsage(discountCodeToIncrement);
      }

      if (generatedInvoice) {
        result.invoicesCreated.push(generatedInvoice);
      }
    } catch (err: any) {
      if (err.message && err.message.includes("already exists")) {
        result.skippedDuplicateCount++;
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
  const client = (await createAdminClient()) || (await createServerClient());
  if (!client) {
    return [];
  }

  const { data: dbSubs, error } = await client
    .from("subscriptions")
    .select(`
      id,
      customer_id,
      status,
      current_period_start,
      current_period_end,
      plan_id,
      profiles:customer_id (full_name, email),
      plans:plan_id (name, price, billing_period)
    `)
    .eq("status", "active");

  if (error) {
    if (error.code === "42501") {
      console.warn("Permission denied fetching subscriptions: unauthenticated or lacks table grant.");
      return [];
    }
    throw new Error(`Failed to fetch subscriptions from database: ${error.message}`);
  }

  if (!dbSubs || dbSubs.length === 0) {
    return [];
  }

  return dbSubs.map((s: any) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    const plan = Array.isArray(s.plans) ? s.plans[0] : s.plans;

    const unitPricePaise = Math.round(Number(plan?.price ?? 0) * 100);
    const planPeriod = plan?.billing_period || "monthly";
    const billingInterval: BillingInterval | BillingFrequency =
      planPeriod === "daily" ? "day" :
      planPeriod === "weekly" ? "week" :
      planPeriod === "yearly" ? "year" : "month";

    const nextBillingDate = s.next_billing_date || s.current_period_end || new Date().toISOString();

    return {
      subscriptionId: s.id,
      customerId: s.customer_id,
      customerName: profile?.full_name || profile?.name || "Customer",
      customerEmail: profile?.email || "customer@brightloop.io",
      planId: s.plan_id || "default-plan",
      planName: plan?.name || "Subscription Service",
      quantity: 1,
      unitPricePaise,
      billingInterval,
      currentPeriodStart: s.current_period_start || nextBillingDate,
      currentPeriodEnd: s.current_period_end || nextBillingDate,
      nextBillingDate,
      status: s.status,
      taxRuleCode: "GST_18",
      discountCode: s.discount_code || undefined,
    };
  });
}
