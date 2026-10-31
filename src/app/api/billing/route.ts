import { NextRequest, NextResponse } from "next/server";
import { runRecurringBilling, getActiveSubscriptions } from "@/services/recurring";
import { triggerRecurringBillingSchema } from "@/lib/validations/billing";
import { createServerClient } from "@/lib/supabase/server";

async function isBillingAuthorized(req: NextRequest): Promise<{ authorized: boolean; reason?: string }> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-cron-secret") || req.headers.get("x-billing-key");

  // 1. Check Bearer token or custom header against CRON_SECRET
  if (cronSecret) {
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token === cronSecret) {
        return { authorized: true };
      }
    }
    if (secretHeader && secretHeader === cronSecret) {
      return { authorized: true };
    }
  }

  // 2. Check Supabase authenticated user session (staff / finance / admin / owner)
  try {
    const client = await createServerClient();
    if (client) {
      const {
        data: { user },
        error: userErr,
      } = await client.auth.getUser();

      if (!userErr && user) {
        const { data: profile } = await client
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = profile?.role || "customer";
        if (["owner", "admin", "finance", "staff"].includes(role)) {
          return { authorized: true };
        }
        return {
          authorized: false,
          reason: `Forbidden: user role '${role}' is not authorized to trigger recurring billing.`,
        };
      }
    }
  } catch {
    // Auth client unavailable
  }

  // If CRON_SECRET is configured, strictly enforce credentials
  if (cronSecret) {
    return {
      authorized: false,
      reason: "Unauthorized: Valid Bearer CRON_SECRET or staff session required.",
    };
  }

  // In local development / test environments when CRON_SECRET is not yet set
  return { authorized: true };
}

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
 * Trigger recurring billing run (Idempotent & Protected with Server-side Auth)
 */
export async function POST(req: NextRequest) {
  try {
    // Server-side authentication & authorization check
    const authCheck = await isBillingAuthorized(req);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.reason || "Unauthorized access to recurring billing engine." },
        { status: 401 }
      );
    }

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
