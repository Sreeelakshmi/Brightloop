"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlanTable } from "@/components/subscriptions/PlanTable";
import { PageHeader } from "@/components/subscriptions/PageHeader";
import type { PlanWithId } from "@/types/catalog";
import type { UserRole } from "@/types";

interface PlansListClientProps {
  initialPlans: PlanWithId[];
  total: number;
  currentPage: number;
  pageSize: number;
  role: UserRole;
  initialSearch?: string;
}

export function PlansListClient({
  initialPlans,
  total,
  currentPage,
  pageSize,
  role,
  initialSearch = "",
}: PlansListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSearch.trim()) {
        params.set("search", newSearch.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/plans?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/plans?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="PRICING PLANS"
        subtitle="Configure recurring billing intervals and lifecycle policy rules."
        logDate="31.10.2026"
      />

      <PlanTable
        plans={initialPlans}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        role={role}
        searchQuery={search}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        loading={isPending}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}
