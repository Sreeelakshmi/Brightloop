import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getPlan } from "@/services/plans.service";
import { PlanForm } from "@/components/subscriptions/PlanForm";
import { Button } from "@/components/ui/button";

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
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          Only administrators can modify pricing plans.
        </p>
        <Link href="/plans">
          <Button variant="outline">Back to Plans</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/plans" className="text-xs text-muted-foreground hover:underline">
          &larr; Back to Plans
        </Link>
      </div>
      <PlanForm initialPlan={plan} />
    </div>
  );
}
