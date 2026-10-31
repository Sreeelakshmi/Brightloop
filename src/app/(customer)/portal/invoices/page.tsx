import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { getMyInvoices } from "@/lib/data/portal";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/ui-shared";
import { StatusBadge } from "@/components/ui-shared/StatusBadge";
import { InvoiceFilters } from "@/components/portal/InvoiceFilters";
import { formatMoney, formatDate } from "@/lib/formatters";
import { DataTable } from "@/components/ui-shared/DataTable";
import { Download } from "lucide-react";
import Link from "next/link";
import type { Invoice, InvoiceStatus } from "@/types";

interface Props {
  searchParams: {
    page?: string;
    status?: string;
    overdue?: string;
  };
}

const PAGE_SIZE = 10;

async function InvoiceList({ searchParams }: Props) {
  const user = await requireAuth(["customer"]);
  const customerId = user.customerId!;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const statusFilter = searchParams.status ?? "";
  const overdueOnly = searchParams.overdue === "1";

  // Fetch all invoices for this customer then apply client filters on mock data
  const result = await getMyInvoices(customerId, 1, 9999);
  let filtered = result.data;

  if (overdueOnly) {
    filtered = filtered.filter((inv) => inv.status === "overdue");
  } else if (statusFilter) {
    filtered = filtered.filter((inv) => inv.status === statusFilter);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: "invoiceNo",
      header: "Invoice No.",
      sortable: false,
      render: (inv: Invoice) => (
        <Link
          href={`/portal/invoices/${inv.id}`}
          className="font-mono font-bold text-[#2B302B] hover:text-[#F57B4A] transition-colors"
        >
          {inv.invoiceNo || inv.invoiceNumber || inv.id}
        </Link>
      ),
    },
    {
      key: "issueDate",
      header: "Issue Date",
      render: (inv: Invoice) => (
        <span className="font-mono text-[#8A968A]">
          {formatDate(inv.issueDate)}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (inv: Invoice) => (
        <span
          className={
            inv.status === "overdue"
              ? "font-mono font-bold text-[#F57B4A]"
              : "font-mono text-[#8A968A]"
          }
        >
          {formatDate(inv.dueDate)}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      align: "right" as const,
      render: (inv: Invoice) => (
        <span className="tabular-nums font-semibold">
          {formatMoney(inv.totalAmount ?? 0)}
        </span>
      ),
    },
    {
      key: "paid",
      header: "Paid",
      align: "right" as const,
      render: (inv: Invoice) => (
        <span className="tabular-nums text-[#8A968A]">
          {formatMoney((inv.totalAmount ?? 0) - (inv.balance ?? 0))}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right" as const,
      render: (inv: Invoice) => (
        <span
          className={cn(
            "tabular-nums font-bold",
            (inv.balance ?? 0) > 0 ? "text-[#F57B4A]" : "text-[#8A968A]"
          )}
        >
          {formatMoney(inv.balance ?? 0)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center" as const,
      render: (inv: Invoice) => (
        <StatusBadge status={inv.status as InvoiceStatus} />
      ),
    },
    {
      key: "pdf",
      header: "PDF",
      align: "center" as const,
      render: (inv: Invoice) => (
        <Link
          href={`/portal/invoices/${inv.id}`}
          title="View & Download Invoice"
          className="inline-flex items-center justify-center w-7 h-7 rounded-[2px] border border-[#B9CBB9] text-[#8A968A] hover:text-[#2B302B] hover:border-[#2B302B] transition-colors"
          aria-label={`Download PDF for ${inv.invoiceNo || inv.invoiceNumber || inv.id}`}
        >
          <Download className="w-3.5 h-3.5" />
        </Link>
      ),
    },
  ];

  if (pageData.length === 0) {
    return (
      <EmptyState
        title="No Invoices Found"
        description={
          overdueOnly
            ? "You have no overdue invoices. Great work!"
            : statusFilter
            ? `No invoices with status "${statusFilter}".`
            : "No billing statements have been issued yet."
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={pageData}
      keyField="id"
      pagination={{ page, pageSize: PAGE_SIZE, total }}
      emptyTitle="No Invoices Found"
    />
  );
}

// cn helper inline (avoid importing from wrong path)
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default async function PortalInvoicesPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="MY INVOICES"
        subtitle="Billing Statements, Overdue Notices & PDF Receipts"
        logDate={new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}
        progressSegments={{ charcoal: 60, grey: 25, orange: 15 }}
      />

      {/* Filters (client, URL-synced) */}
      <Suspense fallback={null}>
        <InvoiceFilters />
      </Suspense>

      {/* Invoice Table */}
      <Suspense
        fallback={
          <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden">
            <TableSkeleton rows={PAGE_SIZE} cols={8} />
          </div>
        }
      >
        <InvoiceList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
