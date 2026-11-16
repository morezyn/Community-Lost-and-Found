"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { useChartAnimation } from "@/hooks/useChartAnimation";
import { CountUp } from "@/components/ui/count-up";

export function ResolutionRate({ resolved, total }: { resolved: number; total: number }) {
  const chartAnimation = useChartAnimation();
  const percentage = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const data = [{ name: "Resolved", value: percentage, fill: "var(--chart-2)" }];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: "var(--muted)" }}
            cornerRadius={999}
            {...chartAnimation}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight">
          <CountUp value={percentage} />%
        </span>
        <span className="text-xs text-muted-foreground">
          {resolved} of {total} resolved
        </span>
      </div>
    </div>
  );
}
