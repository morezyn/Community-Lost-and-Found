"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  EyeOff,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  PackageSearch,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Tag,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteReport,
  fetchPrivateDetails,
  rejectReport,
  setReportResolved,
  subscribeToReport,
} from "@/lib/firebase/reports";
import { subscribeToClaimsForReport, subscribeToMyClaims } from "@/lib/firebase/claims";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { cn, formatDate, formatDateTime, initials, timeAgo } from "@/lib/utils";
import { REPORT_TYPE_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { EmptyState } from "@/components/layout/EmptyState";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { StatusBadge, TypeBadge, ClaimStatusBadge } from "@/components/reports/StatusBadge";
import { ReportGallery } from "@/components/reports/ReportGallery";
import { ReportCategoryDialog } from "@/components/reports/ReportCategoryDialog";
import { CommentSection } from "@/components/comments/CommentSection";
import { ClaimDialog } from "@/components/claims/ClaimDialog";
import { ClaimReviewCard } from "@/components/claims/ClaimReviewCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Claim, Report, ReportPrivateDetails } from "@/types";

export function ReportDetail({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { profile, isModerator, isSignedIn, emailVerified, loading: authLoading } = useAuth();

  const [report, setReport] = React.useState<Report | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [myClaims, setMyClaims] = React.useState<Claim[]>([]);
  const [reportClaims, setReportClaims] = React.useState<Claim[]>([]);
  const [privateDetails, setPrivateDetails] = React.useState<ReportPrivateDetails | null>(null);

  const [claimOpen, setClaimOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejecting, setRejecting] = React.useState(false);
  /** Which flavour of the category dialog is open (moderator only). */
  const [categoryMode, setCategoryMode] = React.useState<"approve" | "reassign" | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [resolving, setResolving] = React.useState(false);

  // Live report document (status badge updates in real time for moderators).
  React.useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToReport(
      reportId,
      (next) => {
        setReport(next);
        setError(next ? null : "This report does not exist.");
        setLoading(false);
      },
      () => {
        setError("You do not have access to this report.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [reportId]);

  React.useEffect(() => {
    if (!profile) {
      setMyClaims([]);
      return;
    }
    const unsubscribe = subscribeToMyClaims(profile.uid, setMyClaims);
    return () => unsubscribe();
  }, [profile]);

  const isAuthor = Boolean(report && profile && report.authorId === profile.uid);

  React.useEffect(() => {
    if (!profile || !report || (!isAuthor && !isModerator)) {
      setReportClaims([]);
      setPrivateDetails(null);
      return;
    }
    const unsubscribeClaims = subscribeToClaimsForReport(report.id, setReportClaims);

    let cancelled = false;
    void fetchPrivateDetails(report.id).then((details) => {
      if (!cancelled) setPrivateDetails(details);
    });

    return () => {
      cancelled = true;
      unsubscribeClaims();
    };
  }, [profile, report, isAuthor, isModerator]);

  async function handleResolveToggle() {
    if (!report) return;
    setResolving(true);
    try {
      const nextResolved = report.status !== "resolved";
      await setReportResolved(report.id, nextResolved);
      toast.success(nextResolved ? "Marked as resolved" : "Report reopened");
    } catch (cause) {
      toast.error(describeFirebaseError(cause, "Could not update the report"));
    } finally {
      setResolving(false);
    }
  }

  async function handleDelete() {
    if (!report) return;
    setDeleting(true);
    try {
      await deleteReport(report);
      toast.success("Report deleted");
      router.push("/reports");
    } catch (cause) {
      toast.error(describeFirebaseError(cause, "Could not delete the report"));
      setDeleting(false);
    }
  }

  async function handleReject() {
    if (!report) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Give a short reason (at least 5 characters)");
      return;
    }
    setRejecting(true);
    try {
      await rejectReport(report, rejectReason.trim());
      toast.success("Report rejected");
      setRejectOpen(false);
      setRejectReason("");
    } catch (cause) {
      toast.error(describeFirebaseError(cause, "Could not reject the report"));
    } finally {
      setRejecting(false);
    }
  }

  if (loading || authLoading) {
    return <ReportDetailSkeleton />;
  }

  if (error || !report) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <EmptyState
          icon={AlertCircle}
          title="Report unavailable"
          description={
            error ??
            "This report may have been removed, rejected, or is still awaiting review."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/reports">
                <ArrowLeft /> Back to reports
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const myClaim = myClaims.find((claim) => claim.reportId === report.id);
  const canReviewClaims = isAuthor || isModerator;
  /**
   * Both directions of a hand-off start here:
   * - a `found` post can be claimed by its owner ("This is mine")
   * - a `lost` post can be answered by whoever found it ("I found this")
   */
  const isFinderResponse = report.type === "lost";
  const canRespond =
    (report.type === "found" || report.type === "lost") &&
    report.status === "approved" &&
    isSignedIn &&
    !isAuthor &&
    !myClaim;
  const typeMeta = REPORT_TYPE_META[report.type];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to reports
      </Link>

      {report.status === "pending" && (isAuthor || isModerator) && (
        <Alert variant="warning" className="mt-4">
          <Clock />
          <AlertTitle>Awaiting moderator review</AlertTitle>
          <AlertDescription>
            Only you and moderators can see this report until it is approved.
          </AlertDescription>
        </Alert>
      )}

      {report.status === "rejected" && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle />
          <AlertTitle>This report was rejected</AlertTitle>
          <AlertDescription>
            {report.rejectionReason ?? "No reason was provided."}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={report.type} />
              <StatusBadge status={report.status} />
              <Badge
                variant={report.categoryName ? "secondary" : "outline"}
                className={report.categoryName ? undefined : "text-muted-foreground"}
              >
                {report.categoryName ?? "Uncategorized"}
              </Badge>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {report.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Avatar className="size-5">
                  <AvatarImage src={report.authorPhotoURL ?? undefined} alt="" />
                  <AvatarFallback className="text-[9px]">
                    {initials(report.authorName)}
                  </AvatarFallback>
                </Avatar>
                {report.authorName}
              </span>
              <span aria-hidden="true">·</span>
              <span>Posted {timeAgo(report.createdAt)}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3.5" /> {report.commentCount}
              </span>
            </div>

            <ReportGallery images={report.images} title={report.title} />
          </div>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Description</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {report.description}
            </p>
          </section>

          {report.type === "found" && report.verificationQuestion && (
            <section className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="size-3.5" /> Verification question
              </p>
              <p className="mt-1.5 text-sm">{report.verificationQuestion}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Only the true owner should be able to answer this. The expected answer is
                private.
              </p>
            </section>
          )}

          {canReviewClaims && privateDetails?.verificationAnswer && (
            <section className="rounded-xl border border-dashed p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <EyeOff className="size-3.5" /> Private — expected answer
              </p>
              <p className="mt-1.5 text-sm font-medium">
                {privateDetails.verificationAnswer}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Visible only to you{isModerator && !isAuthor ? " (as a moderator)" : ""} and
                moderators.
              </p>
            </section>
          )}

          {canReviewClaims && reportClaims.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold">
                {isFinderResponse ? "Found reports" : "Claims"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({reportClaims.length})
                </span>
              </h2>
              <div className="space-y-3">
                {reportClaims.map((claim) => (
                  <ClaimReviewCard
                    key={claim.id}
                    claim={claim}
                    canReview={canReviewClaims && claim.status === "pending"}
                  />
                ))}
              </div>
            </section>
          )}

          {myClaim && !canReviewClaims && (
            <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                {isFinderResponse ? (
                  <PackageSearch className="size-4 text-muted-foreground" />
                ) : (
                  <ShieldCheck className="size-4 text-muted-foreground" />
                )}
                {isFinderResponse ? "Your response:" : "Your claim:"}
                <ClaimStatusBadge status={myClaim.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                Submitted {timeAgo(myClaim.createdAt)}
              </span>
            </section>
          )}

          <Separator />

          <CommentSection report={report} />
        </div>

        <aside className="space-y-4">
          <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", typeMeta.dotClass)} />
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="font-medium">{typeMeta.label}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd className="font-medium">{report.locationText}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {report.type === "incident" ? "Incident date" : "Lost / found date"}
                  </dt>
                  <dd className="font-medium">{formatDate(report.eventDate)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Posted</dt>
                  <dd className="font-medium">{formatDateTime(report.createdAt)}</dd>
                </div>
              </div>
              {report.resolvedAt && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-violet-500" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Resolved</dt>
                    <dd className="font-medium">{formatDate(report.resolvedAt)}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <UserIcon className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Reported by</dt>
                  <dd className="font-medium">{report.authorName}</dd>
                </div>
              </div>
            </dl>

            <Separator />

            <div className="space-y-2">
              {canRespond && (
                <Button className="w-full" onClick={() => setClaimOpen(true)}>
                  {isFinderResponse ? <PackageSearch /> : <ShieldCheck />}
                  {isFinderResponse ? "I found this" : "This is mine"}
                </Button>
              )}
              {myClaim?.status === "pending" && (
                <Button className="w-full" disabled variant="secondary">
                  <Clock /> {isFinderResponse ? "Response pending review" : "Claim pending review"}
                </Button>
              )}

              {!isSignedIn &&
                (report.type === "found" || report.type === "lost") &&
                report.status === "approved" && (
                  <Button className="w-full" asChild>
                    <Link href={`/login?redirect=/reports/${report.id}`}>
                      {isFinderResponse ? <PackageSearch /> : <ShieldCheck />}
                      {isFinderResponse ? "Sign in to report it found" : "Sign in to claim"}
                    </Link>
                  </Button>
                )}

              {isModerator && report.status === "pending" && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => setCategoryMode("approve")}>
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setRejectOpen(true)}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {(isAuthor || isModerator) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <MoreHorizontal /> Manage report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {(isAuthor || isModerator) && (
                      <DropdownMenuItem asChild>
                        <Link href={`/reports/${report.id}/edit`}>
                          <Pencil /> Edit report
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isModerator &&
                      (report.status === "approved" || report.status === "resolved") && (
                        <DropdownMenuItem onSelect={() => setCategoryMode("reassign")}>
                          <Tag />
                          {report.categoryName ? "Change category" : "Assign category"}
                        </DropdownMenuItem>
                      )}
                    {isAuthor && (report.status === "approved" || report.status === "resolved") && (
                      <DropdownMenuItem
                        onSelect={() => void handleResolveToggle()}
                        disabled={resolving}
                      >
                        {report.status === "resolved" ? <RotateCcw /> : <CheckCircle2 />}
                        {report.status === "resolved" ? "Reopen report" : "Mark resolved"}
                      </DropdownMenuItem>
                    )}
                    {isAuthor && <DropdownMenuSeparator />}
                    {(isAuthor || isModerator) && (
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteOpen(true)}
                      >
                        <Trash2 /> Delete report
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {!isSignedIn && (
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/login" className="underline underline-offset-2">
                  Sign in
                </Link>{" "}
                to comment or claim items.
              </p>
            )}

            {isSignedIn && !emailVerified && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                Verify your email to comment, claim, or report a find.
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">Keep it safe</p>
            <p className="mt-1">
              Meet in a public place to hand items over. Never share payment details —
              FindIt never asks for money.
            </p>
          </div>
        </aside>
      </div>

      <ClaimDialog
        report={report}
        open={claimOpen}
        onOpenChange={setClaimOpen}
      />

      <ReportCategoryDialog
        report={categoryMode ? report : null}
        mode={categoryMode ?? "approve"}
        onOpenChange={(open) => {
          if (!open) setCategoryMode(null);
        }}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this report</DialogTitle>
            <DialogDescription>
              The author will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="e.g. Missing enough detail to identify the item"
            maxLength={300}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={rejecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleReject()} disabled={rejecting}>
              {rejecting ? "Rejecting…" : "Reject report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this report?"
        description="Comments, claims, and photos will be removed permanently."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function ReportDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <Skeleton className="h-4 w-28" />
      <div className="grid gap-8 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
