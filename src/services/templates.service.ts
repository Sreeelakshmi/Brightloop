import { getSupabaseClient } from "@/services/supabase-client";
import { mapPlanRowToPlan } from "@/services/catalog-mappers";
import type {
  PaginationParams,
  PaginatedResult,
  PlanRow,
} from "@/types/catalog";
import type {
  QuotationTemplateWithDetails,
  TemplateLineWithId,
} from "@/types/subscription-services";
import type { QuotationTemplate } from "@/types/subscription";

export interface TemplateRow {
  id: string;
  name: string;
  plan_id: string;
  validity_days: number;
  created_at: string;
  updated_at: string;
  plans?: PlanRow | null;
  quotation_template_lines?: TemplateLineRow[];
}

export interface TemplateLineRow {
  id: string;
  template_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number | string;
  tax_id: string | null;
  created_at: string;
  updated_at: string;
}

export function mapTemplateLineRowToLine(row: TemplateLineRow): TemplateLineWithId {
  const unitPrice = typeof row.unit_price === "number" ? row.unit_price : Number(row.unit_price);
  return {
    id: row.id,
    templateId: row.template_id,
    productId: row.product_id,
    variantId: row.variant_id ?? undefined,
    quantity: row.quantity,
    unitPrice,
    taxId: row.tax_id ?? undefined,
    amount: Math.round(row.quantity * unitPrice * 100) / 100,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTemplateRowToTemplate(
  row: TemplateRow,
  lines: TemplateLineRow[] = []
): QuotationTemplateWithDetails {
  return {
    id: row.id,
    name: row.name,
    planId: row.plan_id,
    validityDays: row.validity_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    plan: row.plans ? mapPlanRowToPlan(row.plans) : null,
    lines: (row.quotation_template_lines ?? lines).map(mapTemplateLineRowToLine),
  };
}

/**
 * List quotation templates with pagination and search.
 */
export async function listTemplates(
  params: PaginationParams = {}
): Promise<PaginatedResult<QuotationTemplateWithDetails>> {
  const { page = 1, pageSize = 20, search } = params;
  const supabase = getSupabaseClient();

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  let query = supabase
    .from("quotation_templates")
    .select("*, plans(*), quotation_template_lines(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search && search.trim().length > 0) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to list quotation templates: ${error.message}`);
  }

  const templates = (data ?? []).map((row: any) =>
    mapTemplateRowToTemplate(row as TemplateRow)
  );

  return {
    data: templates,
    total: count ?? templates.length,
  };
}

/**
 * Get single template with lines and plan.
 */
export async function getTemplate(
  id: string
): Promise<QuotationTemplateWithDetails | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("quotation_templates")
    .select("*, plans(*), quotation_template_lines(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch quotation template: ${error.message}`);
  }

  if (!data) return null;

  return mapTemplateRowToTemplate(data as TemplateRow);
}

/**
 * Create a new quotation template and its lines in atomic succession.
 */
export async function createTemplate(
  input: QuotationTemplate
): Promise<QuotationTemplateWithDetails> {
  const supabase = getSupabaseClient();

  const { data: createdTpl, error: tplError } = await supabase
    .from("quotation_templates")
    .insert({
      name: input.name,
      plan_id: input.planId,
      validity_days: input.validityDays,
    })
    .select("*, plans(*)")
    .single();

  if (tplError || !createdTpl) {
    throw new Error(`Failed to create template: ${tplError?.message ?? "Unknown error"}`);
  }

  const templateId = createdTpl.id;
  let insertedLines: TemplateLineRow[] = [];

  if (input.lines && input.lines.length > 0) {
    const lineInserts = input.lines.map((line) => ({
      template_id: templateId,
      product_id: line.productId,
      variant_id: line.variantId ?? null,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      tax_id: line.taxId ?? null,
    }));

    const { data: linesData, error: linesError } = await supabase
      .from("quotation_template_lines")
      .insert(lineInserts)
      .select();

    if (linesError) {
      throw new Error(`Failed to save template lines: ${linesError.message}`);
    }

    insertedLines = (linesData ?? []) as TemplateLineRow[];
  }

  return mapTemplateRowToTemplate(createdTpl as TemplateRow, insertedLines);
}

/**
 * Update an existing quotation template and synchronize its lines.
 */
export async function updateTemplate(
  id: string,
  input: Partial<QuotationTemplate>
): Promise<QuotationTemplateWithDetails> {
  const supabase = getSupabaseClient();

  const patch: Record<string, any> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.planId !== undefined) patch.plan_id = input.planId;
  if (input.validityDays !== undefined) patch.validity_days = input.validityDays;

  const { data: updatedTpl, error: tplError } = await supabase
    .from("quotation_templates")
    .update(patch)
    .eq("id", id)
    .select("*, plans(*)")
    .single();

  if (tplError || !updatedTpl) {
    throw new Error(`Failed to update template: ${tplError?.message ?? "Template not found"}`);
  }

  if (input.lines !== undefined) {
    // Delete existing lines and re-insert updated lines
    await supabase.from("quotation_template_lines").delete().eq("template_id", id);

    if (input.lines.length > 0) {
      const lineInserts = input.lines.map((line) => ({
        template_id: id,
        product_id: line.productId,
        variant_id: line.variantId ?? null,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        tax_id: line.taxId ?? null,
      }));

      const { data: linesData, error: linesError } = await supabase
        .from("quotation_template_lines")
        .insert(lineInserts)
        .select();

      if (linesError) {
        throw new Error(`Failed to update template lines: ${linesError.message}`);
      }

      return mapTemplateRowToTemplate(
        updatedTpl as TemplateRow,
        (linesData ?? []) as TemplateLineRow[]
      );
    }
  }

  const { data: currentLines } = await supabase
    .from("quotation_template_lines")
    .select("*")
    .eq("template_id", id);

  return mapTemplateRowToTemplate(
    updatedTpl as TemplateRow,
    (currentLines ?? []) as TemplateLineRow[]
  );
}

/**
 * Delete a quotation template.
 */
export async function deleteTemplate(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("quotation_templates").delete().eq("id", id);

  if (error) {
    if (error.code === "23503" || error.message?.includes("foreign key")) {
      throw new Error(
        "Cannot delete template because it is referenced by existing subscriptions."
      );
    }
    throw new Error(`Failed to delete template: ${error.message}`);
  }
}
