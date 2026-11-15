"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import type { Category } from "@/types";

const CATEGORIES = "categories";

function mapCategory(id: string, data: Record<string, unknown>): Category {
  return {
    id,
    name: (data.name as string) ?? "Untitled",
    appliesTo: (data.appliesTo as Category["appliesTo"]) ?? [],
    active: (data.active as boolean) ?? true,
  };
}

export async function listCategories(activeOnly = false): Promise<Category[]> {
  const q = activeOnly
    ? query(collection(getFirebaseDb(), CATEGORIES), where("active", "==", true))
    : query(collection(getFirebaseDb(), CATEGORIES), orderBy("name", "asc"));

  const snapshot = await getDocs(q);
  const categories = snapshot.docs.map((item) => mapCategory(item.id, item.data()));
  return categories.sort((a, b) => a.name.localeCompare(b.name));
}

/** Real-time category list used by the admin page and the report form. */
export function subscribeToCategories(
  onData: (categories: Category[]) => void,
  activeOnly = false,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = activeOnly
    ? query(collection(getFirebaseDb(), CATEGORIES), where("active", "==", true))
    : query(collection(getFirebaseDb(), CATEGORIES), orderBy("name", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const categories = snapshot.docs.map((item) => mapCategory(item.id, item.data()));
      onData(categories.sort((a, b) => a.name.localeCompare(b.name)));
    },
    (error) => onError?.(error),
  );
}

export async function createCategory(input: Omit<Category, "id">): Promise<string> {
  const created = await addDoc(collection(getFirebaseDb(), CATEGORIES), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateCategory(
  categoryId: string,
  input: Partial<Omit<Category, "id">>,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), CATEGORIES, categoryId), input);
}

/**
 * Seeds the default category set. Admin-only (enforced by rules); idempotent
 * because it skips names that already exist.
 */
export async function seedDefaultCategories(): Promise<number> {
  const existing = await listCategories();
  const existingNames = new Set(existing.map((category) => category.name.toLowerCase()));
  const missing = DEFAULT_CATEGORIES.filter(
    (category) => !existingNames.has(category.name.toLowerCase()),
  );

  await Promise.all(
    missing.map((category) =>
      addDoc(collection(getFirebaseDb(), CATEGORIES), {
        ...category,
        createdAt: serverTimestamp(),
      }),
    ),
  );

  return missing.length;
}
