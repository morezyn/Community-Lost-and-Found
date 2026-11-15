"use client";

import * as React from "react";
import { toast } from "sonner";

import { subscribeToNotifications } from "@/lib/firebase/notifications";
import { useAuth } from "@/hooks/useAuth";
import type { AppNotification } from "@/types";

interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
}

/**
 * Real-time notification feed for the signed-in user. The onSnapshot listener
 * is torn down on sign-out / unmount.
 */
export function useNotifications(): UseNotificationsResult {
  const { profile, isSignedIn } = useAuth();
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isSignedIn || !profile) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(
      profile.uid,
      (next) => {
        setNotifications(next);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isSignedIn, profile]);

  // Pick up new notifications with a toast so the demo is visible even when
  // the bell is collapsed. Compared against previously seen ids only.
  const seenRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    const isFirstLoad = seenRef.current.size === 0;
    if (!isFirstLoad && !seenRef.current.has(latest.id) && !latest.read) {
      toast(latest.message, { description: "New notification" });
    }
    notifications.forEach((item) => seenRef.current.add(item.id));
  }, [notifications]);

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    loading,
  };
}
