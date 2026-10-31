import { TaxRule } from "@/types";
import { CreateTaxRuleInput } from "@/lib/validations/billing";
import { createServerClient } from "@/lib/supabase/server";

function mapDbTaxRule(row: any): TaxRule {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    rate: Number(row.rate),
    description: row.description || undefined,
    isActive: row.is_active ?? true,
    country: row.country || "IN",
    state: row.state || undefined,
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
    throw new Error(`Failed to fetch tax rules: ${error.message}`);
  }

  return (data || []).map(mapDbTaxRule);
}

/**
 * Retrieves an active tax rule by its unique statutory code (e.g., GST_18).
 */
export async function getTaxRuleByCode(code: string): Promise<TaxRule | null> {
  const supabase = await createServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("tax_rules")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query tax rule for code '${code}': ${error.message}`);
  }

  if (!data) return null;
  return mapDbTaxRule(data);
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
      code: input.code,
      rate: input.rate,
      description: input.description || null,
      country: input.country || "IN",
      state: input.state || null,
      is_active: true,
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
