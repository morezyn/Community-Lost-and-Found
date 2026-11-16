import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FieldErrorProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Inline form error that fades and drifts down when it appears
 * (ANIMATIONS.md 7.11). Renders nothing when there is no message.
 */
export function FieldError({ children, className }: FieldErrorProps) {
  if (!children) return null;
  return (
    <p role="alert" className={cn("animate-slide-down text-xs text-destructive", className)}>
      {children}
    </p>
  );
}
