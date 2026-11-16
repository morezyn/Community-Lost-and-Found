"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "findit:announcement:dismissed:v1";
const EXIT_MS = 250;

export function AnnouncementBanner() {
  const [visible, setVisible] = React.useState(false);
  const [closing, setClosing] = React.useState(false);

  React.useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      setVisible(dismissed !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setClosing(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    // Collapse the height first, then unmount (ANIMATIONS.md 7.1).
    window.setTimeout(() => setVisible(false), EXIT_MS);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows,opacity] duration-base ease-out-soft",
        closing ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
      )}
    >
      <div className="overflow-hidden">
        <div className="animate-slide-down w-full bg-accent-brand text-white">
          <div className="mx-auto flex max-w-wide items-center justify-center gap-3 px-4 py-2 text-center text-[13px]">
            <p className="leading-snug">
              New: help your community reunite faster.{" "}
              <Link
                href="/reports"
                className={cn(
                  "underline underline-offset-2 decoration-white/70 hover:decoration-white font-medium",
                )}
              >
                Browse recent reports
              </Link>
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss announcement"
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors duration-fast ease-out-soft hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
