"use client";

import * as React from "react";
import { Subscription } from "@/types";
import { formatMoney } from "@/lib/formatters";

interface OrderLinesTableProps {
  subscription: Subscription;
}

export function OrderLinesTable({ subscription }: OrderLinesTableProps) {
  const totalAmount = subscription.totalAmount ?? 0;
  // If lines are not present, create sensible mock lines based on plan total
  const lines: any[] =
    subscription.lines && subscription.lines.length > 0
      ? subscription.lines
      : [
          {
            id: "line-default-1",
            productId: "prod-default",
            subscriptionId: subscription.id,
            description: `${subscription.plan?.name || "Enterprise Tier"} Base License`,
            quantity: 1,
            unitPrice: Math.round(totalAmount * 0.85),
            amount: Math.round(totalAmount * 0.85),
          },
          {
            id: "line-default-2",
            productId: "prod-default",
            subscriptionId: subscription.id,
            description: "High-Throughput Telemetry SLA & Priority Queue",
            quantity: 1,
            unitPrice: Math.round(totalAmount * 0.15),
            amount: Math.round(totalAmount * 0.15),
          },
        ];

  const subtotal = lines.reduce((sum, l) => sum + (l.amount ?? 0), 0);
  const taxRate = 0.18; // 18% GST standard
  const taxes = Math.round(subtotal * taxRate);
  const grandTotal = subtotal + taxes;

  return (
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-5 shadow-none space-y-4">
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C9B8E] pb-2 border-b border-[#D5DDD2]">
        ORDER LINES // ITEMIZED SPECIFICATION
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#DDE5DB] border-b border-[#D5DDD2]">
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#1F2622]">
                Product
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#1F2622]">
                Variant
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#1F2622] text-center">
                Qty
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#1F2622] text-right">
                Unit Price
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#1F2622] text-right">
                Taxes (18%)
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#1F2622] text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5DDD2]/60">
            {lines.map((line: any, idx: number) => {
              const lineTax = Math.round((line.amount ?? 0) * taxRate);
              return (
                <tr
                  key={line.id || idx}
                  className="bg-white hover:bg-[#E4ECE1]/40 transition-colors"
                >
                  <td className="px-3.5 py-3 text-xs font-semibold text-[#1F2622]">
                    {line.description || "Subscription Line"}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#8C9B8E]">
                    {subscription.plan?.code || "STD"}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#1F2622] text-center">
                    {line.quantity}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#1F2622] text-right tabular-nums">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#8C9B8E] text-right tabular-nums">
                    {formatMoney(lineTax)}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono font-bold text-[#1F2622] text-right tabular-nums">
                    {formatMoney(line.amount ?? 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Box */}
      <div className="flex justify-end pt-3">
        <div className="w-full sm:w-72 bg-[#E4ECE1]/40 p-4 rounded-lg border border-[#D5DDD2] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#8C9B8E] uppercase">Subtotal</span>
            <span className="font-mono font-semibold text-[#1F2622] tabular-nums">
              {formatMoney(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#8C9B8E] uppercase">GST (18%)</span>
            <span className="font-mono text-[#8C9B8E] tabular-nums">
              {formatMoney(taxes)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-[#D5DDD2]">
            <span className="font-mono font-bold text-[#1F2622] uppercase">Total</span>
            <span className="font-mono font-extrabold text-[#1F2622] text-base tabular-nums">
              {formatMoney(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
