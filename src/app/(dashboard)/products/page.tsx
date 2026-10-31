import { requireUser } from "@/lib/auth/require-user";
import { listProducts } from "@/services/products.service";
import { ProductsListClient } from "./products-list-client";
import type { ProductWithVariants } from "@/types/catalog";
import type { UserRole } from "@/types";

interface ProductsPageProps {
  searchParams?: {
    page?: string;
    search?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const page = Number(searchParams?.page) || 1;
  const search = searchParams?.search || "";
  const pageSize = 20;

  let role: UserRole = "customer";
  try {
    const user = await requireUser();
    role = user.role;
  } catch {
    role = "customer";
  }

  let products: ProductWithVariants[] = [];
  let total = 0;

  try {
    const result = await listProducts({ page, pageSize, search });
    products = result.data;
    total = result.total;
  } catch (err: unknown) {
    // Return empty state with error handled gracefully in UI
    products = [];
    total = 0;
  }

  return (
    <ProductsListClient
      initialProducts={products}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      role={role}
      initialSearch={search}
    />
  );
}

