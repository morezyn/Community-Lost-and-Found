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
import { createNotification } from "@/lib/firebase/notifications";
import type { Category, CategoryRequest, CategoryRequestStatus, ReportType } from "@/types";

const CATEGORY_REQUESTS = "categoryRequests";
const CATEGORIES = "categories";
const USERS = "users";

function mapCategoryRequest(id: string, data: Record<string, unknown>): CategoryRequest {
  return { id, ...(data as Omit<CategoryRequest, "id">) };
}

export interface RequestCategoryInput {
  name: string;
  appliesTo: ReportType[];
  note: string;
  requester: { uid: string; displayName: string };
}

/**
 * Files a category proposal and alerts the admins who can approve it.
 *
 * Moderators cannot write `categories` (rules are admin-only), so this is the
 * only path for them to extend the taxonomy. No Cloud Function exists in this
 * demo, so the requester writes one notification per admin.
 */
export async function requestCategory({
  name,
  appliesTo,
  note,
  requester,
}: RequestCategoryInput): Promise<string> {
  const db = getFirebaseDb();
  const trimmedName = name.trim();

  const created = await addDoc(collection(db, CATEGORY_REQUESTS), {
    name: trimmedName,
    appliesTo,
    note: note.trim() || null,
    status: "pending" satisfies CategoryRequestStatus,
    requestedBy: requester.uid,
    requesterName: requester.displayName,
    reviewedBy: null,
    reviewNote: null,
    categoryId: null,
    createdAt: serverTimestamp(),
    reviewedAt: null,
  });

  const admins = await getDocs(query(collection(db, USERS), where("role", "==", "admin")));
  const recipients = admins.docs.filter((admin) => admin.id !== requester.uid);

  await Promise.all(
    recipients.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "category_request",
        message: `${requester.displayName} requested a new category: "${trimmedName}".`,
        link: "/admin/categories",
      }),
    ),
  );

  return created.id;
}

/** The signed-in moderator's own proposals (newest first). */
export function subscribeToMyCategoryRequests(
  uid: string,
  onData: (requests: CategoryRequest[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), CATEGORY_REQUESTS),
    where("requestedBy", "==", uid),
    orderBy("createdAt", "desc"),
    limit(25),
  );

  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapCategoryRequest(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/** Admin approval queue (oldest first so requests are handled in order). */
export function subscribeToPendingCategoryRequests(
  onData: (requests: CategoryRequest[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), CATEGORY_REQUESTS),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc"),
    limit(50),
  );

  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapCategoryRequest(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/**
 * Case-insensitive lookup used before approving, so two requests for the same
 * name cannot create duplicate categories. Categories are few, so fetching the
 * whole list is cheaper than maintaining a normalised name field.
 */
export async function findCategoryByName(name: string): Promise<Category | null> {
  const snapshot = await getDocs(query(collection(getFirebaseDb(), CATEGORIES), orderBy("name", "asc")));
  const target = name.trim().toLowerCase();
  return (
    snapshot.docs
      .map((item) => ({ id: item.id, ...(item.data() as Omit<Category, "id">) }))
      .find((category) => category.name.toLowerCase() === target) ?? null
  );
}

export interface ApproveCategoryRequestInput {
  request: CategoryRequest;
  reviewer: { uid: string };
}

/**
 * Creates the category and marks the request approved in one atomic batch, then
 * notifies the requester. A half-approved request can therefore never exist.
 */
export async function approveCategoryRequest({
  request,
  reviewer,
}: ApproveCategoryRequestInput): Promise<string> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  const categoryRef = doc(collection(db, CATEGORIES));

  batch.set(categoryRef, {
    name: request.name,
    appliesTo: request.appliesTo,
    active: true,
    createdAt: serverTimestamp(),
  });

  batch.update(doc(db, CATEGORY_REQUESTS, request.id), {
    status: "approved",
    categoryId: categoryRef.id,
    reviewedBy: reviewer.uid,
    reviewedAt: serverTimestamp(),
  });

  await batch.commit();

  await createNotification({
    userId: request.requestedBy,
    type: "category_request_approved",
    message: `Your category request "${request.name}" was approved and is now available.`,
    link: "/moderation",
  });

  return categoryRef.id;
}

export interface RejectCategoryRequestInput {
  request: CategoryRequest;
  reviewer: { uid: string };
  reviewNote: string;
}

export async function rejectCategoryRequest({
  request,
  reviewer,
  reviewNote,
}: RejectCategoryRequestInput): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), CATEGORY_REQUESTS, request.id), {
    status: "rejected",
    reviewedBy: reviewer.uid,
    reviewNote,
    reviewedAt: serverTimestamp(),
  });

  await createNotification({
    userId: request.requestedBy,
    type: "category_request_rejected",
    message: `Your category request "${request.name}" was rejected. Note: ${reviewNote}`,
    link: "/moderation",
  });
}

/** Withdraws a proposal that has not been reviewed yet (author-only, pending). */
export async function withdrawCategoryRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), CATEGORY_REQUESTS, requestId));
}
