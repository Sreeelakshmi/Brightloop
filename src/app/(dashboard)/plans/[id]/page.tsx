import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getPlan } from "@/services/plans.service";
import { PlanForm } from "@/components/subscriptions/PlanForm";
import { THEME } from "@/components/subscriptions/theme";

export const dynamic = "force-dynamic";

interface EditPlanPageProps {
  params: {
    id: string;
  };
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
  let isAdmin = false;
  try {
    const user = await requireUser();
    isAdmin = user.role === "admin" || user.role === "owner";
  } catch {
    isAdmin = false;
  }

  let plan = null;
  try {
    plan = await getPlan(params.id);
  } catch {
    // Handled below
  }

  if (!plan) {
    notFound();
  }

  if (!isAdmin) {
    return (
      <div className={`p-8 max-w-md mx-auto text-center space-y-4 ${THEME.card}`}>
        <h2 className="text-xl font-bold uppercase tracking-tight text-[#D95522]">Access Restricted</h2>
        <p className="text-xs uppercase tracking-wider text-[#657367]">
          Only administrators can modify pricing plans.
        </p>
        <Link href="/plans" className={`inline-block px-4 py-2 ${THEME.secondaryButton} text-xs uppercase tracking-wider`}>
          Back to Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/plans" className="text-xs uppercase tracking-wider text-[#657367] hover:underline">
          &larr; Back to Plans
        </Link>
      </div>
      <PlanForm initialPlan={plan} />
    </div>
  );
}
