import { BillingRun, Invoice, InvoiceLine, InvoiceTaxBreakdown } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";
import { calculateLineTaxes } from "./taxes";

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listBillingRuns(): Promise<BillingRun[]> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    return db.store.billingRuns || [];
  }
  // TODO: Supabase implementation
  return [];
}

/**
 * Idempotent Billing Engine:
 * Generates invoices for all active subscriptions due for billing.
 * Guarantees zero duplicate invoices for the same (subscription, periodStart, periodEnd).
 */
export async function runBillingEngine(
  actor: { name: string; role: UserRole } = { name: "System Admin", role: "admin" }
): Promise<BillingRun> {
  requireRole(actor.role, ["admin"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const today = new Date().toISOString().slice(0, 10);
    const activeSubs = db.store.subscriptions.filter((s) => s.status === "active");

    let invoicesCreated = 0;
    let invoicesSkipped = 0;
    const errors: string[] = [];

    // Current period definition for demo
    const periodStart = "2026-10-01";
    const periodEnd = "2026-10-31";

    for (const sub of activeSubs) {
      try {
        const periodKey = `${sub.id}_${periodStart}_${periodEnd}`;

        // Idempotency check: Guarantee zero duplicate invoices
        const existingInvoice = db.store.invoices.find(
          (inv) => inv.periodKey === periodKey || (inv.subscriptionId === sub.id && inv.issueDate === today)
        );

        if (existingInvoice) {
          invoicesSkipped++;
          continue;
        }

        const invId = `inv-bill-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        const invNo = `INV-${String(db.store.invoices.length + 3001)}`;

        // Build invoice lines and calculate line taxes
        let subtotalPaise = 0;
        let taxPaise = 0;
        const allTaxBreakdowns: Record<string, { name: string; rate: number; amount: number }> = {};

        const invLines: InvoiceLine[] = (sub.lines || []).map((line, idx) => {
          const lineAmount = line.amount;
          subtotalPaise += lineAmount;

          const { totalTax, breakdown } = calculateLineTaxes(lineAmount, line.productId, db.store.taxes);
          taxPaise += totalTax;

          for (const b of breakdown) {
            if (!allTaxBreakdowns[b.name]) {
              allTaxBreakdowns[b.name] = { ...b };
            } else {
              allTaxBreakdowns[b.name].amount += b.amount;
            }
          }

          return {
            id: `line-${invId}-${idx + 1}`,
            invoiceId: invId,
            productId: line.productId,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            taxAmount: totalTax,
            amount: lineAmount,
          };
        });

        // If no lines on subscription, fallback to plan amount
        if (invLines.length === 0) {
          const planAmount = sub.plan?.amount || 10000;
          subtotalPaise = planAmount;
          taxPaise = Math.round(planAmount * 0.18);
          invLines.push({
            id: `line-${invId}-1`,
            invoiceId: invId,
            description: `${sub.plan?.name || "Subscription"} Service Fee`,
            quantity: 1,
            unitPrice: planAmount,
            taxAmount: taxPaise,
            amount: planAmount,
          });
        }

        const discountTotalPaise = 0;
        const grandTotal = subtotalPaise + taxPaise - discountTotalPaise;

        // Due date based on payment terms (default 15 days)
        const dueDateObj = new Date();
        dueDateObj.setDate(dueDateObj.getDate() + 15);
        const dueDate = dueDateObj.toISOString().slice(0, 10);

        const newInvoice: Invoice = {
          id: invId,
          invoiceNo: invNo,
          subscriptionId: sub.id,
          periodKey,
          customerId: sub.customerId,
          customer: sub.customer,
          issueDate: today,
          dueDate,
          daysOverdue: 0,
          subtotal: subtotalPaise,
          taxTotal: taxPaise,
          discountTotal: discountTotalPaise,
          taxBreakdown: Object.values(allTaxBreakdowns),
          totalAmount: grandTotal,
          balance: grandTotal,
          paidAmount: 0,
          currency: "INR",
          status: "confirmed",
          lines: invLines,
          createdAt: new Date().toISOString(),
        };

        db.store.invoices.unshift(newInvoice);
        invoicesCreated++;
      } catch (err: unknown) {
        // Individual subscription failure does not abort the remaining run
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Subscription ${sub.subscriptionNumber}: ${msg}`);
      }
    }

    const runSummary: BillingRun = {
      id: `brun-${Date.now().toString(36)}`,
      runDate: new Date().toISOString(),
      runBy: actor.name,
      subscriptionsProcessed: activeSubs.length,
      invoicesCreated,
      invoicesSkipped,
      failedCount: errors.length,
      errors,
    };

    if (!db.store.billingRuns) db.store.billingRuns = [];
    db.store.billingRuns.unshift(runSummary);

    saveMockDb(db);
    return runSummary;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}
