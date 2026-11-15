import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { REPORT_STATUS_META, REPORT_TYPE_META } from "@/lib/constants";
import type { ClaimStatus, ReportStatus, ReportType } from "@/types";

export function TypeBadge({
  type,
  className,
}: {
  type: ReportType;
  className?: string;
}) {
  const meta = REPORT_TYPE_META[type];
  return (
    <Badge className={cn(meta.badgeClass, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ReportStatus;
  className?: string;
}) {
  const meta = REPORT_STATUS_META[status];
  return <Badge className={cn(meta.badgeClass, className)}>{meta.label}</Badge>;
}

const CLAIM_STATUS_META: Record<ClaimStatus, string> = {
  pending:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
  approved:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  rejected:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
};

export function ClaimStatusBadge({
  status,
  className,
}: {
  status: ClaimStatus;
  className?: string;
}) {
  return (
    <Badge className={cn(CLAIM_STATUS_META[status], className)}>
      {status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected"}
    </Badge>
  );
}
