"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DataTable, TableColumn, StatusBadge } from "@/components/ui-shared";
import { Invoice } from "@/types";
import { formatMoney, formatDate } from "@/lib/formatters";
import { SortDirection } from "@/components/ui-shared/DataTable";

interface OverdueTableProps {
  data: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

/** Counts days between dueDate and now */
function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function OverdueTable({ data, total, page, pageSize }: OverdueTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  // Show toast for 2.5s
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const pushParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (p: number) => pushParam("inv_page", String(p));

  const handleSort = (col: string, dir: SortDirection) => {
    const params = new URLSearchParams(searchParams.toString());
    if (dir === null) {
      params.delete("inv_sort");
      params.delete("inv_dir");
    } else {
      params.set("inv_sort", col);
      params.set("inv_dir", dir);
    }
    params.set("inv_page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const sortCol = searchParams.get("inv_sort") ?? "dueDate";
  const sortDir = (searchParams.get("inv_dir") ?? "asc") as SortDirection;

  const columns: TableColumn<Invoice>[] = [
    {
      key: "invoiceNo",
      header: "Invoice No.",
      sortable: true,
      width: "120px",
      render: (row) => (
        <span className="font-mono font-semibold text-[#2B302B] text-xs">{row.invoiceNo}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-[#2B302B] font-medium">
          {row.customer?.company ?? "—"}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-[#8A968A]">{formatDate(row.dueDate)}</span>
      ),
    },
    {
      key: "daysOverdue",
      header: "Days Overdue",
      sortable: false,
      align: "center",
      render: (row) => {
        const days = daysOverdue(row.dueDate);
        return (
          <span className="font-mono font-bold text-[#F57B4A] text-xs tabular-nums">
            {days}d
          </span>
        );
      },
    },
    {
      key: "balance",
      header: "Balance",
      sortable: true,
      align: "right",
      render: (row) => (
        <span className="font-mono tabular-nums text-xs text-[#2B302B] font-semibold">
          {formatMoney(row.balance)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      align: "center",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      align: "center",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            showToast(`Reminder sent for ${row.invoiceNo}`);
          }}
          className="h-7 px-3 text-[11px] font-semibold border-[1.5px] border-[#B9CBB9] rounded-[3px] bg-white text-[#2B302B] hover:bg-[#D3E3D3]/60 hover:border-[#2B302B] transition-colors focus-visible:outline-[#F57B4A] focus-visible:outline-2 font-mono"
        >
          Send reminder
        </button>
      ),
    },
  ];

  return (
    <div className="relative">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2B302B] text-white text-xs px-4 py-2.5 rounded-[3px] font-mono shadow-lg border border-[#8A968A]/40 animate-fade-in">
          ✓ {toastMsg}
        </div>
      )}

      <DataTable<Invoice>
        columns={columns}
        data={data}
        keyField="id"
        sortColumn={sortCol}
        sortDirection={sortDir}
        onSort={handleSort}
        pagination={{ page, pageSize, total }}
        onPageChange={handlePageChange}
        emptyTitle="No Overdue Invoices"
        emptyDescription="All invoices are up to date."
      />
    </div>
  );
}
