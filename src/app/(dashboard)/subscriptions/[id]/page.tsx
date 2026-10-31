import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getSubscription } from "@/services/subscriptions.service";
import { SubscriptionDetail } from "@/components/subscriptions/SubscriptionDetail";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

interface SubscriptionDetailPageProps {
  params: { id: string };
}

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  let role: UserRole = "customer";
  try {
    const user = await requireUser();
    role = user.role;
  } catch {
    role = "customer";
  }

  let subscription = null;
  try {
    subscription = await getSubscription(params.id);
  } catch {
    // Handled below
  }

  if (!subscription) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/subscriptions" className="text-xs text-[#657367] hover:underline">&larr; Back to Subscriptions</Link>
      </div>
      <SubscriptionDetail subscription={subscription} role={role} />
    </div>
  );
}
