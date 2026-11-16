import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full rounded-[14px] border border-border bg-card px-4 py-3 text-sm text-ink shadow-none transition-[color,box-shadow,border-color] outline-none",
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

export { Textarea };
