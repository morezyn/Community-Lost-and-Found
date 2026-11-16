"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, PackageSearch, ShieldQuestion, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { claimSchema, validateImageFile, type ClaimSchemaValues } from "@/lib/validators";
import { uploadReportImage } from "@/lib/cloudinary";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { createClaim } from "@/lib/firebase/claims";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [proofImage, setProofImage] = React.useState<{ file: File; previewUrl: string } | null>(
    null,
  );
  const [uploadingProof, setUploadingProof] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const successTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClaimSchemaValues>({
    resolver: zodResolver(claimSchema),
    defaultValues: { answer: "", proofDescription: "" },
  });

  function clearProofImage() {
    setProofImage((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const proofPreviewUrlRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    proofPreviewUrlRef.current = proofImage?.previewUrl ?? null;
  }, [proofImage]);

  React.useEffect(() => {
    return () => {
      if (proofPreviewUrlRef.current) URL.revokeObjectURL(proofPreviewUrlRef.current);
    };
  }, []);

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      clearProofImage();
      reset();
      setSuccess(false);
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    }
    onOpenChange(nextOpen);
  }

  function handleProofFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setProofImage((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(values: ClaimSchemaValues) {
    if (!profile) {
      toast.error(
        isFinderResponse ? "Sign in to report a found item" : "Sign in to claim an item",
      );
      return;
    }
    try {
      let proofImageUrl: string | null = null;
      if (proofImage) {
        setUploadingProof(true);
        try {
          const uploaded = await uploadReportImage(proofImage.file, report.id);
          proofImageUrl = uploaded.url;
        } finally {
          setUploadingProof(false);
        }
      }

      await createClaim({
        report,
        claimant: { uid: profile.uid, displayName: profile.displayName },
        answer: values.answer,
        proofDescription: values.proofDescription,
        proofImageUrl,
      });
      toast.success(
        isFinderResponse
          ? "Sent — the owner has been notified"
          : "Claim submitted — the finder will review it",
      );
      clearProofImage();
      reset();
      setSuccess(true);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        setSuccess(false);
        onOpenChange(false);
      }, 1200);
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

  const busy = isSubmitting || uploadingProof;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFinderResponse ? (
              <PackageSearch className="size-5 text-success" />
            ) : (
              <ShieldQuestion className="size-5 text-success" />
            )}
            {isFinderResponse ? "I found this item" : "This is mine"}
          </DialogTitle>
          <DialogDescription>
            {isFinderResponse
              ? "Tell the owner where you found it and how they can confirm it is theirs. Only the owner and moderators see your message."
              : "Answer the finder's question so they can confirm the item is yours. Only the finder and moderators see your answer."}
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
            <span className="flex size-14 animate-scale-in items-center justify-center rounded-full bg-success/10 text-success">
              <svg
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path className="animate-check-draw" d="M4 12.5 9.5 18 20 6.5" />
              </svg>
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isFinderResponse ? "Response sent" : "Claim submitted"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isFinderResponse
                  ? "The owner has been notified and can follow up in the report."
                  : "The finder has been notified and will review your answer."}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className={cn("space-y-4", success && "hidden")}
          noValidate
        >
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
              <FieldError>{errors.answer?.message}</FieldError>
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
              <FieldError>{errors.answer?.message}</FieldError>
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
            <FieldError>{errors.proofDescription?.message}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="claim-proof-photo">Proof photo (optional)</Label>
            {proofImage ? (
              <div className="group relative aspect-[16/10] w-full animate-scale-in overflow-hidden rounded-lg border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofImage.previewUrl}
                  alt="Selected proof photo preview"
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearProofImage}
                  disabled={busy}
                  className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-destructive disabled:opacity-50"
                  aria-label="Remove proof photo"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-sm text-muted-foreground transition duration-base ease-out-soft hover:border-primary/60 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImagePlus className="size-4" />
                <span>
                  {isFinderResponse
                    ? "Add a photo of the found item"
                    : "Add a photo that helps prove it's yours"}
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              id="claim-proof-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleProofFile(event.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP · up to 5 MB · shared only with the report owner and
              moderators.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {uploadingProof
                ? "Uploading photo…"
                : isFinderResponse
                  ? "Send to owner"
                  : "Submit claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
