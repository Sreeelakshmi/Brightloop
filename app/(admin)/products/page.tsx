import { listProducts } from "@/lib/services/products";
import { getCurrentUser } from "@/lib/auth";
import { ProductsClient } from "@/components/admin/ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const products = await listProducts({ includeArchived: true });

  return <ProductsClient initialProducts={products} isAdmin={user?.role === "admin"} />;
}
