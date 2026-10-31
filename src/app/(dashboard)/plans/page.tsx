import { requireUser } from "@/lib/auth/require-user";
import { listPlans } from "@/services/plans.service";
import { PlansListClient } from "./plans-list-client";
import type { PlanWithId } from "@/types/catalog";
import type { UserRole } from "@/types";

interface PlansPageProps {
  searchParams?: {
    page?: string;
    search?: string;
  };
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const page = Number(searchParams?.page) || 1;
  const search = searchParams?.search || "";
  const pageSize = 20;

  let role: UserRole = "customer";
  try {
    const user = await requireUser();
    role = user.role;
  } catch {
    role = "customer";
  }

  let plans: PlanWithId[] = [];
  let total = 0;

  try {
    const result = await listPlans({ page, pageSize, search });
    plans = result.data;
    total = result.total;
  } catch {
    plans = [];
    total = 0;
  }

  return (
    <PlansListClient
      initialPlans={plans}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      role={role}
      initialSearch={search}
    />
  );
}
