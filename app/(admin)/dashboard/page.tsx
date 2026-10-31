import * as React from "react";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui-shared";
import { TelemetryFilters, SortParams } from "@/types";
import { DashboardFilterBar, readFiltersFromUrl } from "@/components/dashboard/DashboardFilterBar";
import { KpiSection } from "@/components/dashboard/KpiSection";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { OverdueSection } from "@/components/dashboard/OverdueSection";
import {
  KpiSkeleton,
  ChartsSkeleton,
  OverdueSkeleton,
} from "@/components/dashboard/DashboardSkeletons";

interface DashboardPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function sp(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  // Read URL params on server – Next.js 14 server component
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).map(([k, v]) => [k, sp(v) ?? ""])
    )
  );

  const filters: TelemetryFilters = {
    from: sp(searchParams.dp) === "This month" ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0] : undefined,
    to: new Date().toISOString().split("T")[0],
    customerId: sp(searchParams.customer) !== "all" ? sp(searchParams.customer) : undefined,
    planId: sp(searchParams.plan) !== "all" ? sp(searchParams.plan) : undefined,
    status: sp(searchParams.status) !== "all" ? sp(searchParams.status) : undefined,
    paymentMethod: sp(searchParams.method) !== "all" ? sp(searchParams.method) : undefined,
  };

  const page = Math.max(1, parseInt(sp(searchParams.inv_page) ?? "1", 10));
  const sort: SortParams = {
    column: sp(searchParams.inv_sort) ?? "dueDate",
    direction: (sp(searchParams.inv_dir) as "asc" | "desc") ?? "asc",
  };

  const viewMode = sp(searchParams.view) ?? "summary";
  const isDetailed = viewMode === "detailed";

  // LOG date: today
  const logDate = new Date()
    .toLocaleDateString("en-GB")
    .split("/")
    .join(".");

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="REVENUE OVERVIEW"
        subtitle="Global Subscription Index"
        logDate={logDate}
        progressSegments={{ charcoal: 58, grey: 28, orange: 14 }}
      />

      {/* Filter Bar — client component, reads/writes URL params */}
      <Suspense fallback={<div className="h-12 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] animate-pulse" />}>
        <DashboardFilterBar />
      </Suspense>

      {/* KPI Stat Cards — streamed independently */}
      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection filters={filters} />
      </Suspense>

      {/* Charts — streamed independently */}
      <Suspense fallback={<ChartsSkeleton />}>
        <ChartsSection filters={filters} />
      </Suspense>

      {/* Overdue table — shown in both summary and detailed mode per spec */}
      <Suspense fallback={<OverdueSkeleton />}>
        <OverdueSection filters={filters} page={page} sort={sort} />
      </Suspense>
    </div>
  );
}
