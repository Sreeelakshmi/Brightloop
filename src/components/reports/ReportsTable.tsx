"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DataTable, TableColumn, StatusBadge } from "@/components/ui-shared";
import { ReportRow, ReportTab } from "@/types";
import { formatMoney, formatDate } from "@/lib/formatters";
import { SortDirection } from "@/components/ui-shared/DataTable";

interface ReportsTableProps {
  tab: ReportTab;
  data: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
}

export function ReportsTable({
  tab,
  data,
  total,
  page,
  pageSize,
}: ReportsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortCol = searchParams.get("sort") ?? "date";
  const currentSortDir = (searchParams.get("dir") ?? "desc") as SortDirection;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSort = (col: string, dir: SortDirection) => {
    const params = new URLSearchParams(searchParams.toString());
    if (dir === null) {
      params.delete("sort");
      params.delete("dir");
    } else {
      params.set("sort", col);
      params.set("dir", dir);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build dynamic columns tailored to the active tab
  const getColumns = (): TableColumn<ReportRow>[] => {
    if (tab === "subscriptions") {
      return [
        {
          key: "code",
          header: "Subscription No.",
          sortable: true,
          width: "140px",
          render: (row) => (
            <span className="font-mono font-bold text-[#1F2622] text-xs">
              {row.code}
            </span>
          ),
        },
        {
          key: "name",
          header: "Customer",
          sortable: true,
          render: (row) => (
            <span className="font-medium text-[#1F2622] text-xs">{row.name}</span>
          ),
        },
        {
          key: "secondary",
          header: "Plan",
          sortable: true,
          render: (row) => (
            <span className="font-mono text-xs text-[#8C9B8E]">{row.secondary}</span>
          ),
        },
        {
          key: "date",
          header: "Start Date",
          sortable: true,
          render: (row) => (
            <span className="font-mono text-xs text-[#8C9B8E]">
              {formatDate(row.date)}
            </span>
          ),
        },
        {
          key: "metric1",
          header: "Total Amount",
          sortable: true,
          align: "right",
          render: (row) => (
            <span className="font-mono font-bold text-xs text-[#1F2622] tabular-nums">
              {formatMoney(row.metric1)}
            </span>
          ),
        },
        {
          key: "metric2",
          header: "Plan Rate",
          sortable: true,
          align: "right",
          render: (row) => (
            <span className="font-mono text-xs text-[#8C9B8E] tabular-nums">
              {formatMoney(row.metric2)}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          sortable: true,
          align: "center",
          width: "120px",
          render: (row) => <StatusBadge status={row.badgeStatus} />,
        },
      ];
    }

    if (tab === "payments") {
      return [
        {
          key: "code",
          header: "Payment No.",
          sortable: true,
          width: "140px",
          render: (row) => (
            <span className="font-mono font-bold text-[#1F2622] text-xs">
              {row.code}
            </span>
          ),
        },
        {
          key: "name",
          header: "Customer",
          sortable: true,
          render: (row) => (
            <span className="font-medium text-[#1F2622] text-xs">{row.name}</span>
          ),
        },
        {
          key: "secondary",
          header: "Method",
          sortable: true,
          render: (row) => (
            <span className="font-mono text-xs text-[#1F2622] font-semibold">
              {row.secondary}
            </span>
          ),
        },
        {
          key: "date",
          header: "Payment Date",
          sortable: true,
          render: (row) => (
            <span className="font-mono text-xs text-[#8C9B8E]">
              {formatDate(row.date)}
            </span>
          ),
        },
        {
          key: "metric1",
          header: "Amount",
          sortable: true,
          align: "right",
          render: (row) => (
            <span className="font-mono font-bold text-xs text-[#1F2622] tabular-nums">
              {formatMoney(row.metric1)}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          sortable: true,
          align: "center",
          width: "120px",
          render: (row) => <StatusBadge status={row.badgeStatus} />,
        },
      ];
    }

    // Default for 'revenue' and 'invoices'
    return [
      {
        key: "code",
        header: "Invoice No.",
        sortable: true,
        width: "140px",
        render: (row) => (
          <span className="font-mono font-bold text-[#1F2622] text-xs">
            {row.code}
          </span>
        ),
      },
      {
        key: "name",
        header: "Customer",
        sortable: true,
        render: (row) => (
          <span className="font-medium text-[#1F2622] text-xs">{row.name}</span>
        ),
      },
      {
        key: "date",
        header: "Issue Date",
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs text-[#8C9B8E]">
            {formatDate(row.date)}
          </span>
        ),
      },
      {
        key: "secondary",
        header: "Due Date",
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs text-[#8C9B8E]">{row.secondary}</span>
        ),
      },
      {
        key: "metric1",
        header: tab === "revenue" ? "Total Billed" : "Total Amount",
        sortable: true,
        align: "right",
        render: (row) => (
          <span className="font-mono font-bold text-xs text-[#1F2622] tabular-nums">
            {formatMoney(row.metric1)}
          </span>
        ),
      },
      {
        key: "metric2",
        header: "Balance Due",
        sortable: true,
        align: "right",
        render: (row) => (
          <span
            className={`font-mono text-xs tabular-nums ${
              row.metric2 > 0 ? "text-[#F27B4B] font-bold" : "text-[#8C9B8E]"
            }`}
          >
            {formatMoney(row.metric2)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        align: "center",
        width: "120px",
        render: (row) => <StatusBadge status={row.badgeStatus} />,
      },
    ];
  };

  return (
    <DataTable<ReportRow>
      columns={getColumns()}
      data={data}
      keyField="id"
      zebra={true}
      sortColumn={currentSortCol}
      sortDirection={currentSortDir}
      onSort={handleSort}
      pagination={{ page, pageSize, total }}
      onPageChange={handlePageChange}
      emptyTitle="No Report Records Found"
      emptyDescription="No data matches the selected telemetry filters and date range."
    />
  );
}

