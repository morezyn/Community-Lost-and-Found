"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { REPORT_TYPE_META } from "@/lib/constants";
import type { Report, ReportType } from "@/types";

const TYPE_COLORS: Record<ReportType, string> = {
  lost: "var(--chart-4)",
  found: "var(--chart-2)",
  incident: "var(--chart-3)",
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--foreground)",
};

export function TypeBreakdown({ reports }: { reports: Report[] }) {
  const types: ReportType[] = ["lost", "found", "incident"];
  const data = types
    .map((type) => ({
      name: REPORT_TYPE_META[type].label,
      value: reports.filter((report) => report.type === type).length,
      type,
    }))
    .filter((entry) => entry.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        No reports yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={88}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell key={entry.type} fill={TYPE_COLORS[entry.type as ReportType]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend
          verticalAlign="bottom"
          height={28}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
