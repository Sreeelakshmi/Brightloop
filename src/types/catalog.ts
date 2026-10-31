import type {
  BillingPeriod,
  Plan,
  Product,
  ProductType,
  ProductVariant,
} from "@/types/subscription";

export interface ProductVariantWithId extends ProductVariant {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductWithVariants extends Product {
  id: string;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariantWithId[];
}

export interface PlanWithId extends Plan {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface ProductRow {
  id: string;
  name: string;
  type: string;
  sales_price: number | string;
  cost_price: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  attribute: string;
  value: string;
  extra_price: number | string;
  created_at: string;
  updated_at: string;
}

export interface PlanRow {
  id: string;
  name: string;
  price: number | string;
  billing_period: string;
  min_quantity: number;
  available_from: string | null;
  available_to: string | null;
  auto_close: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
  created_at: string;
  updated_at: string;
}

export type { BillingPeriod, Plan, Product, ProductType, ProductVariant };
