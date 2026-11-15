"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";

import { isFirebaseConfigured } from "@/lib/firebase/client";

/**
 * Shown instead of confusing SDK errors while the Firebase env vars are still
 * empty. Visible only in development builds of an unconfigured project.
 */
export function SetupNotice() {
  if (isFirebaseConfigured) return null;

  return (
    <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-2 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs">
        <AlertTriangle className="size-3.5" />
        <span className="font-medium">Firebase is not configured yet.</span>
        <span>
          Copy <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">.env.local.example</code> to{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">.env.local</code> and add your project keys.
        </span>
        <Link
          href="https://console.firebase.google.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
        >
          Firebase console <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
