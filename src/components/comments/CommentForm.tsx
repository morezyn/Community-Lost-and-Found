"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Send } from "lucide-react";
import { toast } from "sonner";

import { commentSchema, type CommentSchemaValues } from "@/lib/validators";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { addComment } from "@/lib/firebase/comments";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import type { Report } from "@/types";

export function CommentForm({
  report,
}: {
  report: Pick<Report, "id" | "title" | "authorId">;
}) {
  const { profile, canPost, isSignedIn, loading } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CommentSchemaValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: "" },
  });

  const text = watch("text") ?? "";

  async function onSubmit(values: CommentSchemaValues) {
    if (!profile) return;
    try {
      await addComment({
        report,
        author: {
          uid: profile.uid,
          displayName: profile.displayName,
          photoURL: profile.photoURL,
        },
        text: values.text,
      });
      reset({ text: "" });
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not post your comment"));
    }
  }

  if (loading) {
    return <div className="skeleton h-24 lg:animate-shimmer rounded-lg" />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Sign in to join the conversation.
        </p>
        <Button size="sm" asChild>
          <Link href="/login">Sign in to comment</Link>
        </Button>
      </div>
    );
  }

  if (!canPost) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <span>
          Verify your email address to comment.{" "}
          <Link href="/profile" className="font-medium underline underline-offset-2">
            Resend verification
          </Link>
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate>
      <label htmlFor="comment-text" className="sr-only">
        Write a comment
      </label>
      <Textarea
        id="comment-text"
        placeholder={`Reply to ${report.title}…`}
        rows={3}
        maxLength={520}
        aria-invalid={Boolean(errors.text)}
        {...register("text")}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {errors.text ? (
            <FieldError>{errors.text.message}</FieldError>
          ) : (
            <span className="text-xs text-muted-foreground">{text.length}/500</span>
          )}
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting || text.trim().length === 0}>
          {isSubmitting ? <Loader2 className="motion-essential animate-spin" /> : <Send />}
          Comment
        </Button>
      </div>
    </form>
  );
}

export function CommentFormSkeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-24 lg:animate-shimmer rounded-lg", className)} />;
}
