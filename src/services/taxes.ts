import { TaxRule } from "@/types";
import { CreateTaxRuleInput } from "@/lib/validations/billing";
import { createServerClient } from "@/lib/supabase/server";

function mapDbTaxRule(row: any): TaxRule {
  const rate = Number(row.percentage ?? row.rate ?? 0);
  const code =
    row.code ||
    (row.name ? row.name.replace(/[^A-Za-z0-9]/g, "_").toUpperCase() : `TAX_${rate}`);

  return {
    id: row.id,
    name: row.name,
    code,
    rate,
    description: row.description || `${row.name} (${rate}%)`,
    isActive: row.active ?? row.is_active ?? true,
    country: row.country || "IN",
    state: row.region || row.state || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Retrieves all registered regional and national tax rules from Supabase.
 */
export async function getTaxRules(): Promise<TaxRule[]> {
  const supabase = await createServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tax_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // If permission denied (unauthenticated visitor or pending RLS grant), return empty list gracefully
    if (error.code === "42501") {
      console.warn("Permission denied querying tax_rules: caller is unauthenticated or lacks table grant.");
      return [];
    }
    throw new Error(`Failed to fetch tax rules: ${error.message}`);
  }

  return (data || []).map(mapDbTaxRule);
}

/**
 * Retrieves an active tax rule by its code or name.
 */
export async function getTaxRuleByCode(code: string): Promise<TaxRule | null> {
  const allRules = await getTaxRules();
  const normalized = code.toUpperCase().trim();

  const found = allRules.find(
    (r) =>
      r.code.toUpperCase() === normalized ||
      r.name.toUpperCase().includes(normalized) ||
      (normalized === "GST_18" && r.rate === 18)
  );

  return found || null;
}

/**
 * Registers a new tax rule in Supabase.
 */
export async function createTaxRule(input: CreateTaxRuleInput): Promise<TaxRule> {
  const supabase = await createServerClient();
  if (!supabase) {
    throw new Error("Database client is not available. Check Supabase environment configuration.");
  }

  const newId = crypto.randomUUID();
  const { data, error } = await supabase
    .from("tax_rules")
    .insert({
      id: newId,
      name: input.name,
      percentage: input.rate,
      active: true,
      country: input.country || "IN",
      region: input.state || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tax rule: ${error.message}`);
  }

  return mapDbTaxRule(data);
}
