import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset lg:transition-colors [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-accent-soft text-accent-brand ring-accent-brand/20",
        secondary: "bg-surface text-ink ring-border",
        outline: "bg-transparent text-ink ring-border",
        destructive: "bg-[#F6DDD6] text-danger ring-danger/20",
        success: "bg-[#DCEBDD] text-success ring-success/20",
        warning: "bg-[#F5E6C4] text-[#9A6B12] ring-warning/30",
        info: "bg-[#DCE8F1] text-info ring-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
