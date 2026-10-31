"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { planSchema } from "@/lib/validations/subscription";
import {
  createPlan,
  deletePlan,
  updatePlan,
  type CreatePlanInput,
  type UpdatePlanInput,
} from "@/services/plans.service";
import type { PlanWithId } from "@/types/catalog";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // In unit test runner or non-RSC context, ignore revalidate errors
  }
}

/**
 * Server action to create a plan (Admin only).
 */
export async function createPlanAction(
  rawInput: unknown
): Promise<ActionResponse<PlanWithId>> {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only administrators can create plans.",
      };
    }

    const parsed = planSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload: CreatePlanInput = parsed.data;
    const created = await createPlan(payload);
    safeRevalidate("/plans");
    safeRevalidate("/admin/plans");

    return { success: true, data: created };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create plan.";
    return { success: false, error: message };
  }
}

/**
 * Server action to update a plan (Admin only).
 */
export async function updatePlanAction(
  id: string,
  rawInput: unknown
): Promise<ActionResponse<PlanWithId>> {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only administrators can update plans.",
      };
    }

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Plan ID is required.",
      };
    }

    const parsed = planSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload: UpdatePlanInput = parsed.data;
    const updated = await updatePlan(id, payload);
    safeRevalidate("/plans");
    safeRevalidate("/admin/plans");

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update plan.";
    return { success: false, error: message };
  }
}

/**
 * Server action to delete a plan (Admin only).
 */
export async function deletePlanAction(id: string): Promise<ActionResponse<void>> {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only administrators can delete plans.",
      };
    }

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Plan ID is required.",
      };
    }

    await deletePlan(id);
    safeRevalidate("/plans");
    safeRevalidate("/admin/plans");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to delete plan.";
    return { success: false, error: message };
  }
}
