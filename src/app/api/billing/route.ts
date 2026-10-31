import { NextRequest, NextResponse } from "next/server";
import { runRecurringBilling, getActiveSubscriptions } from "@/services/recurring";
import { triggerRecurringBillingSchema } from "@/lib/validations/billing";
import { createServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

async function isBillingAuthorized(req: NextRequest): Promise<{ authorized: boolean; reason?: string }> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const secretHeader = req.headers.get("x-cron-secret") || req.headers.get("x-billing-key");

  // 1. Verify Bearer token or custom header against CRON_SECRET if configured
  if (cronSecret && cronSecret.trim().length > 0) {
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
    const user = await getAuthenticatedUser();
    if (user) {
      const client = await createServerClient();
      if (client) {
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
          reason: `Forbidden: user role '${role}' is not authorized to trigger recurring billing. Staff or admin role required.`,
        };
      }
    }
  } catch {
    // Auth client unavailable
  }

  // Fail-closed: Never permit unauthenticated or unauthorized recurring billing triggers
  return {
    authorized: false,
    reason: "Unauthorized: Valid Bearer CRON_SECRET header or authenticated staff/admin session required.",
  };
}

/**
 * GET /api/billing
 * Status and diagnostic overview of recurring billing engine
 * Authenticated: Staff/admin see full system overview; customers see only their own subscriptions.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to inspect recurring billing engine." },
        { status: 401 }
      );
    }

    const client = await createServerClient();
    let isStaff = false;

    if (client) {
      const { data: profile } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = profile?.role || "customer";
      isStaff = ["owner", "admin", "finance", "staff"].includes(role);
    }

    const allSubscriptions = await getActiveSubscriptions();
    const now = new Date();

    // If staff, return full diagnostics. If customer, filter to only their own subscriptions.
    const accessibleSubscriptions = isStaff
      ? allSubscriptions
      : allSubscriptions.filter((s) => s.customerId === user.id);

    const dueSubscriptions = accessibleSubscriptions.filter(
      (s) => s.status === "active" && new Date(s.nextBillingDate) <= now
    );

    return NextResponse.json({
      status: "ok",
      module: "billing",
      branch: "feature/billing-payments",
      serverTime: now.toISOString(),
      role: isStaff ? "staff" : "customer",
      activeSubscriptionsCount: accessibleSubscriptions.length,
      dueForBillingCount: dueSubscriptions.length,
      dueSubscriptions: dueSubscriptions.map((s) => ({
        subscriptionId: s.subscriptionId,
        customerName: isStaff ? s.customerName : "Self",
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
 * Fail-closed: Requires valid Bearer CRON_SECRET or authenticated staff/admin session.
 */
export async function POST(req: NextRequest) {
  try {
    // Fail-closed server-side authentication & authorization check
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
