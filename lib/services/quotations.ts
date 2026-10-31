import { QuotationTemplate, Subscription, SubscriptionLine } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";
import { validatePlanAvailability, validatePlanQuantity } from "./plans";

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listQuotationTemplates(): Promise<QuotationTemplate[]> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    return db.store.quotationTemplates || [];
  }
  // TODO: Supabase implementation
  return [];
}

export async function getQuotationTemplateById(id: string): Promise<QuotationTemplate | null> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    return db.store.quotationTemplates?.find((t) => t.id === id) || null;
  }
  // TODO: Supabase implementation
  return null;
}

export async function createQuotationTemplate(
  input: {
    name: string;
    validityDays: number;
    planId: string;
    lines: Array<{ productId: string; variantId?: string; quantity: number; unitPrice: number }>;
  },
  actorRole: UserRole = "admin"
): Promise<QuotationTemplate> {
  requireRole(actorRole, ["admin", "staff"]);

  if (!input.name?.trim()) throw new Error("Template name is required.");
  if (input.validityDays <= 0) throw new Error("Validity days must be greater than zero.");
  if (!input.planId) throw new Error("Plan selection is required.");

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const id = `tmpl-${Date.now().toString(36)}`;
    const newTmpl: QuotationTemplate = {
      id,
      name: input.name.trim(),
      validityDays: Number(input.validityDays),
      planId: input.planId,
      lines: input.lines || [],
      createdAt: new Date().toISOString(),
    };

    db.store.quotationTemplates.unshift(newTmpl);
    saveMockDb(db);
    return newTmpl;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * One-click quotation creation from template
 */
export async function createQuotationFromTemplate(
  templateId: string,
  customerId: string,
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<Subscription> {
  requireRole(actor.role, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const tmpl = db.store.quotationTemplates.find((t) => t.id === templateId);
    if (!tmpl) throw new Error(`Quotation template not found: ${templateId}`);

    const customer = db.store.customers.find((c) => c.id === customerId);
    if (!customer) throw new Error(`Customer not found: ${customerId}`);

    const plan = db.store.plans.find((p) => p.id === tmpl.planId);
    if (!plan) throw new Error(`Plan linked to template not found: ${tmpl.planId}`);

    // Rule: Plan availability check
    const today = new Date().toISOString().slice(0, 10);
    const avail = validatePlanAvailability(plan, today);
    if (!avail.valid) {
      throw new Error(`Cannot create quotation: ${avail.reason}`);
    }

    // Calculate validity end date
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (tmpl.validityDays || 15));
    const validUntil = validUntilDate.toISOString().slice(0, 10);

    const subId = `sub-${Date.now().toString(36)}`;
    const subNumber = `SUB-${String(db.store.subscriptions.length + 10001)}`;

    // Build lines and validate minimum quantity
    let totalQuantity = 0;
    const lines: SubscriptionLine[] = tmpl.lines.map((l, idx) => {
      const prod = db.store.products.find((p) => p.id === l.productId);
      const variant = prod?.variants?.find((v) => v.id === l.variantId);
      const unitPrice = l.unitPrice || prod?.salesPrice || 0;
      const amount = unitPrice * l.quantity;
      totalQuantity += l.quantity;

      return {
        id: `line-${subId}-${idx + 1}`,
        subscriptionId: subId,
        productId: l.productId,
        variantId: l.variantId,
        description: prod ? `${prod.name}${variant ? ` (${variant.attributeValue})` : ""}` : "Custom Item",
        quantity: l.quantity,
        unitPrice,
        taxRate: 18,
        taxAmount: Math.round(amount * 0.18),
        amount,
      };
    });

    const qtyCheck = validatePlanQuantity(plan, totalQuantity);
    if (!qtyCheck.valid) {
      throw new Error(`Cannot create quotation: ${qtyCheck.reason}`);
    }

    const totalAmount = lines.reduce((acc, l) => acc + l.amount, 0);

    const newSub: Subscription = {
      id: subId,
      subscriptionNumber: subNumber,
      customerId: customer.id,
      customer,
      planId: plan.id,
      plan,
      status: "quotation",
      startDate: today,
      endDate: "2027-10-31",
      renewalDate: "2027-10-31",
      nextBillingDate: today,
      paymentTerms: "Net 15",
      validUntil,
      totalAmount,
      currency: "INR",
      lines,
      history: [
        {
          id: `hist-${Date.now().toString(36)}-1`,
          subscriptionId: subId,
          fromStatus: "draft",
          toStatus: "quotation",
          changedBy: actor.name,
          changedAt: new Date().toISOString(),
          reason: `Created from template: ${tmpl.name} (Valid until ${validUntil})`,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    db.store.subscriptions.unshift(newSub);
    saveMockDb(db);
    return newSub;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}
