"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Report } from "@/types";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--foreground)",
};

export function ByCategory({ reports }: { reports: Report[] }) {
  const counts = new Map<string, number>();
  reports.forEach((report) => {
    // Pending reports have no category yet; bucket them so the chart stays valid.
    const name = report.categoryName ?? "Uncategorized";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  const data = Array.from(counts.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
        barCategoryGap={6}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="total" name="Reports" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
