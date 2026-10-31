import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { PlanForm } from "@/components/subscriptions/PlanForm";
import { Button } from "@/components/ui/button";

export default async function NewPlanPage() {
  let isAdmin = false;
  try {
    const user = await requireUser();
    isAdmin = user.role === "admin" || user.role === "owner";
  } catch {
    isAdmin = false;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">
          Only administrators can create pricing plans.
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
      <PlanForm />
    </div>
  );
}
