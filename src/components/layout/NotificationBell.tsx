"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { toast } from "sonner";

import { cn, timeAgo } from "@/lib/utils";
import { describeFirebaseError } from "@/lib/firebase/errors";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/firebase/notifications";
import { useAuth } from "@/hooks/useAuth";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const { profile } = useAuth();
  const motionEnabled = useMotionEnabled();
  const { notifications, unreadCount, loading } = useNotifications();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [bellPulse, setBellPulse] = React.useState(0);
  const [announcement, setAnnouncement] = React.useState("");
  const previousUnreadRef = React.useRef<number | null>(null);

  // One-shot wiggle + badge pop when new notifications arrive (never on first load).
  React.useEffect(() => {
    const previous = previousUnreadRef.current;
    previousUnreadRef.current = unreadCount;
    if (previous === null || unreadCount <= previous) return;

    // Screen readers should hear about new notifications on every device.
    setAnnouncement(
      `${unreadCount - previous} new notification${unreadCount - previous === 1 ? "" : "s"}`,
    );
    if (!motionEnabled) return;

    setBellPulse((count) => count + 1);
    const timeout = setTimeout(() => setBellPulse(0), 700);
    return () => clearTimeout(timeout);
  }, [unreadCount, motionEnabled]);

  async function openNotification(id: string, link: string, read: boolean) {
    try {
      if (!read) await markNotificationRead(id);
    } catch {
      // Non-critical: navigation should not be blocked by a failed update.
    }
    router.push(link);
  }

  async function handleMarkAll() {
    if (!profile) return;
    setBusy(true);
    try {
      const updated = await markAllNotificationsRead(profile.uid);
      toast.success(updated ? "All notifications marked as read" : "Nothing to mark");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not update notifications"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground lg:transition-colors lg:duration-base lg:ease-out-soft hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          >
            <Bell className={cn("size-4", bellPulse > 0 && "lg:animate-bell-ring")} />
            {unreadCount > 0 && (
              <span
                key={`${unreadCount}-${bellPulse}`}
                className={cn(
                  "absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground",
                  bellPulse > 0 && "lg:animate-badge-pop",
                )}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={handleMarkAll}
              disabled={busy || unreadCount === 0}
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          </div>
          <DropdownMenuSeparator className="my-0" />
          <div className="max-h-80 overflow-y-auto p-1">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                <Inbox className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notification, index) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="lg:animate-slide-down items-start gap-2 py-2"
                  style={{ animationDelay: `${Math.min(index, 7) * 40}ms` }}
                  onSelect={() =>
                    void openNotification(
                      notification.id,
                      notification.link,
                      notification.read,
                    )
                  }
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      notification.read ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm leading-snug">{notification.message}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(notification.createdAt)}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <DropdownMenuSeparator className="my-0" />
          <DropdownMenuItem asChild className="justify-center rounded-none py-2 text-xs">
            <Link href="/profile#notifications">View all notifications</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
