import {
  Subscription,
  SubscriptionStatus,
  SubscriptionLine,
  PaginatedResult,
} from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";
import { validatePlanAvailability, validatePlanQuantity } from "./plans";

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

/**
 * Valid lifecycle transitions:
 * draft -> quotation | cancelled
 * quotation -> confirmed | cancelled
 * confirmed -> active | cancelled
 * active -> closed | cancelled
 * closed -> (terminal)
 */
export const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  draft: ["quotation", "cancelled"],
  quotation: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["closed", "cancelled"],
  closed: [],
  cancelled: [],
};

export function isValidTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function listSubscriptions(options?: {
  customerId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<Subscription>> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 25;

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    let subs = db.store.subscriptions || [];

    if (options?.customerId && options.customerId !== "all") {
      subs = subs.filter((s) => s.customerId === options.customerId);
    }
    if (options?.status && options.status !== "all") {
      subs = subs.filter((s) => s.status === options.status);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      subs = subs.filter(
        (s) =>
          s.subscriptionNumber.toLowerCase().includes(q) ||
          s.customer?.name.toLowerCase().includes(q) ||
          s.plan?.name.toLowerCase().includes(q)
      );
    }

    const total = subs.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = subs.slice(start, start + pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  // TODO: Supabase implementation
  return { data: [], total: 0, page: 1, pageSize, totalPages: 0 };
}

export async function getSubscriptionById(
  id: string,
  requesterCustomerId?: string
): Promise<Subscription | null> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const sub = db.store.subscriptions?.find((s) => s.id === id) || null;
    if (!sub) return null;

    // Ownership check: If requester is a customer, ensure they own this subscription
    if (requesterCustomerId && sub.customerId !== requesterCustomerId) {
      return null;
    }
    return sub;
  }

  // TODO: Supabase implementation
  return null;
}

