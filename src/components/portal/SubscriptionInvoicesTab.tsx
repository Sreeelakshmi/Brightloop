"use client";

import * as React from "react";
import { Invoice } from "@/types";
import { StatusBadge } from "@/components/ui-shared";
import { formatDate, formatMoney } from "@/lib/formatters";

interface SubscriptionInvoicesTabProps {
  invoices: Invoice[];
}

export function SubscriptionInvoicesTab({ invoices }: SubscriptionInvoicesTabProps) {
  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#B9CBB9]">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
          ASSOCIATED INVOICES // BILLING HISTORY
        </div>
        <span className="text-xs font-mono text-[#8A968A]">
          {invoices.length} invoices found
        </span>
      </div>

      {invoices.length === 0 ? (
        <div className="py-8 text-center text-xs font-mono text-[#8A968A]">
          No invoices have been billed for this subscription yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#D3E3D3] border-b border-[#B9CBB9]">
                <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B]">
                  Invoice No.
                </th>
                <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B]">
                  Issue Date
                </th>
                <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B]">
                  Due Date
                </th>
                <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-right">
                  Total
                </th>
                <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-right">
                  Balance
                </th>
                <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9CBB9]/60">
              {invoices.map((inv) => {
                const balance = inv.balance ?? 0;
                return (
                  <tr
                    key={inv.id}
                    className="bg-white hover:bg-[#E4EEE4]/40 transition-colors"
                  >
                    <td className="px-3.5 py-3 text-xs font-mono font-bold text-[#2B302B]">
                      {inv.invoiceNo || inv.invoiceNumber || inv.id}
                    </td>
                    <td className="px-3.5 py-3 text-xs font-mono text-[#8A968A]">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="px-3.5 py-3 text-xs font-mono text-[#8A968A]">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-3.5 py-3 text-xs font-mono font-bold text-[#2B302B] text-right tabular-nums">
                      {formatMoney(inv.totalAmount ?? 0)}
                    </td>
                    <td
                      className={`px-3.5 py-3 text-xs font-mono text-right tabular-nums ${
                        balance > 0 ? "font-bold text-[#F57B4A]" : "text-[#8A968A]"
                      }`}
                    >
                      {formatMoney(balance)}
                    </td>
                    <td className="px-3.5 py-3 text-center">
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
