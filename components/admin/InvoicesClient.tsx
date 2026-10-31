"use client";

import * as React from "react";
import { Invoice } from "@/types";
import { PageHeader, StatusBadge } from "@/components/ui-shared";
import { formatMoney } from "@/lib/formatters";
import Link from "next/link";
import {
  FileText,
  Play,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { handleRunBillingEngine, handleSendOverdueReminder } from "@/app/actions/billing-actions";

interface InvoicesClientProps {
  initialInvoices: Invoice[];
  isAdmin: boolean;
}

export function InvoicesClient({ initialInvoices, isAdmin }: InvoicesClientProps) {
  const [invoices, setInvoices] = React.useState<Invoice[]>(initialInvoices);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [overdueOnly, setOverdueOnly] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>("");

  const [billingLoading, setBillingLoading] = React.useState<boolean>(false);
  const [billingSummary, setBillingSummary] = React.useState<string | null>(null);
  const [reminderMsg, setReminderMsg] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const statuses = ["all", "confirmed", "paid", "overdue", "draft", "cancelled"];

  const filtered = React.useMemo(() => {
    return invoices.filter((i) => {
      if (overdueOnly && i.status !== "overdue" && !(i.balance > 0 && i.daysOverdue > 0)) {
        return false;
      }
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.invoiceNo.toLowerCase().includes(q) ||
          i.customer?.name.toLowerCase().includes(q) ||
          i.customer?.company.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusFilter, overdueOnly, search]);

  const handleRunBilling = async () => {
    setBillingLoading(true);
    setBillingSummary(null);
    setActionError(null);

    const res = await handleRunBillingEngine();
    setBillingLoading(false);

    if (res.success && res.billingRun) {
      setBillingSummary(
        `Billing run complete! Created ${res.billingRun.invoicesCreated} invoices, skipped ${res.billingRun.invoicesSkipped} existing/idempotent periods, ${res.billingRun.failedCount} failures.`
      );
    } else {
      setActionError(res.error || "Billing run failed");
    }
  };

  const handleSendReminder = async (inv: Invoice) => {
    setReminderMsg(null);
    setActionError(null);

    const res = await handleSendOverdueReminder(inv.id);
    if (res.success) {
      setReminderMsg(
        `Overdue reminder for ${inv.invoiceNo} dispatched to ${res.emailTo} (viewable in Dev Mailbox)!`
      );
    } else {
      setActionError(res.error || "Failed to send reminder");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="INVOICE LEDGER"
          subtitle="Accounts Receivable, Automated Recurring Billing & Collections"
          logDate="31.10.2026"
        />
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleRunBilling}
              disabled={billingLoading}
              className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs uppercase font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-[#F57B4A]" />
              {billingLoading ? "Running Billing..." : "Run Billing Engine"}
            </button>
          )}
        </div>
      </div>

      {billingSummary && (
        <div className="bg-[#FFF4EE] border border-[#F57B4A] text-[#2B302B] p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#F57B4A] flex-shrink-0" />
          <span>{billingSummary}</span>
        </div>
      )}

      {reminderMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 text-xs flex items-center gap-2">
          <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{reminderMsg}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-[#CBD5CB] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                if (st !== "overdue") setOverdueOnly(false);
              }}
              className={`px-3 py-1 text-xs uppercase transition-colors border ${
                statusFilter === st && !overdueOnly
                  ? "bg-[#2B302B] text-white border-[#2B302B]"
                  : "bg-[#F8FAF8] text-[#2B302B] border-[#CBD5CB] hover:bg-[#E4EEE4]"
              }`}
            >
              {st}
            </button>
          ))}
          <label className="flex items-center gap-2 cursor-pointer ml-3 select-none text-xs">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked);
                if (e.target.checked) setStatusFilter("all");
              }}
              className="accent-[#F57B4A]"
            />
            <span className="text-[#F57B4A] font-bold uppercase">Overdue Only</span>
          </label>
        </div>

        <input
          type="text"
          placeholder="Search by invoice # or customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#CBD5CB] px-3 py-1.5 w-64 text-xs text-[#2B302B] focus:outline-none focus:border-[#F57B4A]"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Issue Date</th>
              <th className="p-3">Due Date</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Balance Due</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {filtered.slice(0, 50).map((inv) => {
              const isOverdue = inv.status === "overdue" || (inv.balance > 0 && inv.daysOverdue > 0);
              return (
                <tr key={inv.id} className="hover:bg-[#F8FAF8] transition-colors">
                  <td className="p-3 font-bold text-[#2B302B]">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="hover:text-[#F57B4A] underline flex items-center gap-1"
                    >
                      {inv.invoiceNo}
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[#2B302B]">{inv.customer?.name}</div>
                    <div className="text-[10px] text-[#8A968A]">{inv.customer?.company}</div>
                  </td>
                  <td className="p-3 text-[#2B302B]">{inv.issueDate}</td>
                  <td className="p-3">
                    <span className={isOverdue ? "text-[#F57B4A] font-semibold" : "text-[#2B302B]"}>
                      {inv.dueDate}
                    </span>
                    {isOverdue && (
                      <span className="ml-1 text-[10px] text-[#F57B4A]">
                        ({inv.daysOverdue}d)
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-semibold text-[#2B302B]">
                    {formatMoney(inv.totalAmount)}
                  </td>
                  <td className="p-3 text-right font-bold text-[#2B302B]">
                    {formatMoney(inv.balance)}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isOverdue && (
                        <button
                          onClick={() => handleSendReminder(inv)}
                          className="px-2 py-1 text-[10px] bg-[#FFF4EE] border border-[#F57B4A] text-[#F57B4A] hover:bg-[#FFE8DC] uppercase font-bold"
                        >
                          Send Reminder
                        </button>
                      )}
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="px-2.5 py-1 text-[11px] border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#8A968A]">
                  No invoices found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
