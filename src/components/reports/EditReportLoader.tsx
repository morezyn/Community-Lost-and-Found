"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

import { fetchPrivateDetails, fetchReportById } from "@/lib/firebase/reports";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportForm } from "@/components/reports/ReportForm";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import type { Report } from "@/types";

export function EditReportLoader({ reportId }: { reportId: string }) {
  const { profile, isModerator, loading: authLoading } = useAuth();
  const [report, setReport] = React.useState<Report | null>(null);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    fetchReportById(reportId)
      .then(async (next) => {
        if (cancelled) return;
        setReport(next);
        if (next && next.type === "found") {
          const details = await fetchPrivateDetails(next.id);
          if (!cancelled) setAnswer(details?.verificationAnswer ?? null);
        }
      })
      .catch((cause) => {
        if (!cancelled) setError(describeFirebaseError(cause, "Could not load the report"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Report not found"
        description={error ?? "It may have been deleted or is not visible to you."}
        action={
          <Button asChild variant="outline">
            <Link href="/reports">Back to reports</Link>
          </Button>
        }
      />
    );
  }

  const canEdit = Boolean(profile && (profile.uid === report.authorId || isModerator));

  if (!canEdit) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="You can't edit this report"
        description="Only the author or a moderator can edit a report."
        action={
          <Button asChild variant="outline">
            <Link href={`/reports/${report.id}`}>View the report</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/reports/${report.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to the report
      </Link>

      <PageHeader
        eyebrow="Edit"
        title="Edit report"
        description="Update the details or photos. Moderators and the author can make changes."
      />

      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <ReportForm mode="edit" initialReport={report} initialAnswer={answer} />
      </div>
    </div>
  );
}
