"use client";

import {
  addDoc,
  collection,
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
import type { Claim, ClaimStatus, Report } from "@/types";

const CLAIMS = "claims";

function mapClaim(id: string, data: Record<string, unknown>): Claim {
  return { id, ...(data as Omit<Claim, "id">) };
}

export interface CreateClaimInput {
  report: Pick<Report, "id" | "title" | "authorId" | "type">;
  claimant: { uid: string; displayName: string };
  answer: string;
  proofDescription: string;
  proofImageUrl: string | null;
}

/**
 * Submits a response to a report and notifies its author.
 *
 * One collection covers both directions of the hand-off:
 * - `found` post -> "this is mine" (owner claiming what someone picked up)
 * - `lost` post  -> "I found this" (finder telling the owner where it is)
 */
export async function createClaim({
  report,
  claimant,
  answer,
  proofDescription,
  proofImageUrl,
}: CreateClaimInput): Promise<string> {
  const created = await addDoc(collection(getFirebaseDb(), CLAIMS), {
    reportId: report.id,
    reportTitle: report.title,
    reportType: report.type,
    reportAuthorId: report.authorId,
    claimantId: claimant.uid,
    claimantName: claimant.displayName,
    answer,
    proofDescription,
    proofImageUrl,
    status: "pending" satisfies ClaimStatus,
    reviewedBy: null,
    reviewNote: null,
    createdAt: serverTimestamp(),
    reviewedAt: null,
  });

  await createNotification({
    userId: report.authorId,
    type: "claim_received",
    message:
      report.type === "lost"
        ? `${claimant.displayName} reported finding your lost item "${report.title}".`
        : `${claimant.displayName} claimed your found item "${report.title}".`,
    link: `/reports/${report.id}`,
  });

  return created.id;
}

/** Claims for one report (visible to the report author and moderators). */
export function subscribeToClaimsForReport(
  reportId: string,
  onData: (claims: Claim[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), CLAIMS),
    where("reportId", "==", reportId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapClaim(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/** Claims submitted by the signed-in user. */
export function subscribeToMyClaims(
  claimantId: string,
  onData: (claims: Claim[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), CLAIMS),
    where("claimantId", "==", claimantId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapClaim(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/** Pending claims queue for moderators. */
export function subscribeToPendingClaims(
  onData: (claims: Claim[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), CLAIMS),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc"),
    limit(100),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapClaim(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/** Pending claims on reports owned by `reportAuthorId` (profile review view). */
export function subscribeToClaimsForAuthor(
  reportAuthorId: string,
  onData: (claims: Claim[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), CLAIMS),
    where("reportAuthorId", "==", reportAuthorId),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map((item) => mapClaim(item.id, item.data()))),
    (error) => onError?.(error),
  );
}

/**
 * Guards against duplicate active claims: a user may only have one *pending*
 * claim per report. Queried client-side because the uniqueness rule is also
 * enforced in Firestore rules on create.
 */
export async function hasActiveClaim(
  reportId: string,
  claimantId: string,
): Promise<boolean> {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), CLAIMS),
      where("reportId", "==", reportId),
      where("claimantId", "==", claimantId),
      limit(5),
    ),
  );
  return snapshot.docs.some((item) => item.data().status === "pending");
}

export interface ReviewClaimInput {
  claim: Claim;
  decision: Exclude<ClaimStatus, "pending">;
  reviewer: { uid: string; displayName: string };
  reviewNote: string;
}

/**
 * Approves or rejects a claim. Approving also resolves the report.
 *
 * Other pending claims for the same report are rejected as a best-effort
 * follow-up (not in the critical batch) so one inconsistent sibling claim cannot
 * block the owner's approval.
 */
export async function reviewClaim({
  claim,
  decision,
  reviewer,
  reviewNote,
}: ReviewClaimInput): Promise<void> {
  if (claim.status !== "pending") {
    throw new Error("This submission has already been reviewed.");
  }

  const db = getFirebaseDb();
  const batch = writeBatch(db);

  batch.update(doc(db, CLAIMS, claim.id), {
    status: decision,
    reviewedBy: reviewer.uid,
    reviewNote: reviewNote || null,
    reviewedAt: serverTimestamp(),
  });

  if (decision === "approved") {
    batch.update(doc(db, "reports", claim.reportId), {
      status: "resolved",
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();

  if (decision === "approved") {
    try {
      const others = await getDocs(
        query(
          collection(db, CLAIMS),
          where("reportId", "==", claim.reportId),
          where("status", "==", "pending"),
        ),
      );

      await Promise.allSettled(
        others.docs
          .filter((item) => item.id !== claim.id)
          .map((item) =>
            updateDoc(item.ref, {
              status: "rejected",
              reviewedBy: reviewer.uid,
              reviewNote: "Another response was approved for this item.",
              reviewedAt: serverTimestamp(),
            }),
          ),
      );
    } catch (error) {
      // Best effort: the approval itself already committed.
      console.warn("Failed to reject other pending claims after approval", error);
    }
  }

  try {
    await createNotification({
      userId: claim.claimantId,
      type: decision === "approved" ? "claim_approved" : "claim_rejected",
      message:
        decision === "approved"
          ? `Your response to "${claim.reportTitle}" was approved. Coordinate the hand-over safely.`
          : `Your response to "${claim.reportTitle}" was rejected.${reviewNote ? ` Note: ${reviewNote}` : ""}`,
      link: `/reports/${claim.reportId}`,
    });
  } catch (error) {
    // Best effort: the review itself already committed; a notification rule/env
    // mismatch must not surface as a failed approval/rejection.
    console.warn("Failed to notify claimant after claim review", error);
  }
}

/** Marks a notification-style claim status change without touching the report. */
export async function withdrawClaim(claimId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), CLAIMS, claimId), {
    status: "rejected",
    reviewNote: "Withdrawn by the claimant.",
    reviewedAt: serverTimestamp(),
  });
}
