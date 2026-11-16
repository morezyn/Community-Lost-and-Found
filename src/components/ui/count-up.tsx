"use client";

import * as React from "react";

/**
 * Counts a number up from its previous value when it changes.
 *
 * Used by dashboard stats (ANIMATIONS.md Phase 7). Skips the animation when the
 * user prefers reduced motion so values appear instantly.
 */
export function CountUp({
  value,
  duration = 800,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = React.useState(0);
  const displayedRef = React.useRef(0);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = displayedRef.current;

    if (reduced || from === value) {
      displayedRef.current = value;
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const next = Math.round(from + (value - from) * eased);
      displayedRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
