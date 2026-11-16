import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-[14px] border border-border bg-card px-4 py-2 text-sm text-ink shadow-none transition-[color,box-shadow,border-color] duration-fast ease-out-soft outline-none",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-ink-faint",
        "focus-visible:border-accent-brand focus-visible:ring-2 focus-visible:ring-accent-brand/30",
        "aria-invalid:border-danger aria-invalid:ring-danger/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
