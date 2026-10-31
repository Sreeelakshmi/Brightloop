import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { listPlans } from "@/services/plans.service";
import { listProducts } from "@/services/products.service";
import { TemplateForm } from "@/components/subscriptions/TemplateForm";

export const dynamic = "force-dynamic";

export default async function NewQuotationTemplatePage() {
  let isPermitted = false;
  try {
    const user = await requireUser();
    isPermitted = user.role !== "customer";
  } catch {
    isPermitted = false;
  }

  if (!isPermitted) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold uppercase text-[#D95522]">Access Restricted</h2>
        <p className="text-sm text-[#657367]">Only staff and administrators can create proposal templates.</p>
        <Link href="/quotations" className="text-sm underline text-[#1F2622]">Return to Templates</Link>
      </div>
    );
  }

  let plans: any[] = [];
  let products: any[] = [];
  try {
    const [plansRes, prodsRes] = await Promise.all([
      listPlans({ pageSize: 100 }),
      listProducts({ pageSize: 100 }),
    ]);
    plans = plansRes.data;
    products = prodsRes.data;
  } catch {
    plans = [];
    products = [];
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/quotations" className="text-xs text-[#657367] hover:underline">&larr; Back to Templates</Link>
      </div>
      <TemplateForm plans={plans} products={products} />
    </div>
  );
}