export async function createSubscription(
  input: {
    customerId: string;
    planId: string;
    startDate: string;
    paymentTerms?: string;
    lines: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      unitPrice: number;
    }>;
  },
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<Subscription> {
  requireRole(actor.role, ["admin", "staff"]);

  if (!input.customerId) throw new Error("Customer is required.");
  if (!input.planId) throw new Error("Plan is required.");
  if (!input.lines || input.lines.length === 0) {
    throw new Error("Subscription must contain at least one line item.");
  }

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const customer = db.store.customers.find((c) => c.id === input.customerId);
    if (!customer) throw new Error(`Customer not found: ${input.customerId}`);

    const plan = db.store.plans.find((p) => p.id === input.planId);
    if (!plan) throw new Error(`Plan not found: ${input.planId}`);

    // Validate plan availability window
    const today = input.startDate || new Date().toISOString().slice(0, 10);
    const avail = validatePlanAvailability(plan, today);
    if (!avail.valid) {
      throw new Error(`Plan invalid: ${avail.reason}`);
    }

    // Validate minimum quantity
    const totalQty = input.lines.reduce((sum, l) => sum + l.quantity, 0);
    const qtyCheck = validatePlanQuantity(plan, totalQty);
    if (!qtyCheck.valid) {
      throw new Error(qtyCheck.reason);
    }

    const subId = `sub-${Date.now().toString(36)}`;
    const subNumber = `SUB-${String(db.store.subscriptions.length + 10001)}`;

    const lines: SubscriptionLine[] = input.lines.map((l, idx) => {
      const prod = db.store.products.find((p) => p.id === l.productId);
      const variant = prod?.variants?.find((v) => v.id === l.variantId);
      const unitPrice = l.unitPrice || prod?.salesPrice || 0;
      const amount = unitPrice * l.quantity;

      return {
        id: `line-${subId}-${idx + 1}`,
        subscriptionId: subId,
        productId: l.productId,
        variantId: l.variantId,
        description: prod ? `${prod.name}${variant ? ` (${variant.attributeValue})` : ""}` : "Item",
        quantity: l.quantity,
        unitPrice,
        taxRate: 18,
        taxAmount: Math.round(amount * 0.18),
        amount,
      };
    });

    const totalAmount = lines.reduce((acc, l) => acc + l.amount, 0);

    const newSub: Subscription = {
      id: subId,
      subscriptionNumber: subNumber,
      customerId: customer.id,
      customer,
      planId: plan.id,
      plan,
      status: "draft",
      startDate: today,
      endDate: "2027-10-31",
      renewalDate: "2027-10-31",
      nextBillingDate: today,
      paymentTerms: input.paymentTerms || "Net 15",
      totalAmount,
      currency: "INR",
      lines,
      history: [
        {
          id: `hist-${Date.now().toString(36)}-1`,
          subscriptionId: subId,
          fromStatus: "draft",
          toStatus: "draft",
          changedBy: actor.name,
          changedAt: new Date().toISOString(),
          reason: "Created new draft subscription",
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

/**
 * Edit subscription lines or terms (Allowed ONLY while in Draft or Quotation status)
 */
export async function updateSubscription(
  id: string,
  updates: Partial<Omit<Subscription, "id" | "subscriptionNumber" | "customerId">>,
  actor: { name: string; role: UserRole } = { name: "Staff Member", role: "staff" }
): Promise<Subscription> {
  requireRole(actor.role, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const idx = db.store.subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Subscription not found: ${id}`);

    const current = db.store.subscriptions[idx];
    if (current.status !== "draft" && current.status !== "quotation") {
      throw new Error(`Cannot edit subscription in '${current.status}' status. Editing is only permitted for Draft and Quotation.`);
    }

    const updated: Subscription = {
      ...current,
      ...updates,
      lines: updates.lines || current.lines,
      totalAmount: updates.lines
        ? updates.lines.reduce((sum, l) => sum + l.amount, 0)
        : current.totalAmount,
    };

    db.store.subscriptions[idx] = updated;
    saveMockDb(db);
    return updated;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Transition subscription status with strict state machine validation and audit logging
 */
export async function transitionSubscription(
  id: string,
  targetStatus: SubscriptionStatus,
  actor: { name: string; role: UserRole },
  reason?: string
): Promise<Subscription> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const idx = db.store.subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Subscription not found: ${id}`);

    const sub = db.store.subscriptions[idx];

    // Validate transition
    if (!isValidTransition(sub.status, targetStatus)) {
      throw new Error(
        `Illegal state transition: Cannot change subscription from '${sub.status}' to '${targetStatus}'.`
      );
    }

    // Special rule: Expired quotation cannot be confirmed
    if (sub.status === "quotation" && targetStatus === "confirmed") {
      const today = new Date().toISOString().slice(0, 10);
      if (sub.validUntil && sub.validUntil < today) {
        throw new Error(
          `Quotation expired on ${sub.validUntil}. Expired quotations cannot be confirmed.`
        );
      }
    }

    const historyEntry = {
      id: `hist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      subscriptionId: sub.id,
      fromStatus: sub.status,
      toStatus: targetStatus,
      changedBy: actor.name,
      changedAt: new Date().toISOString(),
      reason: reason || `Status changed from ${sub.status} to ${targetStatus}`,
    };

    sub.status = targetStatus;
    if (!sub.history) sub.history = [];
    sub.history.unshift(historyEntry);

    db.store.subscriptions[idx] = sub;
    saveMockDb(db);
    return sub;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Pause action (respects plan.pausable)
 */
export async function pauseSubscription(
  id: string,
  actor: { name: string; role: UserRole; customerId?: string }
): Promise<Subscription> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const sub = db.store.subscriptions.find((s) => s.id === id);
    if (!sub) throw new Error(`Subscription not found: ${id}`);

    if (actor.role === "customer" && actor.customerId !== sub.customerId) {
      throw new Error("Forbidden: Cross-customer access blocked.");
    }

    if (sub.status !== "active") {
      throw new Error(`Only active subscriptions can be paused (current: ${sub.status}).`);
    }

    if (!sub.plan?.pausable) {
      throw new Error(`Plan '${sub.plan?.name}' does not allow pausing.`);
    }

    sub.paused = !sub.paused;
    if (!sub.history) sub.history = [];
    sub.history.unshift({
      id: `hist-${Date.now().toString(36)}`,
      subscriptionId: sub.id,
      fromStatus: sub.status,
      toStatus: sub.status,
      changedBy: actor.name,
      changedAt: new Date().toISOString(),
      reason: sub.paused ? "Paused by user" : "Resumed by user",
    });

    saveMockDb(db);
    return sub;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Early close action (respects plan.closableEarly)
 */
export async function closeEarlySubscription(
  id: string,
  actor: { name: string; role: UserRole; customerId?: string }
): Promise<Subscription> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const sub = db.store.subscriptions.find((s) => s.id === id);
    if (!sub) throw new Error(`Subscription not found: ${id}`);

    if (actor.role === "customer" && actor.customerId !== sub.customerId) {
      throw new Error("Forbidden: Cross-customer access blocked.");
    }

    if (sub.status !== "active") {
      throw new Error(`Only active subscriptions can be closed early (current: ${sub.status}).`);
    }

    if (!sub.plan?.closableEarly) {
      throw new Error(`Plan '${sub.plan?.name}' does not allow early termination.`);
    }

    return transitionSubscription(id, "closed", actor, "Closed early by user request");
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Renew action (respects plan.renewable)
 */
export async function renewSubscription(
  id: string,
  actor: { name: string; role: UserRole; customerId?: string }
): Promise<Subscription> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const sub = db.store.subscriptions.find((s) => s.id === id);
    if (!sub) throw new Error(`Subscription not found: ${id}`);

    if (actor.role === "customer" && actor.customerId !== sub.customerId) {
      throw new Error("Forbidden: Cross-customer access blocked.");
    }

    if (!sub.plan?.renewable) {
      throw new Error(`Plan '${sub.plan?.name}' is non-renewable.`);
    }

    // Extend end date by 1 year or cycle
    const currentEnd = new Date(sub.endDate);
    currentEnd.setFullYear(currentEnd.getFullYear() + 1);
    sub.endDate = currentEnd.toISOString().slice(0, 10);
    sub.renewalDate = sub.endDate;

    if (!sub.history) sub.history = [];
    sub.history.unshift({
      id: `hist-${Date.now().toString(36)}`,
      subscriptionId: sub.id,
      fromStatus: sub.status,
      toStatus: sub.status,
      changedBy: actor.name,
      changedAt: new Date().toISOString(),
      reason: `Renewed subscription term through ${sub.endDate}`,
    });

    saveMockDb(db);
    return sub;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

/**
 * Mock Scheduler daily job:
 * Auto-closes active subscriptions flagged autoClose once past their end date
 */
export async function runScheduler(actorRole: UserRole = "admin"): Promise<{
  processed: number;
  closedCount: number;
  closedIds: string[];
}> {
  requireRole(actorRole, ["admin"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const today = new Date().toISOString().slice(0, 10);
    const closedIds: string[] = [];

    const activeSubs = db.store.subscriptions.filter((s) => s.status === "active");

    for (const sub of activeSubs) {
      if (sub.plan?.autoClose && sub.endDate < today) {
        sub.status = "closed";
        closedIds.push(sub.id);
        if (!sub.history) sub.history = [];
        sub.history.unshift({
          id: `hist-${Date.now().toString(36)}-auto`,
          subscriptionId: sub.id,
          fromStatus: "active",
          toStatus: "closed",
          changedBy: "Scheduler Automation",
          changedAt: new Date().toISOString(),
          reason: `Auto-closed on term completion (end date: ${sub.endDate})`,
        });
      }
    }

    if (closedIds.length > 0) {
      saveMockDb(db);
    }

    return {
      processed: activeSubs.length,
      closedCount: closedIds.length,
      closedIds,
    };
  }

  // TODO: Supabase implementation
  return { processed: 0, closedCount: 0, closedIds: [] };
}
