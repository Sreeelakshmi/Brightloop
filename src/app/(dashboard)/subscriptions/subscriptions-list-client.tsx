"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionTable } from "@/components/subscriptions/SubscriptionTable";
import { THEME } from "@/components/subscriptions/theme";
import type { SubscriptionWithDetails } from "@/types/subscription-services";
import type { SubscriptionStatus, UserRole } from "@/types";

interface SubscriptionsListClientProps {
  initialSubscriptions: SubscriptionWithDetails[];
  total: number;
  currentPage: number;
  pageSize: number;
  role: UserRole;
  initialStatus?: SubscriptionStatus | "";
  initialSearch?: string;
}

export function SubscriptionsListClient({
  initialSubscriptions,
  total,
  currentPage,
  pageSize,
  role,
  initialStatus = "",
  initialSearch = "",
}: SubscriptionsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<SubscriptionStatus | "">(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newSearch: string, newStatus: SubscriptionStatus | "") => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newSearch.trim()) params.set("search", newSearch.trim());
      else params.delete("search");
      if (newStatus) params.set("status", newStatus);
      else params.delete("status");
      params.set("page", "1");
      router.push(`/subscriptions?${params.toString()}`);
    });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    handleFilterChange(val, status);
  };

  const handleStatusChange = (val: SubscriptionStatus | "") => {
    setStatus(val);
    handleFilterChange(search, val);
  };

  const handlePageChange = (newPage: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/subscriptions?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl ${THEME.primaryDark.heading}`}>Subscriptions Overview</h1>
        <p className="text-xs text-[#657367]">
          Monitor active recurring agreements, execute state machine transitions, and manage contract lifecycles.
        </p>
      </div>

      <SubscriptionTable
        subscriptions={initialSubscriptions}
        total={total}
        currentPage={currentPage}
        pageSize={pageSize}
        role={role}
        selectedStatus={status}
        onStatusChange={handleStatusChange}
        searchQuery={search}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        loading={isPending}
      />
    </div>
  );
}
