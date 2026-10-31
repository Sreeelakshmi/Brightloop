import { NextRequest, NextResponse } from "next/server";
import { runRecurringBilling, getActiveSubscriptions } from "@/services/recurring";
import { triggerRecurringBillingSchema } from "@/lib/validations/billing";

/**
 * GET /api/billing
 * Status and diagnostic overview of recurring billing engine
 */
export async function GET() {
  try {
    const subscriptions = await getActiveSubscriptions();
    const now = new Date();
    const dueSubscriptions = subscriptions.filter(
      (s) => s.status === "active" && new Date(s.nextBillingDate) <= now
    );

    return NextResponse.json({
      status: "ok",
      module: "billing",
      branch: "feature/billing-payments",
      serverTime: now.toISOString(),
      activeSubscriptionsCount: subscriptions.length,
      dueForBillingCount: dueSubscriptions.length,
      dueSubscriptions: dueSubscriptions.map((s) => ({
        subscriptionId: s.subscriptionId,
        customerName: s.customerName,
        planName: s.planName,
        nextBillingDate: s.nextBillingDate,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch billing status", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/billing
 * Trigger recurring billing run (Idempotent & Protected)
 */
export async function POST(req: NextRequest) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed, defaults will be used
    }

    const validation = triggerRecurringBillingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid billing trigger parameters", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { dryRun, targetDate } = validation.data;
    const result = await runRecurringBilling({ dryRun, targetDate });

    return NextResponse.json({
      success: true,
      message: dryRun
        ? "Recurring billing dry-run completed."
        : `Recurring billing executed successfully. Generated ${result.invoicesCreated.length} invoice(s).`,
      summary: {
        runTimestamp: result.runTimestamp,
        processedCount: result.processedCount,
        invoicesCreatedCount: result.invoicesCreated.length,
        skippedDuplicateCount: result.skippedDuplicateCount,
        errorsCount: result.errors.length,
      },
      invoices: result.invoicesCreated.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        totalAmountPaise: inv.totalAmountPaise,
        totalAmountFormatted: `₹${(inv.totalAmountPaise / 100).toFixed(2)}`,
        status: inv.extendedStatus,
        dueDate: inv.dueDate,
      })),
      errors: result.errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Recurring billing execution failed", details: error.message },
      { status: 500 }
    );
  }
}
