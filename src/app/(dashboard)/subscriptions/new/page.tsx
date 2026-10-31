import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { listTemplates } from "@/services/templates.service";
import { listPlans } from "@/services/plans.service";
import { listProducts } from "@/services/products.service";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
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
        <p className="text-sm text-[#657367]">Only staff and administrators can create subscription agreements.</p>
        <Link href="/subscriptions" className="text-sm underline text-[#1F2622]">Return to Subscriptions</Link>
      </div>
    );
  }

  let templates: any[] = [];
  let plans: any[] = [];
  let products: any[] = [];
  try {
    const [tplsRes, plansRes, prodsRes] = await Promise.all([
      listTemplates({ pageSize: 100 }),
      listPlans({ pageSize: 100 }),
      listProducts({ pageSize: 100 }),
    ]);
    templates = tplsRes.data;
    plans = plansRes.data;
    products = prodsRes.data;
  } catch {
    templates = [];
    plans = [];
    products = [];
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/subscriptions" className="text-xs text-[#657367] hover:underline">&larr; Back to Subscriptions</Link>
      </div>
      <SubscriptionForm
        templates={templates}
        plans={plans}
        products={products}
      />
    </div>
  );
}
