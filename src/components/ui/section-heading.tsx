import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  overline?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  overline,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={cn("space-y-3", centered && "text-center", className)}>
      {overline ? (
        <p className="text-[13px] font-medium uppercase tracking-wide text-ink-soft">
          {overline}
        </p>
      ) : null}
      <h2 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "text-base leading-relaxed text-ink-soft md:text-lg",
            centered && "mx-auto max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}