import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full items-start gap-x-3 gap-y-1 rounded-[14px] border px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-card text-ink border-border",
        info: "border-info/30 bg-[#DCE8F1] text-ink [&>svg]:text-info",
        warning:
          "border-warning/30 bg-[#F5E6C4] text-[#7A5510] [&>svg]:text-[#9A6B12]",
        destructive:
          "border-danger/30 bg-[#F6DDD6] text-[#7A3327] [&>svg]:text-danger",
        success:
          "border-success/30 bg-[#DCEBDD] text-[#2F5A37] [&>svg]:text-success",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("col-start-2 text-sm opacity-90", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
