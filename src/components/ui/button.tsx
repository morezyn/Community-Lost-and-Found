"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-accent-brand text-white hover:bg-accent-hover",
        primary:
          "bg-accent-brand text-white hover:bg-accent-hover",
        dark:
          "bg-ink text-bg hover:bg-ink/90",
        soft:
          "bg-surface text-ink hover:bg-surface-2",
        destructive:
          "bg-danger text-white hover:bg-danger/90",
        outline:
          "border border-border bg-transparent text-ink hover:bg-surface",
        secondary:
          "bg-surface text-ink hover:bg-surface-2",
        ghost: "text-ink hover:bg-surface",
        link: "rounded-none px-0 text-ink-soft underline-offset-4 hover:text-ink hover:underline",
      },
      size: {
        default: "h-auto px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-auto gap-1.5 px-4 py-2 text-xs has-[>svg]:px-3",
        lg: "h-auto px-7 py-3.5 text-base has-[>svg]:px-6",
        icon: "size-10 rounded-full p-0",
        "icon-sm": "size-9 rounded-full p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
