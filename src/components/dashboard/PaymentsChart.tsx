"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PaymentsByMethodPoint } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  direct_debit: "#1F2622",
  credit_card: "#F27B4B",
  wire_transfer: "#8C9B8E",
  upi: "#DDE5DB",
};

const METHOD_LABELS: Record<string, string> = {
  direct_debit: "Direct Debit",
  credit_card: "Credit Card",
  wire_transfer: "Wire Transfer",
  upi: "UPI",
};

interface PaymentsChartProps {
  data: PaymentsByMethodPoint[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#1F2622] text-white text-xs px-3 py-2 rounded-lg border border-[#D5DDD2] shadow-md">
      <div className="text-[10px] uppercase tracking-wider text-[#8C9B8E] mb-0.5">
        {METHOD_LABELS[item.name] ?? item.name}
      </div>
      <div className="font-bold tabular-nums">{item.value.toLocaleString()}</div>
      <div className="text-[10px] text-[#8C9B8E]">{item.payload.percentage?.toFixed(1)}%</div>
    </div>
  );
}

export function PaymentsChart({ data }: PaymentsChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const enriched = data.map((d) => ({ ...d, percentage: (d.count / total) * 100 }));

  return (
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-[#1F2622] mb-4">
        PAYMENTS BY METHOD
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="w-[130px] h-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enriched}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={58}
                dataKey="count"
                nameKey="method"
                strokeWidth={2}
                stroke="#FFFFFF"
              >
                {enriched.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={METHOD_COLORS[entry.method] ?? "#8C9B8E"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-2 shrink-0 pr-2">
          {enriched.map((entry) => (
            <div key={entry.method} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: METHOD_COLORS[entry.method] ?? "#8C9B8E" }}
              />
              <span className="text-xs font-medium text-[#1F2622]">
                {METHOD_LABELS[entry.method] ?? entry.method}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
