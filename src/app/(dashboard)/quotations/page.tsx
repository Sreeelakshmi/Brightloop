import { requireUser } from "@/lib/auth/require-user";
import { listTemplates } from "@/services/templates.service";
import { QuotationsListClient } from "./quotations-list-client";
import type { QuotationTemplateWithDetails } from "@/types/subscription-services";
import type { UserRole } from "@/types";

interface QuotationsPageProps {
  searchParams?: {
    page?: string;
    search?: string;
  };
}

export default async function QuotationsPage({ searchParams }: QuotationsPageProps) {
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

  let templates: QuotationTemplateWithDetails[] = [];
  let total = 0;

  try {
    const result = await listTemplates({ page, pageSize, search });
    templates = result.data;
    total = result.total;
  } catch {
    templates = [];
    total = 0;
  }

  return (
    <QuotationsListClient
      initialTemplates={templates}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      role={role}
      initialSearch={search}
    />
  );
}
