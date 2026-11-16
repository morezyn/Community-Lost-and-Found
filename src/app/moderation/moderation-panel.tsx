"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Eye,
  Inbox,
  Loader2,
  MessageSquareOff,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { rejectReport, subscribeToReportsByStatus } from "@/lib/firebase/reports";
import { subscribeToPendingClaims } from "@/lib/firebase/claims";
import { subscribeToHiddenComments } from "@/lib/firebase/comments";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { REPORT_TYPE_META } from "@/lib/constants";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { useListPresence } from "@/hooks/useListPresence";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { TypeBadge } from "@/components/reports/StatusBadge";
import { ReportCategoryDialog } from "@/components/reports/ReportCategoryDialog";
import { ModerationCategories } from "@/components/categories/ModerationCategories";
import { ClaimReviewCard } from "@/components/claims/ClaimReviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FadeImage } from "@/components/ui/fade-image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Claim, Comment, Report } from "@/types";

export function ModerationPanel() {
  const [pendingReports, setPendingReports] = React.useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = React.useState(true);
  const [pendingClaims, setPendingClaims] = React.useState<Claim[]>([]);
  const [hiddenComments, setHiddenComments] = React.useState<Comment[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [approveTarget, setApproveTarget] = React.useState<Report | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<Report | null>(null);
  const [reason, setReason] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Keep rows mounted briefly after approval/rejection so they can collapse.
  const reportEntries = useListPresence(pendingReports);
  const claimEntries = useListPresence(pendingClaims);
  const commentEntries = useListPresence(hiddenComments);

  React.useEffect(() => {
    const unsubReports = subscribeToReportsByStatus(
      "pending",
      (next) => {
        setPendingReports(next);
        setReportsLoading(false);
      },
      (error) => {
        setLoadError(
          describeFirebaseError(error, "Could not load the moderation queue"),
        );
        setReportsLoading(false);
      },
    );
    const unsubClaims = subscribeToPendingClaims(setPendingClaims);
    const unsubComments = subscribeToHiddenComments(setHiddenComments);

    return () => {
      unsubReports();
      unsubClaims();
      unsubComments();
    };
  }, []);

  async function handleReject() {
    if (!rejectTarget) return;
    if (reason.trim().length < 5) {
      toast.error("Add a short reason (at least 5 characters)");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await rejectReport(rejectTarget, reason.trim());
      toast.success("Report rejected");
      setRejectTarget(null);
      setReason("");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not reject the report"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      <PageHeader
        eyebrow="Moderator tools"
        title="Moderation queue"
        description="Approve new reports, verify claims, and keep the conversation respectful. Everything updates live."
      />

      {loadError && (
        <Alert variant="destructive">
          <ShieldCheck />
          <AlertTitle>Queue unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="reports">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-auto">
          <TabsTrigger value="reports">
            Pending reports
            <CountBadge count={pendingReports.length} />
          </TabsTrigger>
          <TabsTrigger value="claims">
            Claims
            <CountBadge count={pendingClaims.length} />
          </TabsTrigger>
          <TabsTrigger value="comments">
            Hidden comments
            <CountBadge count={hiddenComments.length} />
          </TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-3 pt-4">
          {reportsLoading ? (
            [0, 1, 2].map((index) => <Skeleton key={index} className="h-28 rounded-xl" />)
          ) : reportEntries.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Queue is clear"
              description="New reports waiting for review will appear here."
            />
          ) : (
            reportEntries.map(({ item: report, exiting }) => {
              const meta = REPORT_TYPE_META[report.type];
              return (
                <div
                  key={report.id}
                  className={cn(
                    "grid lg:transition-[grid-template-rows,opacity] lg:duration-base lg:ease-out-soft",
                    exiting ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
                  )}
                >
                  <div className="overflow-hidden">
                    <article
                      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row"
                    >
                      <div className="h-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-28">
                        {report.images[0] ? (
                          <FadeImage
                            src={report.images[0]}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                            No photo
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <TypeBadge type={report.type} />
                          <span className="text-[11px] text-muted-foreground">
                            {report.categoryName ?? "Uncategorized"} ·{" "}
                            {formatDate(report.eventDate)}
                          </span>
                        </div>
                        <Link
                          href={`/reports/${report.id}`}
                          className="block truncate text-sm font-semibold hover:text-primary hover:underline"
                        >
                          {report.title}
                        </Link>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {report.description}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          by {report.authorName} · submitted {timeAgo(report.createdAt)} ·{" "}
                          {report.locationText}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-start gap-2">
                        <Button
                          size="sm"
                          onClick={() => setApproveTarget(report)}
                          disabled={busyId === report.id}
                        >
                          {busyId === report.id ? <Loader2 className="motion-essential animate-spin" /> : <Check />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectTarget(report);
                            setReason("");
                          }}
                          disabled={busyId === report.id}
                        >
                          <X /> Reject
                        </Button>
                      </div>
                      <span className={cn("hidden", meta.badgeClass)} aria-hidden="true" />
                    </article>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-3 pt-4">
          {claimEntries.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No pending claims"
              description="Claims submitted on found items will appear here for review."
            />
          ) : (
            claimEntries.map(({ item: claim, exiting }) => (
              <div
                key={claim.id}
                className={cn(
                  "grid lg:transition-[grid-template-rows,opacity] lg:duration-base lg:ease-out-soft",
                  exiting ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
                )}
              >
                <div className="min-w-0 space-y-1.5 overflow-hidden">
                  <Link
                    href={`/reports/${claim.reportId}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {claim.reportTitle}
                  </Link>
                  <ClaimReviewCard claim={claim} canReview />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-3 pt-4">
          {commentEntries.length === 0 ? (
            <EmptyState
              icon={MessageSquareOff}
              title="No hidden comments"
              description="Comments hidden by moderators show up here so they can be restored."
            />
          ) : (
            commentEntries.map(({ item: comment, exiting }) => (
              <article
                key={comment.id}
                className={cn(
                  "grid lg:transition-[grid-template-rows,opacity] lg:duration-base lg:ease-out-soft",
                  exiting ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
                )}
              >
                <div className="space-y-2 overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{comment.authorName}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo(comment.createdAt)}
                      </span>
                      <Badge variant="secondary">Hidden</Badge>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/reports/${comment.reportId}#comments`}>
                        <Eye /> Open report
                      </Link>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.text}</p>
                </div>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="categories">
          <ModerationCategories />
        </TabsContent>
      </Tabs>

      <ReportCategoryDialog
        report={approveTarget}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
      />

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this report</DialogTitle>
            <DialogDescription>
              The author is notified with your reason and can edit and resubmit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Photos do not match the description, or missing location"
            maxLength={300}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleReject()}
              disabled={busyId !== null}
            >
              {busyId ? <Loader2 className="motion-essential animate-spin" /> : <X />}
              Reject report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      key={count}
      className="ml-1 lg:animate-badge-pop rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground"
    >
      {count}
    </span>
  );
}
