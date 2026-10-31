import { notFound } from "next/navigation";
import { getSubscriptionById } from "@/lib/services/subscriptions";
import { getCurrentUser } from "@/lib/auth";
import { SubscriptionDetailClient } from "@/components/admin/SubscriptionDetailClient";

export const dynamic = "force-dynamic";

interface SubscriptionDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const user = await getCurrentUser();
  const sub = await getSubscriptionById(params.id);

  if (!sub) {
    notFound();
  }

  return <SubscriptionDetailClient initialSubscription={sub} isAdmin={user?.role === "admin"} />;
}
