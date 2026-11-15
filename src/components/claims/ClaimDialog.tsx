"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PackageSearch, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";

import { claimSchema, type ClaimSchemaValues } from "@/lib/validators";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { createClaim } from "@/lib/firebase/claims";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Report } from "@/types";

interface ClaimDialogProps {
  report: Pick<
    Report,
    "id" | "title" | "authorId" | "type" | "verificationQuestion"
  >;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * One dialog, two jobs:
 * - `found` post: the owner proves the item is theirs ("This is mine").
 * - `lost` post:  a finder tells the owner where the item is ("I found this").
 *
 * Both write the same `claims` document, which the report author reviews.
 */
export function ClaimDialog({ report, open, onOpenChange }: ClaimDialogProps) {
  const { profile } = useAuth();
  const isFinderResponse = report.type === "lost";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClaimSchemaValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: { answer: "", proofDescription: "" },
  });

  async function onSubmit(values: ClaimSchemaValues) {
    if (!profile) {
      toast.error(
        isFinderResponse ? "Sign in to report a found item" : "Sign in to claim an item",
      );
      return;
    }
    try {
      await createClaim({
        report,
        claimant: { uid: profile.uid, displayName: profile.displayName },
        answer: values.answer,
        proofDescription: values.proofDescription,
        // NOTE: optional proof photo is intentionally not collected in this
        // build - the written proof + verification answer cover the demo.
        proofImageUrl: null,
      });
      toast.success(
        isFinderResponse
          ? "Sent — the owner has been notified"
          : "Claim submitted — the finder will review it",
      );
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        describeFirebaseError(
          error,
          isFinderResponse
            ? "Could not send your response"
            : "Could not submit your claim",
        ),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFinderResponse ? (
              <PackageSearch className="size-5 text-emerald-600" />
            ) : (
              <ShieldQuestion className="size-5 text-emerald-600" />
            )}
            {isFinderResponse ? "I found this item" : "This is mine"}
          </DialogTitle>
          <DialogDescription>
            {isFinderResponse
              ? "Tell the owner where you found it and how they can confirm it is theirs. Only the owner and moderators see your message."
              : "Answer the finder's question so they can confirm the item is yours. Only the finder and moderators see your answer."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {isFinderResponse ? (
            <div className="space-y-1.5">
              <Label htmlFor="claim-answer">
                Where and when did you find it?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="claim-answer"
                rows={2}
                placeholder="e.g. Library, 3rd floor, left of the stairs — around 2pm today"
                aria-invalid={Boolean(errors.answer)}
                {...register("answer")}
              />
              {errors.answer && (
                <p className="text-xs text-destructive">{errors.answer.message}</p>
              )}
            </div>
          ) : report.verificationQuestion ? (
            <div className="space-y-1.5">
              <Label htmlFor="claim-answer">
                {report.verificationQuestion} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="claim-answer"
                rows={2}
                placeholder="Your answer"
                aria-invalid={Boolean(errors.answer)}
                {...register("answer")}
              />
              {errors.answer && (
                <p className="text-xs text-destructive">{errors.answer.message}</p>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              The finder didn&apos;t add a verification question, so describe the item in
              detail below.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="claim-proof">
              {isFinderResponse ? "Anything else that helps?" : "Why is it yours?"}
            </Label>
            <Textarea
              id="claim-proof"
              rows={4}
              placeholder={
                isFinderResponse
                  ? "Current condition, where it is now, or a detail only the owner would recognise…"
                  : "Describe unique details, when you lost it, contents, serial numbers…"
              }
              aria-invalid={Boolean(errors.proofDescription)}
              {...register("proofDescription")}
            />
            {errors.proofDescription && (
              <p className="text-xs text-destructive">
                {errors.proofDescription.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isFinderResponse ? "Send to owner" : "Submit claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
