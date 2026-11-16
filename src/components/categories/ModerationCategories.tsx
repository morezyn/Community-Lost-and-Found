"use client";

import * as React from "react";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  subscribeToMyCategoryRequests,
  withdrawCategoryRequest,
} from "@/lib/firebase/categoryRequests";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { CATEGORY_REQUEST_STATUS_META, REPORT_TYPE_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn, timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/layout/EmptyState";
import { CategoryRequestDialog } from "@/components/categories/CategoryRequestDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryRequest } from "@/types";

/**
 * Moderator-side category workflow: propose a category, then track the admin's
 * decision. Categories themselves stay admin-only (see firestore.rules).
 */
export function ModerationCategories() {
  const { profile } = useAuth();
  const [requests, setRequests] = React.useState<CategoryRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = subscribeToMyCategoryRequests(
      profile.uid,
      (next) => {
        setRequests(next);
        setLoading(false);
      },
      (error) => {
        toast.error(describeFirebaseError(error, "Could not load your category requests"));
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [profile?.uid]);

  async function handleWithdraw(request: CategoryRequest) {
    setBusyId(request.id);
    try {
      await withdrawCategoryRequest(request.id);
      toast.success("Request withdrawn");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not withdraw the request"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Category requests</h2>
          <p className="text-xs text-muted-foreground">
            Missing a category while filing a report? Propose it and an admin will review it.
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus /> Request a category
        </Button>
      </div>

      {loading ? (
        [0, 1].map((index) => <Skeleton key={index} className="h-20 rounded-xl" />)
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No requests yet"
          description="Your proposals and their status will show up here."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus /> Request a category
            </Button>
          }
        />
      ) : (
        requests.map((request) => {
          const meta = CATEGORY_REQUEST_STATUS_META[request.status];
          return (
            <article
              key={request.id}
              className="space-y-1.5 rounded-xl border bg-card p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{request.name}</span>
                <Badge className={cn("ring-1", meta.badgeClass)}>{meta.label}</Badge>
                <span className="text-[11px] text-muted-foreground">
                  requested {timeAgo(request.createdAt)}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {request.appliesTo.map((type) => (
                  <Badge
                    key={type}
                    className={cn("text-[10px]", REPORT_TYPE_META[type].badgeClass)}
                  >
                    {REPORT_TYPE_META[type].label}
                  </Badge>
                ))}
              </div>

              {request.note && (
                <p className="text-xs text-muted-foreground">Your reason: {request.note}</p>
              )}

              {request.reviewNote && (
                <p className="text-xs text-muted-foreground">Admin note: {request.reviewNote}</p>
              )}

              {request.status === "pending" && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleWithdraw(request)}
                    disabled={busyId === request.id}
                  >
                    {busyId === request.id ? <Loader2 className="motion-essential animate-spin" /> : <Trash2 />}
                    Withdraw
                  </Button>
                </div>
              )}
            </article>
          );
        })
      )}

      <CategoryRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
