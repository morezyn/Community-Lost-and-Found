"use client";

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import type { AppUser, Role } from "@/types";

export function subscribeToUsers(
  onData: (users: AppUser[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), "users"),
    orderBy("createdAt", "desc"),
    limit(300),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => ({
          uid: item.id,
          ...(item.data() as Omit<AppUser, "uid">),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

/** Admin-only: change a member's role. Rules block self-demotion and non-admins. */
export async function updateUserRole(uid: string, role: Role): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "users", uid), { role });
}

/** Admin-only: disable or re-enable an account. */
export async function updateUserDisabled(uid: string, disabled: boolean): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "users", uid), { disabled });
}
