"use client";

import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import { createNotification } from "@/lib/firebase/notifications";
import type { Comment, Report } from "@/types";

function commentsCollection(reportId: string) {
  return collection(getFirebaseDb(), "reports", reportId, "comments");
}

function mapComment(id: string, data: Record<string, unknown>): Comment {
  return { id, ...(data as Omit<Comment, "id">) };
}

/**
 * Real-time comment thread. Moderators pass includeHidden=true to also see
 * hidden comments (rules allow this for mods/admins).
 */
export function subscribeToComments(
  reportId: string,
  onData: (comments: Comment[]) => void,
  options: { includeHidden?: boolean } = {},
  onError?: (error: Error) => void,
): Unsubscribe {
  const base = commentsCollection(reportId);
  const q = options.includeHidden
    ? query(base, orderBy("createdAt", "asc"), limit(200))
    : query(
        base,
        where("hidden", "==", false),
        orderBy("createdAt", "asc"),
        limit(200),
      );

  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapComment(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/** Hidden comments across every report, for the moderation panel. */
export function subscribeToHiddenComments(
  onData: (comments: Array<Comment & { reportTitleHint?: string }>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collectionGroup(getFirebaseDb(), "comments"),
    where("hidden", "==", true),
    orderBy("createdAt", "desc"),
    limit(50),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((item) => ({
          ...mapComment(item.id, item.data()),
          // The report id is the parent path segment.
          reportId: item.ref.parent.parent?.id ?? item.data().reportId,
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export interface AddCommentInput {
  report: Pick<Report, "id" | "title" | "authorId">;
  author: { uid: string; displayName: string; photoURL: string | null };
  text: string;
}

/**
 * Adds a comment, bumps the denormalized commentCount, and notifies the report
 * author (unless they are commenting on their own report).
 */
export async function addComment({
  report,
  author,
  text,
}: AddCommentInput): Promise<void> {
  await addDoc(commentsCollection(report.id), {
    reportId: report.id,
    authorId: author.uid,
    authorName: author.displayName,
    authorPhotoURL: author.photoURL,
    text,
    hidden: false,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(getFirebaseDb(), "reports", report.id), {
    commentCount: increment(1),
  });

  if (report.authorId !== author.uid) {
    await createNotification({
      userId: report.authorId,
      type: "new_comment",
      message: `${author.displayName} commented on "${report.title}".`,
      link: `/reports/${report.id}#comments`,
    });
  }
}

export async function deleteComment(
  reportId: string,
  commentId: string,
): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), "reports", reportId, "comments", commentId));
  await updateDoc(doc(getFirebaseDb(), "reports", reportId), {
    commentCount: increment(-1),
  });
}

/** Hide (moderate) or restore a comment. */
export async function setCommentHidden(
  reportId: string,
  commentId: string,
  hidden: boolean,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "reports", reportId, "comments", commentId), {
    hidden,
  });
}
