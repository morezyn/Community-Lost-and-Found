"use client";

import * as React from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { describeFirebaseError } from "@/lib/firebase/errors";
import { reviewClaim } from "@/lib/firebase/claims";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClaimStatusBadge } from "@/components/reports/StatusBadge";
import type { Claim } from "@/types";

interface ClaimReviewCardProps {
  claim: Claim;
  /** True when the signed-in user is the report author or a moderator. */
  canReview: boolean;
}

export function ClaimReviewCard({ claim, canReview }: ClaimReviewCardProps) {
  const { profile } = useAuth();
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState<"approved" | "rejected" | null>(null);

  async function decide(decision: "approved" | "rejected") {
    if (!profile) return;
    if (decision === "rejected" && note.trim().length === 0) {
      toast.error("Add a short note so the claimant knows why");
      return;
    }
    setBusy(decision);
    try {
      await reviewClaim({
        claim,
        decision,
        reviewer: { uid: profile.uid, displayName: profile.displayName },
        reviewNote: note.trim(),
      });
      toast.success(
        decision === "approved" ? "Claim approved — item marked resolved" : "Claim rejected",
      );
      setNote("");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not review this claim"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{claim.claimantName}</span>
          <span className="text-[11px] text-muted-foreground">
            claimed {timeAgo(claim.createdAt)}
          </span>
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      {claim.answer && (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="size-3" /> Verification answer
          </p>
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">{claim.answer}</p>
        </div>
      )}

      {claim.proofDescription && (
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Their explanation
          </p>
          <p className="text-sm leading-relaxed text-foreground/90">
            {claim.proofDescription}
          </p>
        </div>
      )}

      {claim.status !== "pending" && claim.reviewNote && (
        <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          Reviewer note: {claim.reviewNote}
        </p>
      )}

      {canReview && claim.status === "pending" && (
        <div className="space-y-2 border-t pt-3">
          <Textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note (required when rejecting)…"
            maxLength={500}
            aria-label="Review note"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void decide("rejected")}
              disabled={busy !== null}
            >
              {busy === "rejected" ? <Loader2 className="animate-spin" /> : <X />}
              Reject
            </Button>
            <Button
              size="sm"
              onClick={() => void decide("approved")}
              disabled={busy !== null}
            >
              {busy === "approved" ? <Loader2 className="animate-spin" /> : <Check />}
              Approve claim
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
