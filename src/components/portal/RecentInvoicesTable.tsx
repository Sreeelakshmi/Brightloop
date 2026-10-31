"use client";

import * as React from "react";
import Link from "next/link";
import { Invoice } from "@/types";
import { StatusBadge } from "@/components/ui-shared";
import { formatDate, formatMoney } from "@/lib/formatters";
import { FileText, ArrowRight } from "lucide-react";

interface RecentInvoicesTableProps {
  invoices: Invoice[];
}

export function RecentInvoicesTable({ invoices }: RecentInvoicesTableProps) {
  const recent = invoices.slice(0, 5);

  return (
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D5DDD2]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#1F2622]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">
            RECENT INVOICES
          </h3>
        </div>
        <Link
          href="/portal/invoices"
          className="text-xs font-semibold text-[#8C9B8E] hover:text-[#1F2622] flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#8C9B8E]">
          No invoices recorded for your account.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#D5DDD2]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#DDE5DB] border-b border-[#D5DDD2]">
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#1F2622]">
                  Invoice No.
                </th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#1F2622]">
                  Due Date
                </th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#1F2622] text-right">
                  Amount
                </th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#1F2622] text-right">
                  Balance
                </th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#1F2622] text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DDD2]">
              {recent.map((inv) => {
                const balance = inv.balance ?? 0;
                return (
                  <tr
                    key={inv.id}
                    className="bg-white hover:bg-[#EBF1EA]/60 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#1F2622]">
                      {inv.invoiceNo || inv.invoiceNumber || inv.id}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#8C9B8E]">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#1F2622] text-right tabular-nums">
                      {formatMoney(inv.totalAmount ?? 0)}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-mono text-xs text-right tabular-nums ${
                        balance > 0 ? "font-bold text-[#F27B4B]" : "text-[#8C9B8E]"
                      }`}
                    >
                      {formatMoney(balance)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
