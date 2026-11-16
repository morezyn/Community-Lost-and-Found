"use client";

import * as React from "react";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

/**
 * Recharts animation props for a one-shot first-mount reveal.
 *
 * Recharts animates on every data change by default, which gets noisy on a
 * live dashboard. We animate the initial draw, then switch animation off.
 * Animation is desktop-only and never runs for reduced-motion users.
 */
export function useChartAnimation(duration = 900) {
  const motionEnabled = useMotionEnabled();
  const [firstDrawDone, setFirstDrawDone] = React.useState(false);

  React.useEffect(() => {
    if (!motionEnabled) return;
    const timeout = setTimeout(() => setFirstDrawDone(true), duration + 150);
    return () => clearTimeout(timeout);
  }, [motionEnabled, duration]);

  return {
    isAnimationActive: motionEnabled && !firstDrawDone,
    animationDuration: duration,
    animationEasing: "ease-out" as const,
  };
}
