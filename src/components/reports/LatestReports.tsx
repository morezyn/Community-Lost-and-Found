"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox, Loader2 } from "lucide-react";

import { fetchLatestReports } from "@/lib/firebase/reports";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { Reveal, StaggerGroup } from "@/components/motion/Reveal";
import { ReportCard, ReportCardSkeleton } from "@/components/reports/ReportCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import type { Report } from "@/types";

export function LatestReports() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    fetchLatestReports(6)
      .then((next) => {
        if (!cancelled) setReports(next);
      })
      .catch((cause) => {
        if (!cancelled) setError(describeFirebaseError(cause, "Could not load reports"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <ReportCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No approved reports yet"
        description="Be the first to report a lost item, a found item, or a community concern."
        action={
          <Button asChild size="sm">
            <Link href="/reports/new">Create the first report</Link>
          </Button>
        }
      />
    );
  }

  return (
    <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <Reveal key={report.id} className="h-full">
          <ReportCard report={report} className="h-full" />
        </Reveal>
      ))}
    </StaggerGroup>
  );
}

export function LatestReportsLoadingHint() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="size-3 motion-essential animate-spin" /> Loading reports
    </span>
  );
}
