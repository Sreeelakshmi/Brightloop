import type {
  BillingPeriod,
  Plan,
  PlanRow,
  PlanWithId,
  Product,
  ProductRow,
  ProductType,
  ProductVariant,
  ProductVariantRow,
  ProductVariantWithId,
  ProductWithVariants,
} from "@/types/catalog";

/**
 * Maps a database product_variants row to camelCase domain model.
 */
export function mapVariantRowToVariant(row: ProductVariantRow): ProductVariantWithId {
  return {
    id: row.id,
    productId: row.product_id,
    attribute: row.attribute,
    value: row.value,
    extraPrice: typeof row.extra_price === "number" ? row.extra_price : Number(row.extra_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Maps a camelCase variant to snake_case database row columns.
 */
export function mapVariantToRow(variant: Partial<ProductVariant>): Partial<ProductVariantRow> {
  const row: Partial<ProductVariantRow> = {};
  if (variant.productId !== undefined) row.product_id = variant.productId;
  if (variant.attribute !== undefined) row.attribute = variant.attribute;
  if (variant.value !== undefined) row.value = variant.value;
  if (variant.extraPrice !== undefined) row.extra_price = variant.extraPrice;
  return row;
}

/**
 * Maps a database products row to camelCase domain model.
 */
export function mapProductRowToProduct(
  row: ProductRow,
  variantRows: ProductVariantRow[] = []
): ProductWithVariants {
  return {
    id: row.id,
    name: row.name,
    type: row.type as ProductType,
    salesPrice: typeof row.sales_price === "number" ? row.sales_price : Number(row.sales_price),
    costPrice: typeof row.cost_price === "number" ? row.cost_price : Number(row.cost_price),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    variants: variantRows.map(mapVariantRowToVariant),
  };
}

/**
 * Maps a camelCase product to snake_case database row columns.
 */
export function mapProductToRow(product: Partial<Product>): Partial<ProductRow> {
  const row: Partial<ProductRow> = {};
  if (product.name !== undefined) row.name = product.name;
  if (product.type !== undefined) row.type = product.type;
  if (product.salesPrice !== undefined) row.sales_price = product.salesPrice;
  if (product.costPrice !== undefined) row.cost_price = product.costPrice;
  if ("notes" in product) row.notes = product.notes ?? null;
  return row;
}

/**
 * Maps a database plans row to camelCase domain model.
 */
export function mapPlanRowToPlan(row: PlanRow): PlanWithId {
  return {
    id: row.id,
    name: row.name,
    price: typeof row.price === "number" ? row.price : Number(row.price),
    billingPeriod: row.billing_period as BillingPeriod,
    minQuantity: row.min_quantity,
    availableFrom: row.available_from ?? undefined,
    availableTo: row.available_to ?? undefined,
    autoClose: Boolean(row.auto_close),
    closable: Boolean(row.closable),
    pausable: Boolean(row.pausable),
    renewable: Boolean(row.renewable),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Maps a camelCase plan to snake_case database row columns.
 */
export function mapPlanToRow(plan: Partial<Plan>): Partial<PlanRow> {
  const row: Partial<PlanRow> = {};
  if (plan.name !== undefined) row.name = plan.name;
  if (plan.price !== undefined) row.price = plan.price;
  if (plan.billingPeriod !== undefined) row.billing_period = plan.billingPeriod;
  if (plan.minQuantity !== undefined) row.min_quantity = plan.minQuantity;
  if ("availableFrom" in plan) row.available_from = plan.availableFrom ?? null;
  if ("availableTo" in plan) row.available_to = plan.availableTo ?? null;
  if (plan.autoClose !== undefined) row.auto_close = plan.autoClose;
  if (plan.closable !== undefined) row.closable = plan.closable;
  if (plan.pausable !== undefined) row.pausable = plan.pausable;
  if (plan.renewable !== undefined) row.renewable = plan.renewable;
  return row;
}
