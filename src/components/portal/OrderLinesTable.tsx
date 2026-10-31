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
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none space-y-4">
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A] pb-2 border-b border-[#B9CBB9]">
        ORDER LINES // ITEMIZED SPECIFICATION
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#D3E3D3] border-b border-[#B9CBB9]">
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B]">
                Product
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B]">
                Variant
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-center">
                Qty
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-right">
                Unit Price
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-right">
                Taxes (18%)
              </th>
              <th className="px-3.5 py-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#2B302B] text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B9CBB9]/60">
            {lines.map((line: any, idx: number) => {
              const lineTax = Math.round((line.amount ?? 0) * taxRate);
              return (
                <tr
                  key={line.id || idx}
                  className="bg-white hover:bg-[#E4EEE4]/40 transition-colors"
                >
                  <td className="px-3.5 py-3 text-xs font-semibold text-[#2B302B]">
                    {line.description || "Subscription Line"}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#8A968A]">
                    {subscription.plan?.code || "STD"}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#2B302B] text-center">
                    {line.quantity}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#2B302B] text-right tabular-nums">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono text-[#8A968A] text-right tabular-nums">
                    {formatMoney(lineTax)}
                  </td>
                  <td className="px-3.5 py-3 text-xs font-mono font-bold text-[#2B302B] text-right tabular-nums">
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
        <div className="w-full sm:w-72 bg-[#E4EEE4]/40 p-4 rounded-[2px] border border-[#B9CBB9] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#8A968A] uppercase">Subtotal</span>
            <span className="font-mono font-semibold text-[#2B302B] tabular-nums">
              {formatMoney(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#8A968A] uppercase">GST (18%)</span>
            <span className="font-mono text-[#8A968A] tabular-nums">
              {formatMoney(taxes)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-[#B9CBB9]">
            <span className="font-mono font-bold text-[#2B302B] uppercase">Total</span>
            <span className="font-mono font-extrabold text-[#2B302B] text-base tabular-nums">
              {formatMoney(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
