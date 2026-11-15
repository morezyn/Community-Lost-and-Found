"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  AlertTriangle,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Menu,
  PlusCircle,
  Search,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/layout/NotificationBell";

const PRIMARY_LINKS = [
  { href: "/reports", label: "Browse", icon: Search },
  { href: "/reports/new", label: "Report an item", icon: PlusCircle },
];

export function Navbar() {
  const { profile, firebaseUser, isSignedIn, isModerator, isAdmin, emailVerified, loading } =
    useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const displayName = profile?.displayName ?? firebaseUser?.displayName ?? "Member";
  const photoURL = profile?.photoURL ?? firebaseUser?.photoURL ?? null;

  async function handleSignOut() {
    try {
      await signOut(getFirebaseAuth());
      toast.success("Signed out");
      router.push("/");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not sign out"));
    }
  }

  const links = [
    ...PRIMARY_LINKS,
    ...(isModerator ? [{ href: "/moderation", label: "Moderation", icon: Shield }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: LayoutDashboard }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-sm">
            <Search className="size-4" strokeWidth={2.5} />
          </span>
          <span className="text-base">{APP_NAME}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                  active && "bg-accent text-foreground",
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {isSignedIn && <NotificationBell />}

          {loading ? null : isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 flex items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  aria-label="Account menu"
                >
                  <Avatar>
                    <AvatarImage src={photoURL ?? undefined} alt={displayName} />
                    <AvatarFallback>
                      {displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {displayName}
                  </span>
                  <span className="truncate text-xs font-normal">
                    {profile?.email ?? firebaseUser?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon /> Profile &amp; my reports
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/reports/new">
                    <PlusCircle /> New report
                  </Link>
                </DropdownMenuItem>
                {isModerator && (
                  <DropdownMenuItem asChild>
                    <Link href="/moderation">
                      <Shield /> Moderation queue
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard /> Admin dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
            {!isSignedIn && (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <UserIcon className="size-4" /> Sign in
              </Link>
            )}
          </nav>
        </div>
      )}

      {isSignedIn && !emailVerified && (
        <div className="border-t border-amber-300/60 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            Verify your email to post reports and comments.
          </span>{" "}
          <Link href="/profile" className="font-medium underline underline-offset-2">
            Resend verification email
          </Link>
        </div>
      )}
    </header>
  );
}

/** Small inline helper used by pages that need the verified-email hint. */
export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="size-3.5" /> Verified
    </span>
  );
}

export function UnverifiedHint() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <MailCheck className="size-3.5" /> Verify email to post
    </span>
  );
}
