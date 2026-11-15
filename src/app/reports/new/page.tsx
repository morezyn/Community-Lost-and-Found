import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportForm } from "@/components/reports/ReportForm";

export const metadata: Metadata = {
  title: "New report",
  description: "Report a lost item, a found item, or a community incident.",
};

export default function NewReportPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to reports
      </Link>

      <PageHeader
        eyebrow="Create"
        title="New report"
        description="A few details and up to four photos. Moderators review new posts before they go public."
      />

      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
        <RouteGuard>
          <ReportForm mode="create" />
        </RouteGuard>
      </div>
    </div>
  );
}
