"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { productSchema, productVariantSchema } from "@/lib/validations/subscription";
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type CreateProductInput,
  type UpdateProductInput,
  type VariantInput,
} from "@/services/products.service";
import type { ProductWithVariants } from "@/types/catalog";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const variantFormItemSchema = productVariantSchema.omit({ productId: true }).extend({
  id: z.string().optional(),
});

const productFormPayloadSchema = productSchema.extend({
  variants: z.array(variantFormItemSchema).optional(),
});

function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // In unit test runner or non-RSC context, ignore revalidate errors
  }
}

/**
 * Server action to create a product (Admin only).
 */
export async function createProductAction(
  rawInput: unknown
): Promise<ActionResponse<ProductWithVariants>> {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only administrators can create products.",
      };
    }

    const parsed = productFormPayloadSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload: CreateProductInput = {
      name: parsed.data.name,
      type: parsed.data.type,
      salesPrice: parsed.data.salesPrice,
      costPrice: parsed.data.costPrice,
      notes: parsed.data.notes,
      variants: parsed.data.variants?.map((v) => ({
        attribute: v.attribute,
        value: v.value,
        extraPrice: v.extraPrice,
      })),
    };

    const created = await createProduct(payload);
    safeRevalidate("/products");
    safeRevalidate("/admin/products");

    return { success: true, data: created };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product.";
    return { success: false, error: message };
  }
}

/**
 * Server action to update a product and its variants (Admin only).
 */
export async function updateProductAction(
  id: string,
  rawInput: unknown
): Promise<ActionResponse<ProductWithVariants>> {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only administrators can update products.",
      };
    }

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    const parsed = productFormPayloadSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please correct the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload: UpdateProductInput = {
      name: parsed.data.name,
      type: parsed.data.type,
      salesPrice: parsed.data.salesPrice,
      costPrice: parsed.data.costPrice,
      notes: parsed.data.notes,
      variants: parsed.data.variants as VariantInput[] | undefined,
    };

    const updated = await updateProduct(id, payload);
    safeRevalidate("/products");
    safeRevalidate("/admin/products");

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update product.";
    return { success: false, error: message };
  }
}

/**
 * Server action to delete a product (Admin only).
 */
export async function deleteProductAction(id: string): Promise<ActionResponse<void>> {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return {
        success: false,
        error: "Forbidden: Only administrators can delete products.",
      };
    }

    if (!id || typeof id !== "string") {
      return {
        success: false,
        error: "Product ID is required.",
      };
    }

    await deleteProduct(id);
    safeRevalidate("/products");
    safeRevalidate("/admin/products");

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to delete product.";
    return { success: false, error: message };
  }
}
