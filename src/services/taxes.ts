import { TaxRule } from "@/types";
import { CreateTaxRuleInput } from "@/lib/validations/billing";
import { createServerClient } from "@/lib/supabase/server";

// Default deterministic tax rules based on seed data
let taxRulesStore: TaxRule[] = [
  {
    id: "11111111-1111-4000-8000-000000000001",
    name: "GST Standard 18%",
    code: "GST_18",
    rate: 18.0,
    description: "Standard GST applicable on SaaS and digital services in India",
    isActive: true,
    country: "IN",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4000-8000-000000000002",
    name: "GST Reduced 12%",
    code: "GST_12",
    rate: 12.0,
    description: "Reduced GST rate for software utilities and hardware services",
    isActive: true,
    country: "IN",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4000-8000-000000000003",
    name: "GST Concessional 5%",
    code: "GST_5",
    rate: 5.0,
    description: "Concessional tax rate for educational institutions",
    isActive: true,
    country: "IN",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
  {
    id: "11111111-1111-4000-8000-000000000004",
    name: "Export Zero Tax 0%",
    code: "GST_0",
    rate: 0.0,
    description: "Zero-rated export of services outside India (LUT)",
    isActive: true,
    country: "IN",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  },
];

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

export async function getTaxRules(): Promise<TaxRule[]> {
  const supabase = createServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tax_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDbTaxRule);
      }
    } catch {
      // Graceful fallback to local store if Supabase table is empty or unmigrated
    }
  }

  return [...taxRulesStore];
}

export async function getTaxRuleByCode(code: string): Promise<TaxRule | null> {
  const supabase = createServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tax_rules")
        .select("*")
        .ilike("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        return mapDbTaxRule(data);
      }
    } catch {
      // Fallback
    }
  }

  const rule = taxRulesStore.find(
    (t) => t.code.toUpperCase() === code.toUpperCase() && t.isActive
  );
  return rule ? { ...rule } : null;
}

export async function createTaxRule(input: CreateTaxRuleInput): Promise<TaxRule> {
  const code = input.code.toUpperCase();
  const supabase = createServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tax_rules")
        .insert({
          name: input.name,
          code,
          rate: input.rate,
          description: input.description,
          country: input.country || "IN",
          state: input.state,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const created = mapDbTaxRule(data);
      taxRulesStore.unshift(created);
      return created;
    } catch (err: any) {
      if (err.message && !err.message.includes("fetch failed")) {
        throw err;
      }
    }
  }

  // Local store
  const existing = taxRulesStore.find((t) => t.code.toUpperCase() === code);
  if (existing) {
    throw new Error(`Tax rule with code "${code}" already exists.`);
  }

  const newRule: TaxRule = {
    id: crypto.randomUUID(),
    name: input.name,
    code,
    rate: input.rate,
    description: input.description,
    isActive: true,
    country: input.country || "IN",
    state: input.state,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  taxRulesStore.unshift(newRule);
  return { ...newRule };
}
