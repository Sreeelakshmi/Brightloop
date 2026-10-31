import {
  mapProductRowToProduct,
  mapProductToRow,
  mapVariantRowToVariant,
  mapVariantToRow,
} from "@/services/catalog-mappers";
import { getSupabaseClient } from "@/services/supabase-client";
import type {
  PaginatedResult,
  PaginationParams,
  Product,
  ProductRow,
  ProductVariantRow,
  ProductWithVariants,
} from "@/types/catalog";

export interface VariantInput {
  id?: string;
  attribute: string;
  value: string;
  extraPrice: number;
}

export interface CreateProductInput extends Product {
  variants?: VariantInput[];
}

export interface UpdateProductInput extends Partial<Product> {
  variants?: VariantInput[];
}

/**
 * List products with pagination and optional search filter.
 */
export async function listProducts(
  params: PaginationParams = {}
): Promise<PaginatedResult<ProductWithVariants>> {
  const { page = 1, pageSize = 20, search } = params;
  const supabase = getSupabaseClient();

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*, product_variants(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search && search.trim().length > 0) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Failed to list products: ${error.message}`);
  }

  const products: ProductWithVariants[] = (data ?? []).map((row: any) => {
    const variantRows = (row.product_variants ?? []) as ProductVariantRow[];
    return mapProductRowToProduct(row as ProductRow, variantRows);
  });

  return {
    data: products,
    total: count ?? products.length,
  };
}

/**
 * Retrieve a single product by ID along with its variants.
 */
export async function getProduct(id: string): Promise<ProductWithVariants | null> {
  const supabase = getSupabaseClient();

  const { data: productRow, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (productError) {
    throw new Error(`Failed to fetch product: ${productError.message}`);
  }

  if (!productRow) {
    return null;
  }

  const { data: variantRows, error: variantError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("created_at", { ascending: true });

  if (variantError) {
    throw new Error(`Failed to fetch product variants: ${variantError.message}`);
  }

  return mapProductRowToProduct(
    productRow as ProductRow,
    (variantRows ?? []) as ProductVariantRow[]
  );
}

/**
 * Create a new product and insert its associated variants.
 */
export async function createProduct(
  input: CreateProductInput
): Promise<ProductWithVariants> {
  const supabase = getSupabaseClient();
  const productRowPayload = mapProductToRow(input);

  const { data: createdRow, error: productError } = await supabase
    .from("products")
    .insert(productRowPayload)
    .select()
    .single();

  if (productError || !createdRow) {
    throw new Error(`Failed to create product: ${productError?.message ?? "Unknown error"}`);
  }

  const productId = createdRow.id;
  const savedVariants: ProductVariantRow[] = [];

  if (input.variants && input.variants.length > 0) {
    const variantInserts = input.variants.map((v) => ({
      ...mapVariantToRow({
        productId,
        attribute: v.attribute,
        value: v.value,
        extraPrice: v.extraPrice,
      }),
      product_id: productId,
    }));

    const { data: insertedVariants, error: variantError } = await supabase
      .from("product_variants")
      .insert(variantInserts)
      .select();

    if (variantError) {
      throw new Error(`Failed to create product variants: ${variantError.message}`);
    }

    if (insertedVariants) {
      savedVariants.push(...(insertedVariants as ProductVariantRow[]));
    }
  }

  return mapProductRowToProduct(createdRow as ProductRow, savedVariants);
}

/**
 * Update an existing product and sync its variants (insert new, update changed, delete removed).
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ProductWithVariants> {
  const supabase = getSupabaseClient();
  const productRowPayload = mapProductToRow(input);

  const { data: updatedRow, error: productError } = await supabase
    .from("products")
    .update(productRowPayload)
    .eq("id", id)
    .select()
    .single();

  if (productError || !updatedRow) {
    throw new Error(`Failed to update product: ${productError?.message ?? "Product not found"}`);
  }

  // Handle variants synchronization if variants array is supplied
  if (input.variants !== undefined) {
    const { data: existingRows, error: fetchError } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id);

    if (fetchError) {
      throw new Error(`Failed to fetch existing variants: ${fetchError.message}`);
    }

    const existingVariants = (existingRows ?? []) as ProductVariantRow[];
    const existingById = new Map<string, ProductVariantRow>(
      existingVariants.map((v) => [v.id, v])
    );

    const incomingIds = new Set(
      input.variants.map((v) => v.id).filter((vId): vId is string => Boolean(vId))
    );

    // 1. Delete variants removed by user
    const toDeleteIds = existingVariants
      .filter((v) => !incomingIds.has(v.id))
      .map((v) => v.id);

    if (toDeleteIds.length > 0) {
      const { error: delError } = await supabase
        .from("product_variants")
        .delete()
        .in("id", toDeleteIds);

      if (delError) {
        throw new Error(`Failed to delete removed variants: ${delError.message}`);
      }
    }

    // 2. Insert new variants (no id or id not existing)
    const toInsert = input.variants
      .filter((v) => !v.id || !existingById.has(v.id))
      .map((v) => ({
        product_id: id,
        attribute: v.attribute,
        value: v.value,
        extra_price: v.extraPrice,
      }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("product_variants")
        .insert(toInsert);

      if (insertError) {
        throw new Error(`Failed to insert new variants: ${insertError.message}`);
      }
    }

    // 3. Update existing changed variants
    const toUpdate = input.variants.filter((v) => v.id && existingById.has(v.id));
    for (const v of toUpdate) {
      const existing = existingById.get(v.id!);
      if (
        existing &&
        (existing.attribute !== v.attribute ||
          existing.value !== v.value ||
          Number(existing.extra_price) !== Number(v.extraPrice))
      ) {
        const { error: updateVarError } = await supabase
          .from("product_variants")
          .update({
            attribute: v.attribute,
            value: v.value,
            extra_price: v.extraPrice,
          })
          .eq("id", v.id!);

        if (updateVarError) {
          throw new Error(`Failed to update variant: ${updateVarError.message}`);
        }
      }
    }
  }

  // Refetch final variants list
  const { data: finalVariants, error: finalVarError } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("created_at", { ascending: true });

  if (finalVarError) {
    throw new Error(`Failed to fetch updated variants: ${finalVarError.message}`);
  }

  return mapProductRowToProduct(
    updatedRow as ProductRow,
    (finalVariants ?? []) as ProductVariantRow[]
  );
}

/**
 * Delete a product by ID. Catches foreign key restrict errors and throws a friendly message.
 */
export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    if (
      error.code === "23503" ||
      error.message?.toLowerCase().includes("foreign key") ||
      error.message?.toLowerCase().includes("violates foreign key constraint")
    ) {
      throw new Error(
        "Cannot delete product because it is currently used by existing subscriptions or quotations."
      );
    }
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}
