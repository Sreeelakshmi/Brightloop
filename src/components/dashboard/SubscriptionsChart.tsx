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
import { SubscriptionsByStatusPoint } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  draft: "#8C9B8E",
  quotation: "#8C9B8E",
  confirmed: "#8C9B8E",
  active: "#1F2622",
  closed: "#8C9B8E",
  cancelled: "#F27B4B",
};

interface SubscriptionsChartProps {
  data: SubscriptionsByStatusPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2622] text-white text-xs px-3 py-2 rounded-lg border border-[#D5DDD2] shadow-md">
      <div className="text-[10px] uppercase tracking-wider text-[#8C9B8E] mb-0.5 capitalize">{label}</div>
      <div className="font-bold tabular-nums">{payload[0].value.toLocaleString()}</div>
    </div>
  );
}

export function SubscriptionsChart({ data }: SubscriptionsChartProps) {
  return (
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-4 sm:p-5 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-wider text-[#1F2622] mb-4">
        SUBSCRIPTIONS BY STATUS
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="2 4"
            horizontal={false}
            stroke="#D5DDD2"
            strokeOpacity={0.6}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8C9B8E", fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="status"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#1F2622", fontSize: 10, fontWeight: 600 }}
            tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            width={68}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#EBF1EA", opacity: 0.6 }} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.status] ?? "#8C9B8E"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
