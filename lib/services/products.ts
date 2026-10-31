import { Product, ProductVariant } from "@/types";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { requireRole } from "./users";
import { UserRole } from "@/lib/auth";
import { calculateEffectivePrice } from "@/lib/business-rules";

export { calculateEffectivePrice };

export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function listProducts(options?: {
  search?: string;
  type?: string;
  includeArchived?: boolean;
}): Promise<Product[]> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    let prods = db.store.products || [];

    if (!options?.includeArchived) {
      prods = prods.filter((p) => !p.archived);
    }
    if (options?.type && options.type !== "all") {
      prods = prods.filter((p) => p.type === options.type);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q) ||
          p.variants?.some((v) => v.attributeValue.toLowerCase().includes(q))
      );
    }
    return prods;
  }

  // TODO: Supabase implementation
  // const { data, error } = await supabase.from('products').select('*, variants:product_variants(*)');
  // if (error) throw error;
  // return data;
  return [];
}

export async function getProductById(id: string): Promise<Product | null> {
  if (USE_MOCK_DATA) {
    const db = getMockDb();
    return db.store.products?.find((p) => p.id === id) || null;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('products').select('*, variants:product_variants(*)').eq('id', id).single();
  // return data;
  return null;
}

export async function createProduct(
  input: {
    name: string;
    type: "service" | "consumable" | "storable";
    salesPrice: number;
    costPrice: number;
    notes?: string;
    variants?: Array<{ attributeName: string; attributeValue: string; extraPrice: number }>;
  },
  actorRole: UserRole = "admin"
): Promise<Product> {
  requireRole(actorRole, ["admin", "staff"]);

  if (!input.name?.trim()) {
    throw new Error("Product name is required.");
  }
  if (input.salesPrice < 0) {
    throw new Error("Sales price must be positive.");
  }

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const id = `prod-${Date.now().toString(36)}`;
    const variants: ProductVariant[] = (input.variants || []).map((v, i) => ({
      id: `var-${id}-${i + 1}`,
      productId: id,
      attributeName: v.attributeName || "Brand",
      attributeValue: v.attributeValue,
      extraPrice: Number(v.extraPrice) || 0,
    }));

    const newProd: Product = {
      id,
      name: input.name.trim(),
      type: input.type,
      salesPrice: Number(input.salesPrice),
      costPrice: Number(input.costPrice) || 0,
      notes: input.notes?.trim() || "",
      archived: false,
      variants,
      createdAt: new Date().toISOString(),
    };

    db.store.products.unshift(newProd);
    saveMockDb(db);
    return newProd;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('products').insert(...).select().single();
  // return data;
  throw new Error("Supabase not configured");
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id">>,
  actorRole: UserRole = "admin"
): Promise<Product> {
  requireRole(actorRole, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const idx = db.store.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Product not found: ${id}`);
    }

    const current = db.store.products[idx];
    const updated: Product = {
      ...current,
      ...updates,
      salesPrice: updates.salesPrice !== undefined ? Number(updates.salesPrice) : current.salesPrice,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : current.costPrice,
    };

    db.store.products[idx] = updated;
    saveMockDb(db);
    return updated;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('products').update(updates).eq('id', id).select().single();
  // return data;
  throw new Error("Supabase not configured");
}

export async function toggleArchiveProduct(
  id: string,
  archived: boolean,
  actorRole: UserRole = "admin"
): Promise<Product> {
  requireRole(actorRole, ["admin", "staff"]);

  if (USE_MOCK_DATA) {
    const db = getMockDb();
    const prod = db.store.products.find((p) => p.id === id);
    if (!prod) {
      throw new Error(`Product not found: ${id}`);
    }
    prod.archived = archived;
    saveMockDb(db);
    return prod;
  }

  // TODO: Supabase implementation
  // const { data } = await supabase.from('products').update({ archived }).eq('id', id).select().single();
  // return data;
  throw new Error("Supabase not configured");
}
