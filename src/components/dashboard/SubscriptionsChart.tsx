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
  draft: "#B9CBB9",
  quotation: "#8A968A",
  confirmed: "#2B302B",
  active: "#2B302B",
  closed: "#8A968A",
  cancelled: "#F57B4A",
};

interface SubscriptionsChartProps {
  data: SubscriptionsByStatusPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#2B302B] text-white text-xs px-3 py-2 rounded-[3px] border border-[#8A968A]/30 font-mono">
      <div className="text-[10px] uppercase tracking-wider text-[#8A968A] mb-0.5 capitalize">{label}</div>
      <div className="font-bold tabular-nums">{payload[0].value.toLocaleString()}</div>
    </div>
  );
}

export function SubscriptionsChart({ data }: SubscriptionsChartProps) {
  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-4 sm:p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#2B302B] font-mono mb-4">
        Subscriptions by Status
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="2 4"
            horizontal={false}
            stroke="#B9CBB9"
            strokeOpacity={0.5}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8A968A", fontSize: 10, fontFamily: "monospace" }}
          />
          <YAxis
            type="category"
            dataKey="status"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8A968A", fontSize: 10, fontFamily: "monospace", fontWeight: 600 }}
            tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            width={68}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#D3E3D3", opacity: 0.4 }} />
          <Bar dataKey="count" radius={[0, 2, 2, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.status] ?? "#8A968A"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

