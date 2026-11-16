"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types";

interface RouteGuardProps {
  children: React.ReactNode;
  /** Minimum roles allowed to view the page. Omit for "any signed-in user". */
  allow?: Role[];
  /** Where to send unauthenticated visitors. */
  redirectTo?: string;
}

const ROLE_RANK: Record<Role, number> = { user: 1, moderator: 2, admin: 3 };

/**
 * Client-side route guard. This is UX only - Firestore rules are the real
 * enforcement layer.
 */
export function RouteGuard({ children, allow, redirectTo }: RouteGuardProps) {
  const { loading, isSignedIn, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const target = redirectTo ?? `/login?redirect=${encodeURIComponent(pathname)}`;
  const role = profile?.role ?? "user";
  const allowed =
    !allow || allow.some((candidate) => ROLE_RANK[role] >= ROLE_RANK[candidate]);

  React.useEffect(() => {
    if (loading) return;
    if (!isSignedIn) {
      router.replace(target);
      return;
    }
    if (!allowed) {
      router.replace("/reports");
    }
  }, [loading, isSignedIn, allowed, router, target]);

  if (loading || !isSignedIn || !allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 motion-essential animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleGate({
  allow,
  children,
  fallback,
}: {
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { loading, profile } = useAuth();
  if (loading) return null;
  const role = profile?.role ?? "user";
  const allowed = allow.some((candidate) => ROLE_RANK[role] >= ROLE_RANK[candidate]);
  if (allowed) return <>{children}</>;
  return (
    fallback ?? (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">You do not have access</h2>
        <p className="text-sm text-muted-foreground">
          This area is limited to moderators and administrators.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    )
  );
}
