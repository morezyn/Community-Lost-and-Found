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
  pending: "bg-[#F5E6C4] text-[#9A6B12] ring-warning/30",
  approved: "bg-[#DCEBDD] text-success ring-success/20",
  rejected: "bg-[#F6DDD6] text-danger ring-danger/20",
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
