import { mapPlanRowToPlan, mapPlanToRow } from "@/services/catalog-mappers";
import { getSupabaseClient } from "@/services/supabase-client";
import type {
  PaginatedResult,
  PaginationParams,
  Plan,
  PlanRow,
  PlanWithId,
} from "@/types/catalog";

export interface CreatePlanInput extends Plan {}

export interface UpdatePlanInput extends Partial<Plan> {}

/**
 * List plans with pagination and optional search filter.
 */
export async function listPlans(
  params: PaginationParams = {}
): Promise<PaginatedResult<PlanWithId>> {
  const { page = 1, pageSize = 20, search } = params;
  const supabase = getSupabaseClient();

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  let query = supabase
    .from("plans")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search && search.trim().length > 0) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to list plans: ${error.message}`);
  }

  const plans: PlanWithId[] = (data ?? []).map((row: any) =>
    mapPlanRowToPlan(row as PlanRow)
  );

  return {
    data: plans,
    total: count ?? plans.length,
  };
}

/**
 * Retrieve a single plan by ID.
 */
export async function getPlan(id: string): Promise<PlanWithId | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch plan: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapPlanRowToPlan(data as PlanRow);
}

/**
 * Create a new plan.
 */
export async function createPlan(input: CreatePlanInput): Promise<PlanWithId> {
  const supabase = getSupabaseClient();
  const planRowPayload = mapPlanToRow(input);

  const { data, error } = await supabase
    .from("plans")
    .insert(planRowPayload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create plan: ${error?.message ?? "Unknown error"}`);
  }

  return mapPlanRowToPlan(data as PlanRow);
}

/**
 * Update an existing plan.
 */
export async function updatePlan(
  id: string,
  input: UpdatePlanInput
): Promise<PlanWithId> {
  const supabase = getSupabaseClient();
  const planRowPayload = mapPlanToRow(input);

  const { data, error } = await supabase
    .from("plans")
    .update(planRowPayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update plan: ${error?.message ?? "Plan not found"}`);
  }

  return mapPlanRowToPlan(data as PlanRow);
}

/**
 * Delete a plan by ID. Catches foreign key restrict errors and throws a friendly message.
 */
export async function deletePlan(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("plans").delete().eq("id", id);

  if (error) {
    if (
      error.code === "23503" ||
      error.message?.toLowerCase().includes("foreign key") ||
      error.message?.toLowerCase().includes("violates foreign key constraint")
    ) {
      throw new Error(
        "Cannot delete plan because it is currently used by existing subscriptions or quotation templates."
      );
    }
    throw new Error(`Failed to delete plan: ${error.message}`);
  }
}
