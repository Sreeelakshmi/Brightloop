"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TemplateTable } from "@/components/subscriptions/TemplateTable";
import { PageHeader } from "@/components/subscriptions/PageHeader";
import type { QuotationTemplateWithDetails } from "@/types/subscription-services";
import type { UserRole } from "@/types";

interface QuotationsListClientProps {
  initialTemplates: QuotationTemplateWithDetails[];
  total: number;
  currentPage: number;
  pageSize: number;
  role: UserRole;
  initialSearch?: string;
}

export function QuotationsListClient({
  initialTemplates,
  total,
  currentPage,
  pageSize,
  role,
  initialSearch = "",
}: QuotationsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSearch.trim()) params.set("search", newSearch.trim());
      else params.delete("search");
      params.set("page", "1");
      router.push(`/quotations?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/quotations?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="PROPOSAL TEMPLATES"
        subtitle="Manage pre-configured quotation templates, validity windows, and default line packages."
        logDate="31.10.2026"
      />

      <TemplateTable
        templates={initialTemplates}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        role={role}
        searchQuery={search}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}
