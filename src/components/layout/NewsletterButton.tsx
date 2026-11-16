"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

/**
 * Demo newsletter success state (ANIMATIONS.md 7.19).
 * No email is collected or sent; the button simply morphs to a confirmation
 * for three seconds so the interaction has visible feedback.
 */
export function NewsletterButton() {
  const motionEnabled = useMotionEnabled();
  const [joined, setJoined] = React.useState(false);
  const timeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleJoin() {
    setJoined(true);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setJoined(false), 3000);
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleJoin}
      className="min-w-24 sm:shrink-0"
      aria-live="polite"
    >
      {joined ? (
        <>
          <Check className={motionEnabled ? "lg:animate-badge-pop" : undefined} />
          Joined
        </>
      ) : (
        "Join us"
      )}
    </Button>
  );
}
