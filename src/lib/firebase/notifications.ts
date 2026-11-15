"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import type { AppNotification, NotificationType } from "@/types";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  message: string;
  link: string;
}

/**
 * Writes an in-app notification for another user. Firestore rules restrict
 * creation to signed-in users, the whitelisted event types, `read: false`, and
 * forbid notifying yourself.
 */
export async function createNotification({
  userId,
  type,
  message,
  link,
}: CreateNotificationInput): Promise<void> {
  await addDoc(collection(getFirebaseDb(), "notifications"), {
    userId,
    type,
    message,
    link,
    read: false,
    createdAt: serverTimestamp(),
  });
}

function mapNotification(id: string, data: Record<string, unknown>): AppNotification {
  return { id, ...(data as Omit<AppNotification, "id">) };
}

export function subscribeToNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(30),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => mapNotification(item.id, item.data())),
      );
    },
    (error) => onError?.(error),
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "notifications", notificationId), {
    read: true,
  });
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), "notifications"),
      where("userId", "==", userId),
      where("read", "==", false),
    ),
  );
  if (snapshot.empty) return 0;

  const batch = writeBatch(getFirebaseDb());
  snapshot.docs.forEach((item) => batch.update(item.ref, { read: true }));
  await batch.commit();
  return snapshot.size;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), "notifications", notificationId));
}
