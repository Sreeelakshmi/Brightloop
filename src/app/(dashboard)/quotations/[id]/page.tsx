import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getTemplate } from "@/services/templates.service";
import { listPlans } from "@/services/plans.service";
import { listProducts } from "@/services/products.service";
import { TemplateForm } from "@/components/subscriptions/TemplateForm";

interface EditTemplatePageProps {
  params: { id: string };
}

export default async function EditQuotationTemplatePage({ params }: EditTemplatePageProps) {
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
        <p className="text-sm text-[#657367]">Only staff and administrators can edit proposal templates.</p>
        <Link href="/quotations" className="text-sm underline text-[#1F2622]">Return to Templates</Link>
      </div>
    );
  }

  const [template, plansRes, prodsRes] = await Promise.all([
    getTemplate(params.id),
    listPlans({ pageSize: 100 }),
    listProducts({ pageSize: 100 }),
  ]);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/quotations" className="text-xs text-[#657367] hover:underline">&larr; Back to Templates</Link>
      </div>
      <TemplateForm initialTemplate={template} plans={plansRes.data} products={prodsRes.data} />
    </div>
  );
}
