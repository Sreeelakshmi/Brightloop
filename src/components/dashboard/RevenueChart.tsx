"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { RevenueOverTimePoint } from "@/types";
import { formatMoney } from "@/lib/formatters";

interface RevenueChartProps {
  data: RevenueOverTimePoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#2B302B] text-white text-xs px-3 py-2 rounded-[3px] shadow-none border border-[#8A968A]/30 font-mono">
      <div className="text-[10px] uppercase tracking-wider text-[#8A968A] mb-0.5">{label}</div>
      <div className="font-bold tabular-nums">{formatMoney(payload[0].value)}</div>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-4 sm:p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#2B302B] font-mono mb-4">
        Revenue Over Time
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="28%" margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            vertical={false}
            stroke="#B9CBB9"
            strokeOpacity={0.5}
          />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8A968A", fontSize: 10, fontFamily: "monospace", fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8A968A", fontSize: 10, fontFamily: "monospace" }}
            tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#D3E3D3", opacity: 0.4 }} />
          <Bar dataKey="revenue" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.highlighted ? "#F57B4A" : "#8A968A"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
