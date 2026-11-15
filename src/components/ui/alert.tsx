import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full items-start gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info: "border-primary/25 bg-primary/5 text-foreground [&>svg]:text-primary",
        warning:
          "border-amber-300/60 bg-amber-50 text-amber-900 [&>svg]:text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        destructive:
          "border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive",
        success:
          "border-emerald-300/60 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
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
