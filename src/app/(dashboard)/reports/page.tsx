import * as React from "react";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui-shared";
import { ReportTab, SortParams, TelemetryFilters } from "@/types";
import { ReportsTabs } from "@/components/reports/ReportsTabs";
import { ReportsFilterBar } from "@/components/reports/ReportsFilterBar";
import {
  ReportsSummaryCards,
  ReportsSummarySkeleton,
} from "@/components/reports/ReportsSummaryCards";
import {
  ReportsDataSection,
  ReportsTableSkeleton,
} from "@/components/reports/ReportsDataSection";

interface ReportsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function sp(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

export default function ReportsPage({ searchParams }: ReportsPageProps) {
  const activeTab: ReportTab =
    (sp(searchParams.tab) as ReportTab) || "subscriptions";

  const filters: TelemetryFilters = {
    customerId:
      sp(searchParams.customer) !== "all" ? sp(searchParams.customer) : undefined,
    planId: sp(searchParams.plan) !== "all" ? sp(searchParams.plan) : undefined,
    status:
      sp(searchParams.status) !== "all" ? sp(searchParams.status) : undefined,
    paymentMethod:
      sp(searchParams.method) !== "all" ? sp(searchParams.method) : undefined,
    search: sp(searchParams.search),
  };

  const page = Math.max(1, parseInt(sp(searchParams.page) ?? "1", 10));
  const sort: SortParams = {
    column: sp(searchParams.sort) ?? "date",
    direction: (sp(searchParams.dir) as "asc" | "desc") ?? "desc",
  };

  const logDate = new Date()
    .toLocaleDateString("en-GB")
    .split("/")
    .join(".");

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="REPORTS"
        subtitle="Global Subscription & Revenue Intelligence"
        logDate={logDate}
        progressSegments={{ charcoal: 62, grey: 26, orange: 12 }}
      />

      {/* Uppercase Tabs: SUBSCRIPTIONS, REVENUE, PAYMENTS, INVOICES */}
      <ReportsTabs activeTab={activeTab} />

      {/* Filter Bar with Date Preset, Customer, Plan, Status, Method, CSV Export */}
      <Suspense
        fallback={
          <div className="h-12 bg-white border border-[#D5DDD2] rounded-xl animate-pulse" />
        }
      >
        <ReportsFilterBar tab={activeTab} />
      </Suspense>

      {/* Three Small Summary Stat Boxes for the filtered result */}
      <Suspense fallback={<ReportsSummarySkeleton />}>
        <ReportsSummaryCards tab={activeTab} filters={filters} />
      </Suspense>

      {/* DataTable with sortable columns, pagination, and light sage zebra rows */}
      <Suspense fallback={<ReportsTableSkeleton />}>
        <ReportsDataSection
          tab={activeTab}
          filters={filters}
          page={page}
          sort={sort}
        />
      </Suspense>
    </div>
  );
}
