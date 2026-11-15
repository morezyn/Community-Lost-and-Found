"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type FieldValue,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import { PAGE_SIZE } from "@/lib/constants";
import { deleteReportImages, uploadReportImage } from "@/lib/cloudinary";
import { buildSearchTokens } from "@/lib/utils";
import { createNotification } from "@/lib/firebase/notifications";
import type {
  AppUser,
  Category,
  Report,
  ReportFilters,
  ReportPrivateDetails,
  ReportStatus,
  ReportType,
} from "@/types";

const REPORTS = "reports";
/** Statuses that are visible to everyone. */
export const PUBLIC_STATUSES: ReportStatus[] = ["approved", "resolved"];

function mapReport(id: string, data: DocumentData): Report {
  return { id, ...(data as Omit<Report, "id">) };
}

/* ------------------------------------------------------------------ */
/* Feed queries                                                        */
/* ------------------------------------------------------------------ */

interface FeedQuery {
  status: ReportStatus | "all";
  type: ReportType | null;
  categoryId: string | null;
  sort: "newest" | "oldest";
}

function feedConstraints(options: FeedQuery): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (options.status === "all") {
    constraints.push(where("status", "in", PUBLIC_STATUSES));
  } else {
    constraints.push(where("status", "==", options.status));
  }
  if (options.type) constraints.push(where("type", "==", options.type));
  if (options.categoryId) {
    constraints.push(where("categoryId", "==", options.categoryId));
  }
  constraints.push(orderBy("createdAt", options.sort === "oldest" ? "asc" : "desc"));
  return constraints;
}

export interface ReportPage {
  reports: Report[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

/**
 * Cursor-paginated public feed.
 *
 * NOTE: free-text search, location keyword, and the date range are applied
 * client-side to the fetched page (see hooks/useReports.ts). Firestore has no
 * native full-text search; `searchTokens` is written for a future
 * `array-contains` query. This keeps the composite index list small, which
 * matters for a demo project.
 */
export async function fetchReportPage(options: {
  filters: ReportFilters;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
}): Promise<ReportPage> {
  const pageSize = options.pageSize ?? PAGE_SIZE;
  const constraints = feedConstraints({
    status: options.filters.status,
    type: options.filters.types[0] ?? null,
    categoryId: options.filters.categoryId,
    sort: options.filters.sort,
  });

  if (options.cursor) constraints.push(startAfter(options.cursor));
  constraints.push(limit(pageSize + 1));

  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), REPORTS), ...constraints),
  );

  const docs = snapshot.docs.slice(0, pageSize);
  const hasMore = snapshot.docs.length > pageSize;

  return {
    reports: docs.map((item) => mapReport(item.id, item.data())),
    cursor: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
}

export async function fetchReportById(reportId: string): Promise<Report | null> {
  const snapshot = await getDoc(doc(getFirebaseDb(), REPORTS, reportId));
  if (!snapshot.exists()) return null;
  return mapReport(snapshot.id, snapshot.data());
}

/** Live report document, used for the real-time status badge on detail pages. */
export function subscribeToReport(
  reportId: string,
  onData: (report: Report | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(getFirebaseDb(), REPORTS, reportId),
    (snapshot) => {
      onData(snapshot.exists() ? mapReport(snapshot.id, snapshot.data()) : null);
    },
    (error) => onError?.(error),
  );
}

