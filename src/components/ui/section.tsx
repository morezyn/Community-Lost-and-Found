import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      default: "py-16 md:py-24 lg:py-32",
      tight: "py-12 md:py-16",
      none: "",
    },
    container: {
      content: "mx-auto max-w-content px-6 md:px-8 lg:px-12",
      wide: "mx-auto max-w-wide px-6 md:px-8 lg:px-12",
      full: "",
    },
    tone: {
      default: "",
      surface: "bg-surface",
    },
  },
  defaultVariants: {
    spacing: "default",
    container: "content",
    tone: "default",
  },
});

export interface SectionProps
  extends React.ComponentProps<"section">,
    VariantProps<typeof sectionVariants> {}

export function Section({
  className,
  spacing,
  container,
  tone,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(sectionVariants({ spacing, tone }), className)} {...props}>
      <div className={cn(sectionVariants({ container, spacing: "none", tone: "default" }))}>
        {children}
      </div>
    </section>
  );
}