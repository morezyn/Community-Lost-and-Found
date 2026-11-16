"use client";

import * as React from "react";
import { MessageSquare } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentList } from "@/components/comments/CommentList";
import type { Report } from "@/types";

export function CommentSection({
  report,
}: {
  report: Pick<Report, "id" | "title" | "authorId" | "commentCount">;
}) {
  const { profile, isModerator } = useAuth();
  const { comments, loading, error } = useComments(report.id, {
    includeHidden: isModerator,
  });

  return (
    <section id="comments" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <MessageSquare className="size-4" />
          Comments
          <span className="text-sm font-normal text-muted-foreground">
            ({comments.length})
          </span>
        </h2>
        {/* Static dot: ANIMATIONS.md forbids infinite decorative loops. */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success ring-1 ring-inset ring-success/25">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          Live
        </span>
      </div>

      <CommentList
        comments={comments}
        loading={loading}
        error={error}
        currentUid={profile?.uid}
        isModerator={isModerator}
        reportId={report.id}
      />

      <CommentForm report={report} />
    </section>
  );
}
