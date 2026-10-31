import { TaxRule } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";
import { calculateLineTaxes } from "@/lib/business-rules";

export { calculateLineTaxes };

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listTaxes(): Promise<TaxRule[]> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    return db.store.taxes || [];
  }
  // TODO: Supabase implementation
  return [];
}

export async function createTaxRule(
  input: {
    name: string;
    type: "percentage" | "fixed";
    rate: number;
    applicableProducts?: string[];
    isInclusive?: boolean;
  },
  actorRole: UserRole = "admin"
): Promise<TaxRule> {
  requireRole(actorRole, ["admin"]);

  if (!input.name?.trim()) throw new Error("Tax rule name is required.");
  if (input.rate < 0) throw new Error("Tax rate cannot be negative.");

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const id = `tax-${Date.now().toString(36)}`;
    const newRule: TaxRule = {
      id,
      name: input.name.trim(),
      type: input.type,
      rate: Number(input.rate),
      applicableProducts: input.applicableProducts && input.applicableProducts.length > 0 ? input.applicableProducts : ["all"],
      isInclusive: Boolean(input.isInclusive),
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.store.taxes.unshift(newRule);
    saveMockDb(db);
    return newRule;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}

export async function updateTaxRule(
  id: string,
  updates: Partial<Omit<TaxRule, "id">>,
  actorRole: UserRole = "admin"
): Promise<TaxRule> {
  requireRole(actorRole, ["admin"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const idx = db.store.taxes.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Tax rule not found: ${id}`);

    const updated = {
      ...db.store.taxes[idx],
      ...updates,
      rate: updates.rate !== undefined ? Number(updates.rate) : db.store.taxes[idx].rate,
    };

    db.store.taxes[idx] = updated;
    saveMockDb(db);
    return updated;
  }

  // TODO: Supabase implementation
  throw new Error("Supabase not configured");
}
