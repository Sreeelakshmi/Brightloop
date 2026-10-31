import { requireUser } from "@/lib/auth/require-user";
import { listSubscriptions } from "@/services/subscriptions.service";
import { SubscriptionsListClient } from "./subscriptions-list-client";
import type { SubscriptionWithDetails } from "@/types/subscription-services";
import type { SubscriptionStatus, UserRole } from "@/types";

interface SubscriptionsPageProps {
  searchParams?: {
    page?: string;
    search?: string;
    status?: string;
  };
}

export default async function SubscriptionsPage({ searchParams }: SubscriptionsPageProps) {
  const page = Number(searchParams?.page) || 1;
  const search = searchParams?.search || "";
  const status = (searchParams?.status as SubscriptionStatus) || undefined;
  const pageSize = 20;

  let role: UserRole = "customer";
  try {
    const user = await requireUser();
    role = user.role;
  } catch {
    role = "customer";
  }

  let subscriptions: SubscriptionWithDetails[] = [];
  let total = 0;

  try {
    const result = await listSubscriptions({ page, pageSize, search, status });
    subscriptions = result.data;
    total = result.total;
  } catch {
    subscriptions = [];
    total = 0;
  }

  return (
    <SubscriptionsListClient
      initialSubscriptions={subscriptions}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      role={role}
      initialStatus={status || ""}
      initialSearch={search}
    />
  );
}
