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
    <div className="bg-[#1F2622] text-white text-xs px-3 py-2 rounded-lg shadow-md border border-[#D5DDD2]">
      <div className="text-[10px] uppercase tracking-wider text-[#8C9B8E] mb-0.5">{label}</div>
      <div className="font-bold tabular-nums">{formatMoney(payload[0].value)}</div>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-[#1F2622] mb-4">
        REVENUE OVER TIME
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="24%" margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            vertical={false}
            stroke="#D5DDD2"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8C9B8E", fontSize: 10, fontWeight: 600 }}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8C9B8E", fontSize: 10 }}
            tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#EBF1EA", opacity: 0.6 }} />
          <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => {
              const isLast = index === data.length - 1;
              const fill = entry.highlighted || isLast
                ? "#F27B4B"
                : index % 2 === 0
                ? "#1F2622"
                : "#8C9B8E";
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
