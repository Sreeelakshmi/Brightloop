"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PaymentsByMethodPoint } from "@/types";

const METHOD_COLORS: Record<string, string> = {
  direct_debit: "#2B302B",
  credit_card: "#F57B4A",
  wire_transfer: "#8A968A",
  upi: "#B9CBB9",
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
    <div className="bg-[#2B302B] text-white text-xs px-3 py-2 rounded-[3px] border border-[#8A968A]/30 font-mono">
      <div className="text-[10px] uppercase tracking-wider text-[#8A968A] mb-0.5">
        {METHOD_LABELS[item.name] ?? item.name}
      </div>
      <div className="font-bold tabular-nums">{item.value.toLocaleString()}</div>
      <div className="text-[10px] text-[#8A968A]">{item.payload.percentage?.toFixed(1)}%</div>
    </div>
  );
}

export function PaymentsChart({ data }: PaymentsChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const enriched = data.map((d) => ({ ...d, percentage: (d.count / total) * 100 }));

  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-4 sm:p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#2B302B] font-mono mb-4">
        Payments by Method
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={enriched}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={64}
              dataKey="count"
              nameKey="method"
              strokeWidth={1.5}
              stroke="#FFFFFF"
            >
              {enriched.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={METHOD_COLORS[entry.method] ?? "#8A968A"}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-col gap-2">
          {enriched.map((entry) => (
            <div key={entry.method} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-[1px] shrink-0"
                style={{ backgroundColor: METHOD_COLORS[entry.method] ?? "#8A968A" }}
              />
              <span className="text-[10px] font-mono font-semibold text-[#8A968A] uppercase tracking-wide">
                {METHOD_LABELS[entry.method] ?? entry.method}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

