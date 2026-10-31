import { Suspense } from "react";
import { requireAuth } from "@/lib/auth";
import { getMyPayments } from "@/lib/data/portal";
import {
  PageHeader,
  TableSkeleton,
  EmptyState,
} from "@/components/ui-shared";
import { DataTable } from "@/components/ui-shared/DataTable";
import { PaymentMethodSummary } from "@/components/portal/PaymentMethodSummary";
import { PaymentMethodFilter } from "@/components/portal/PaymentMethodFilter";
import { formatMoney, formatDate } from "@/lib/formatters";
import type { Payment, PaymentMethod } from "@/types";

interface Props {
  searchParams: { method?: string };
}

const METHOD_LABEL: Record<string, string> = {
  direct_debit: "Direct Debit",
  credit_card: "Credit Card",
  wire_transfer: "Wire Transfer",
  upi: "UPI",
};

async function PaymentList({ searchParams }: Props) {
  const user = await requireAuth(["customer"]);
  const customerId = user.customerId!;

  const allPayments = await getMyPayments(customerId);
  const methodFilter = searchParams.method ?? "";

  const filtered = methodFilter
    ? allPayments.filter((p) => p.method === methodFilter)
    : allPayments;

  const columns = [
    {
      key: "paymentDate",
      header: "Date",
      sortable: false,
      render: (p: Payment) => (
        <span className="font-mono text-[#8A968A]">
          {formatDate(p.paymentDate)}
        </span>
      ),
    },
    {
      key: "invoiceNo",
      header: "Invoice",
      render: (p: Payment) => (
        <span className="font-mono font-bold text-[#2B302B]">
          {p.invoiceNo ?? "—"}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (p: Payment) => (
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A968A] font-mono">
          {METHOD_LABEL[p.method] ?? p.method}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (p: Payment) => (
        <span className="tabular-nums font-bold text-[#2B302B]">
          {formatMoney(p.amount)}
        </span>
      ),
    },
    {
      key: "reference",
      header: "Note / Reference",
      render: (p: Payment) => (
        <span className="text-[11px] font-mono text-[#8A968A] truncate max-w-[160px] block">
          {p.reference || "—"}
        </span>
      ),
    },
  ];

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No Payments Found"
        description={
          methodFilter
            ? `No payments recorded via ${METHOD_LABEL[methodFilter] ?? methodFilter}.`
            : "No payment records found for your account."
        }
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={filtered}
      keyField="id"
      emptyTitle="No Payments"
    />
  );
}

async function SummaryBar() {
  const user = await requireAuth(["customer"]);
  const payments = await getMyPayments(user.customerId!);
  return <PaymentMethodSummary payments={payments} />;
}

export default async function PortalPaymentsPage({ searchParams }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="MY PAYMENTS"
        subtitle="Settled Transactions & Payment Method Telemetry"
        logDate={new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}
        progressSegments={{ charcoal: 65, grey: 30, orange: 5 }}
      />

      {/* Method Breakdown Bar */}
      <Suspense fallback={null}>
        <SummaryBar />
      </Suspense>

      {/* Method Filter (client, URL-synced) */}
      <Suspense fallback={null}>
        <PaymentMethodFilter />
      </Suspense>

      {/* Payments Table */}
      <Suspense
        fallback={
          <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden">
            <TableSkeleton rows={8} cols={5} />
          </div>
        }
      >
        <PaymentList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
