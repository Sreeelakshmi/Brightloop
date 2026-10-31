"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { quotationTemplateSchema } from "@/lib/validations/subscription";
import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from "@/services/templates.service";
import type { QuotationTemplateWithDetails } from "@/types/subscription-services";

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
    // ignore outside RSC
  }
}

/**
 * Server action to create a quotation template (Admin and Staff).
 */
export async function createTemplateAction(
  rawInput: unknown
): Promise<ActionResponse<QuotationTemplateWithDetails>> {
  try {
    const user = await requireUser();
    if (user.role === "customer") {
      return {
        success: false,
        error: "Forbidden: Customers cannot create quotation templates.",
      };
    }

    const parsed = quotationTemplateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please review the template fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const created = await createTemplate(parsed.data);
    safeRevalidate("/quotations");

    return { success: true, data: created };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create template.";
    return { success: false, error: message };
  }
}

/**
 * Server action to update a quotation template (Admin and Staff).
 */
export async function updateTemplateAction(
  id: string,
  rawInput: unknown
): Promise<ActionResponse<QuotationTemplateWithDetails>> {
  try {
    const user = await requireUser();
    if (user.role === "customer") {
      return {
        success: false,
        error: "Forbidden: Customers cannot update quotation templates.",
      };
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Template ID is required." };
    }

    const parsed = quotationTemplateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please review the template fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const updated = await updateTemplate(id, parsed.data);
    safeRevalidate("/quotations");

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update template.";
    return { success: false, error: message };
  }
}

/**
 * Server action to delete a quotation template (Admin only).
 */
export async function deleteTemplateAction(id: string): Promise<ActionResponse<void>> {
  try {
    const user = await requireUser();
    if (user.role !== "admin" && user.role !== "owner") {
      return {
        success: false,
        error: "Forbidden: Only administrators can delete quotation templates.",
      };
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Template ID is required." };
    }

    await deleteTemplate(id);
    safeRevalidate("/quotations");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete template.";
    return { success: false, error: message };
  }
}
