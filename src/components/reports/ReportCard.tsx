import Link from "next/link";
import { MapPin, MessageSquare } from "lucide-react";

import { cn, formatDate, truncate } from "@/lib/utils";
import { REPORT_TYPE_META } from "@/lib/constants";
import { TypeBadge, StatusBadge } from "@/components/reports/StatusBadge";
import { FadeImage } from "@/components/ui/fade-image";
import type { Report } from "@/types";

interface ReportCardProps {
  report: Report;
  /** Show the moderation status badge (used on own/moderation lists). */
  showStatus?: boolean;
  className?: string;
}

export function ReportCard({ report, showStatus = false, className }: ReportCardProps) {
  const image = report.images[0];
  const meta = REPORT_TYPE_META[report.type];

  return (
    <Link
      href={`/reports/${report.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-none lg:transition-all lg:duration-slow lg:ease-out-soft lg:hover:-translate-y-1 hover:border-ink-faint/40 focus-visible:ring-2 focus-visible:ring-accent-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {image ? (
          <FadeImage
            src={image}
            alt={report.title}
            loading="lazy"
            className="size-full object-cover lg:transition-[opacity,transform] lg:duration-slow lg:ease-out-soft lg:group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="text-xs text-ink-faint">No photo</span>
          </div>
        )}
        <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
          <TypeBadge type={report.type} className="shadow-sm" />
          {showStatus && <StatusBadge status={report.status} className="shadow-sm" />}
          {report.status === "resolved" && !showStatus && (
            <StatusBadge status="resolved" className="shadow-sm" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <span className={cn("size-1.5 rounded-full", meta.dotClass)} aria-hidden="true" />
          <span>{report.categoryName ?? "Uncategorized"}</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(report.eventDate)}</span>
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug lg:transition-colors lg:duration-fast lg:ease-out-soft group-hover:text-primary">
          {report.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {truncate(report.description, 140)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="size-3" />
            <span className="truncate">{report.locationText}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <MessageSquare className="size-3" />
            {report.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ReportCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-card border border-border bg-card",
        className,
      )}
    >
      <div className="skeleton aspect-[4/3] w-full lg:animate-shimmer" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-3 w-24 lg:animate-shimmer rounded-full" />
        <div className="skeleton h-4 w-4/5 lg:animate-shimmer rounded-full" />
        <div className="skeleton h-3 w-full lg:animate-shimmer rounded-full" />
        <div className="skeleton h-3 w-2/3 lg:animate-shimmer rounded-full" />
      </div>
    </div>
  );
}
