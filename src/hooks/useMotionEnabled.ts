"use client";

import { useSyncExternalStore } from "react";

/**
 * Single source of truth for JS-driven motion (ANIMATIONS.md 1A / 6.3).
 *
 * Motion is allowed only on desktop-size screens (1024px and up) when the user
 * has not asked for reduced motion. This mirrors the global CSS safety net in
 * `globals.css`, so CSS and JS motion switch on and off together.
 */
export const MOTION_QUERY =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOTION_QUERY).matches;
}

// Server output always uses the "no motion" state so markup stays stable, and
// React reuses it during hydration to avoid mismatches.
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns whether animations should run right now.
 *
 * `useSyncExternalStore` reads the media query during render on the client, so
 * components that mount after hydration (for example charts that wait for
 * data) already start in the correct state. During hydration React uses the
 * server snapshot, which keeps SSR markup and the first client pass identical.
 */
export function useMotionEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
