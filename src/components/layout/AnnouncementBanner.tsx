"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "findit:announcement:dismissed:v1";

export function AnnouncementBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      setVisible(dismissed !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div className="w-full bg-accent-brand text-white">
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
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}