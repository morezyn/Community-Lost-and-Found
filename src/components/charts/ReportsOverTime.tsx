"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";

import { toDate } from "@/lib/utils";
import { useChartAnimation } from "@/hooks/useChartAnimation";
import type { Report } from "@/types";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--foreground)",
};

export function ReportsOverTime({ reports, days = 30 }: { reports: Report[]; days?: number }) {
  const chartAnimation = useChartAnimation();
  const today = startOfDay(new Date());
  const buckets = eachDayOfInterval({ start: subDays(today, days - 1), end: today }).map(
    (day) => ({
      date: format(day, "MMM d"),
      key: format(day, "yyyy-MM-dd"),
      reports: 0,
    }),
  );
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  reports.forEach((report) => {
    const created = toDate(report.createdAt);
    if (!created) return;
    const bucket = byKey.get(format(created, "yyyy-MM-dd"));
    if (bucket) bucket.reports += 1;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={buckets} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          interval={Math.ceil(days / 6)}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey="reports"
          name="Reports"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          {...chartAnimation}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
