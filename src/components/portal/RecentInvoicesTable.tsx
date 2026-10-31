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
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#B9CBB9]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2B302B]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#2B302B]">
            Recent Invoices
          </h3>
        </div>
        <Link
          href="/portal/invoices"
          className="text-[11px] font-mono font-semibold text-[#8A968A] hover:text-[#2B302B] flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-[#8A968A]">
          No invoices recorded for your account.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#D3E3D3] border-b border-[#B9CBB9]">
                <th className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B]">
                  Invoice No.
                </th>
                <th className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B]">
                  Due Date
                </th>
                <th className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-right">
                  Amount
                </th>
                <th className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-right">
                  Balance
                </th>
                <th className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9CBB9]/60">
              {recent.map((inv) => {
                const balance = inv.balance ?? 0;
                return (
                  <tr
                    key={inv.id}
                    className="bg-white hover:bg-[#E4EEE4]/50 transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#2B302B]">
                      {inv.invoiceNo || inv.invoiceNumber || inv.id}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[#8A968A]">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#2B302B] text-right tabular-nums">
                      {formatMoney(inv.totalAmount ?? 0)}
                    </td>
                    <td
                      className={`px-3 py-2.5 font-mono text-xs text-right tabular-nums ${
                        balance > 0 ? "font-bold text-[#F57B4A]" : "text-[#8A968A]"
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
