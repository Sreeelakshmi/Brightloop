import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getProduct } from "@/services/products.service";
import { ProductForm } from "@/components/subscriptions/ProductForm";
import { Button } from "@/components/ui/button";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  let isAdmin = false;
  try {
    const user = await requireUser();
    isAdmin = user.role === "admin" || user.role === "owner";
  } catch {
    isAdmin = false;
  }

  let product = null;
  try {
    product = await getProduct(params.id);
  } catch {
    // Handled below
  }

  if (!product) {
    notFound();
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          Only administrators can modify catalog products.
        </p>
        <Link href="/products">
          <Button variant="outline">Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/products" className="text-xs text-muted-foreground hover:underline">
          &larr; Back to Products
        </Link>
      </div>
      <ProductForm initialProduct={product} />
    </div>
  );
}
