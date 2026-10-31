import { Plan, PlanBillingPeriod } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";
import { validatePlanAvailability, validatePlanQuantity } from "@/lib/business-rules";

export { validatePlanAvailability, validatePlanQuantity };

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listPlans(options?: {
  onlyAvailable?: boolean;
  date?: string;
  search?: string;
}): Promise<Plan[]> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    let plans = db.store.plans || [];

    if (options?.onlyAvailable) {
      plans = plans.filter((p) => validatePlanAvailability(p, options?.date).valid);
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      plans = plans.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    return plans;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('plans').select('*');
  // return data;
  return [];
}

export async function getPlanById(id: string): Promise<Plan | null> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    return db.store.plans?.find((p) => p.id === id) || null;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('plans').select('*').eq('id', id).single();
  // return data;
  return null;
}

export async function createPlan(
  input: {
    name: string;
    code: string;
    billingPeriod: PlanBillingPeriod;
    amount: number;
    description?: string;
    minimumQuantity?: number;
    availableFrom?: string;
    availableTo?: string;
    autoClose?: boolean;
    closableEarly?: boolean;
    pausable?: boolean;
    renewable?: boolean;
  },
  actorRole: UserRole = "admin"
): Promise<Plan> {
  requireRole(actorRole, ["admin"]);

  if (!input.name?.trim()) throw new Error("Plan name is required.");
  if (!input.code?.trim()) throw new Error("Plan code is required.");
  if (input.amount <= 0) throw new Error("Plan amount must be positive.");

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const id = `plan-${Date.now().toString(36)}`;
    const newPlan: Plan = {
      id,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      billingCycle: input.billingPeriod === "yearly" ? "annual" : input.billingPeriod,
      billingPeriod: input.billingPeriod,
      amount: Number(input.amount),
      price: Number(input.amount),
      currency: "INR",
      description: input.description?.trim() || "",
      active: true,
      minimumQuantity: Number(input.minimumQuantity) || 1,
      availableFrom: input.availableFrom || "2026-01-01",
      availableTo: input.availableTo || "2026-12-31",
      autoClose: Boolean(input.autoClose),
      closableEarly: Boolean(input.closableEarly),
      pausable: Boolean(input.pausable),
      renewable: Boolean(input.renewable),
    };

    db.store.plans.unshift(newPlan);
    saveMockDb(db);
    return newPlan;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('plans').insert(...).select().single();
  // return data;
  throw new Error("Supabase not configured");
}

export async function updatePlan(
  id: string,
  updates: Partial<Omit<Plan, "id">>,
  actorRole: UserRole = "admin"
): Promise<Plan> {
  requireRole(actorRole, ["admin"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const idx = db.store.plans.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Plan not found: ${id}`);

    const current = db.store.plans[idx];
    const updated: Plan = {
      ...current,
      ...updates,
      amount: updates.amount !== undefined ? Number(updates.amount) : current.amount,
      price: updates.amount !== undefined ? Number(updates.amount) : current.price,
    };

    db.store.plans[idx] = updated;
    saveMockDb(db);
    return updated;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('plans').update(updates).eq('id', id).select().single();
  // return data;
  throw new Error("Supabase not configured");
}