/** Reports authored by a user (live, newest first). */
export function subscribeToReportsByAuthor(
  authorId: string,
  onData: (reports: Report[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), REPORTS),
    where("authorId", "==", authorId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapReport(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/** Moderation queue (pending, oldest first so the queue drains in order). */
export function subscribeToReportsByStatus(
  status: ReportStatus,
  onData: (reports: Report[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), REPORTS),
    where("status", "==", status),
    orderBy("createdAt", "asc"),
    limit(100),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapReport(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/** Latest public reports for the landing page. */
export async function fetchLatestReports(count = 6): Promise<Report[]> {
  const q = query(
    collection(getFirebaseDb(), REPORTS),
    where("status", "in", PUBLIC_STATUSES),
    orderBy("createdAt", "desc"),
    limit(count),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapReport(item.id, item.data()));
}

/**
 * Analytics needs every status. Bounded to 1000 documents - plenty for the
 * demo dataset, and documented as a future Cloud Function aggregation job.
 */
export async function fetchAllReports(max = 1000): Promise<Report[]> {
  const q = query(
    collection(getFirebaseDb(), REPORTS),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => mapReport(item.id, item.data()));
}

/* ------------------------------------------------------------------ */
/* Private verification details                                        */
/* ------------------------------------------------------------------ */

export async function fetchPrivateDetails(
  reportId: string,
): Promise<ReportPrivateDetails | null> {
  try {
    const snapshot = await getDoc(
      doc(getFirebaseDb(), REPORTS, reportId, "private", "details"),
    );
    if (!snapshot.exists()) return null;
    return {
      verificationAnswer: (snapshot.data().verificationAnswer as string | null) ?? null,
    };
  } catch {
    // Permission denied for non-owners - expected, not an error for the UI.
    return null;
  }
}

async function writePrivateDetails(
  reportId: string,
  verificationAnswer: string | null,
): Promise<void> {
  const detailsRef = doc(getFirebaseDb(), REPORTS, reportId, "private", "details");
  if (verificationAnswer) {
    await setDoc(detailsRef, {
      verificationAnswer,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Removing the answer: keep the doc but clear the value.
    await setDoc(detailsRef, { verificationAnswer: null, updatedAt: serverTimestamp() });
  }
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export interface CreateReportInput {
  type: ReportType;
  title: string;
  description: string;
  /** Only moderators/admins (auto-published reports) supply a category. */
  category: Category | null;
  locationText: string;
  eventDate: Date;
  verificationQuestion: string | null;
  verificationAnswer: string | null;
  images: File[];
}

type ReportWritePayload = Omit<Report, "id" | "createdAt" | "updatedAt"> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

/**
 * Creates a report and uploads up to 4 photos.
 *
 * The document id is generated first so images can be stored under
 * `reports/{uid}/{reportId}/...` before the document is written.
 */
export async function createReport(
  input: CreateReportInput,
  author: Pick<AppUser, "uid" | "displayName" | "photoURL">,
  options: { bypassApproval: boolean },
): Promise<string> {
  const reportsRef = collection(getFirebaseDb(), REPORTS);
  const reportRef = doc(reportsRef);

  const uploaded = await Promise.all(
    input.images.map((file) => uploadReportImage(file, reportRef.id)),
  );

  const status: ReportStatus = options.bypassApproval ? "approved" : "pending";

  const payload: ReportWritePayload = {
    type: input.type,
    title: input.title,
    description: input.description,
    categoryId: input.category?.id ?? null,
    categoryName: input.category?.name ?? null,
    locationText: input.locationText,
    coordinates: null,
    eventDate: Timestamp.fromDate(input.eventDate),
    images: uploaded.map((image) => image.url),
    imagePaths: uploaded.map((image) => image.path),
    status,
    rejectionReason: null,
    verificationQuestion: input.type === "found" ? input.verificationQuestion : null,
    authorId: author.uid,
    authorName: author.displayName,
    authorPhotoURL: author.photoURL,
    commentCount: 0,
    searchTokens: buildSearchTokens(
      input.title,
      input.description,
      input.locationText,
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    resolvedAt: null,
  };

  await setDoc(reportRef, payload);

  if (input.type === "found") {
    await writePrivateDetails(reportRef.id, input.verificationAnswer);
  }

  return reportRef.id;
}

export interface UpdateReportInput {
  title: string;
  description: string;
  /** Moderator-only category change; omitted means "keep the current value". */
  category?: Category;
  locationText: string;
  eventDate: Date;
  verificationQuestion: string | null;
  verificationAnswer: string | null;
  /** New files to upload. */
  newImages: File[];
  /** Existing images the author removed. */
  removedImagePaths: string[];
}

export async function updateReport(
  existing: Report,
  input: UpdateReportInput,
): Promise<void> {
  const remainingImages = existing.images.filter(
    (_, index) => !input.removedImagePaths.includes(existing.imagePaths[index] ?? ""),
  );
  const remainingPaths = existing.imagePaths.filter(
    (path) => !input.removedImagePaths.includes(path),
  );

  if (remainingImages.length + input.newImages.length > 4) {
    throw new Error("A report can have at most 4 photos");
  }

  const uploaded = await Promise.all(
    input.newImages.map((file) => uploadReportImage(file, existing.id)),
  );

  await updateDoc(doc(getFirebaseDb(), REPORTS, existing.id), {
    title: input.title,
    description: input.description,
    ...(input.category
      ? { categoryId: input.category.id, categoryName: input.category.name }
      : {}),
    locationText: input.locationText,
    eventDate: Timestamp.fromDate(input.eventDate),
    images: [...remainingImages, ...uploaded.map((image) => image.url)],
    imagePaths: [...remainingPaths, ...uploaded.map((image) => image.path)],
    verificationQuestion:
      existing.type === "found" ? input.verificationQuestion : null,
    searchTokens: buildSearchTokens(
      input.title,
      input.description,
      input.locationText,
    ),
    updatedAt: serverTimestamp(),
  });

  if (existing.type === "found") {
    await writePrivateDetails(existing.id, input.verificationAnswer);
  }

  // Cloudinary cleanup only after the doc update succeeds.
  if (input.removedImagePaths.length > 0) {
    await deleteReportImages(input.removedImagePaths);
  }
}

/** Deletes the report plus its comments, private details, and claims. */
export async function deleteReport(report: Report): Promise<void> {
  const db = getFirebaseDb();

  const [commentsSnapshot, claimsSnapshot] = await Promise.all([
    getDocs(collection(db, REPORTS, report.id, "comments")),
    getDocs(query(collection(db, "claims"), where("reportId", "==", report.id))),
  ]);

  const batch = writeBatch(db);
  commentsSnapshot.docs.forEach((item) => batch.delete(item.ref));
  claimsSnapshot.docs.forEach((item) => batch.delete(item.ref));
  batch.delete(doc(db, REPORTS, report.id, "private", "details"));
  batch.delete(doc(db, REPORTS, report.id));
  await batch.commit();

  await deleteReportImages(report.imagePaths);
}

/** Author-driven resolve / reopen. */
export async function setReportResolved(
  reportId: string,
  resolved: boolean,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), REPORTS, reportId), {
    status: resolved ? "resolved" : "approved",
    resolvedAt: resolved ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Approves a report and assigns the category. The category is required so an
 * approved (public) report is never uncategorized - see the matching rule in
 * firestore.rules.
 */
export async function approveReport(report: Report, category: Category): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), REPORTS, report.id), {
    status: "approved",
    categoryId: category.id,
    categoryName: category.name,
    rejectionReason: null,
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    userId: report.authorId,
    type: "report_approved",
    message: `Your report "${report.title}" was approved and is now public.`,
    link: `/reports/${report.id}`,
  });
}

/** Lets a moderator re-file an already published report under another category. */
export async function setReportCategory(report: Report, category: Category): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), REPORTS, report.id), {
    categoryId: category.id,
    categoryName: category.name,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectReport(report: Report, reason: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), REPORTS, report.id), {
    status: "rejected",
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });

  await createNotification({
    userId: report.authorId,
    type: "report_rejected",
    message: `Your report "${report.title}" was rejected: ${reason}`,
    link: `/reports/${report.id}`,
  });
}
