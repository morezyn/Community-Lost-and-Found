"use client";

import * as React from "react";
import { toast } from "sonner";
import { Eye, EyeOff, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";

import { cn, initials, timeAgo } from "@/lib/utils";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { deleteComment, setCommentHidden } from "@/lib/firebase/comments";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { EmptyState } from "@/components/layout/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { Comment } from "@/types";

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  currentUid?: string;
  isModerator: boolean;
  reportId: string;
}

export function CommentList({
  comments,
  loading,
  error,
  currentUid,
  isModerator,
  reportId,
}: CommentListProps) {
  const [pendingDelete, setPendingDelete] = React.useState<Comment | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteComment(reportId, pendingDelete.id);
      toast.success("Comment deleted");
      setPendingDelete(null);
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not delete the comment"));
    } finally {
      setDeleting(false);
    }
  }

  async function handleHide(comment: Comment) {
    setBusyId(comment.id);
    try {
      await setCommentHidden(reportId, comment.id, !comment.hidden);
      toast.success(comment.hidden ? "Comment restored" : "Comment hidden");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not update the comment"));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (comments.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No comments yet"
        description="Be the first to ask a question or share a helpful detail."
        className="py-10"
      />
    );
  }

  return (
    <>
      <ul className="space-y-5">
        {comments.map((comment) => {
          const isOwn = currentUid === comment.authorId;
          const canModerate = isModerator && !isOwn;
          return (
            <li key={comment.id} className="flex gap-3">
              <Avatar className="mt-0.5 size-8">
                <AvatarImage src={comment.authorPhotoURL ?? undefined} alt="" />
                <AvatarFallback>{initials(comment.authorName)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-medium">{comment.authorName}</span>
                  {isOwn && (
                    <span className="text-[11px] text-muted-foreground">you</span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(comment.createdAt)}
                  </span>
                  {comment.hidden && (
                    <Badge variant="secondary" className="text-[10px]">
                      Hidden
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    "mt-1 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90",
                    comment.hidden && "italic text-muted-foreground",
                  )}
                >
                  {comment.text}
                </p>
              </div>

              {(isOwn || canModerate) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground"
                      aria-label="Comment actions"
                      disabled={busyId === comment.id}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canModerate && (
                      <DropdownMenuItem
                        onSelect={() => void handleHide(comment)}
                        disabled={busyId === comment.id}
                      >
                        {comment.hidden ? <Eye /> : <EyeOff />}
                        {comment.hidden ? "Restore comment" : "Hide comment"}
                      </DropdownMenuItem>
                    )}
                    {isOwn && (
                      <>
                        {canModerate && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setPendingDelete(comment)}
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  );
}
