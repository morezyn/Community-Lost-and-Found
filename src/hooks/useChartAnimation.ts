"use client";

import * as React from "react";

/**
 * Recharts animation props for a one-shot first-mount reveal.
 *
 * Recharts animates on every data change by default, which gets noisy on a
 * live dashboard. We animate the initial draw, then switch animation off.
 * Users who prefer reduced motion never see the animation.
 */
export function useChartAnimation(duration = 900) {
  const [enabled, setEnabled] = React.useState(true);

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setEnabled(false);
      return;
    }
    const timeout = setTimeout(() => setEnabled(false), duration + 150);
    return () => clearTimeout(timeout);
  }, [duration]);

  return {
    isAnimationActive: enabled,
    animationDuration: duration,
    animationEasing: "ease-out" as const,
  };
}
