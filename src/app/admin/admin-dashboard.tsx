"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FolderTree,
  Inbox,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { fetchAllReports } from "@/lib/firebase/reports";
import { seedDefaultCategories } from "@/lib/firebase/categories";
import { ensureAppConfig, seedDemoData } from "@/lib/firebase/seed";
import { subscribeToUsers } from "@/lib/firebase/users";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { REPORT_TYPE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { ReportsOverTime } from "@/components/charts/ReportsOverTime";
import { ByCategory } from "@/components/charts/ByCategory";
import { TypeBreakdown } from "@/components/charts/TypeBreakdown";
import { ResolutionRate } from "@/components/charts/ResolutionRate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { AppUser, Report, ReportType } from "@/types";

export function AdminDashboard() {
  const { profile } = useAuth();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [users, setUsers] = React.useState<AppUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [seeding, setSeeding] = React.useState<"categories" | "demo" | null>(null);
  const [demoConfirmOpen, setDemoConfirmOpen] = React.useState(false);

  const loadReports = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchAllReports();
      setReports(next);
    } catch (cause) {
      setError(describeFirebaseError(cause, "Could not load analytics"));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadReports();
    const unsubscribe = subscribeToUsers(setUsers);
    return () => unsubscribe();
  }, [loadReports]);

  const stats = React.useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter((report) => report.status === "resolved").length;
    const open = reports.filter((report) => report.status === "approved").length;
    const pending = reports.filter((report) => report.status === "pending").length;
    const byType: Record<ReportType, number> = {
      lost: 0,
      found: 0,
      incident: 0,
    };
    reports.forEach((report) => {
      byType[report.type] += 1;
    });
    return {
      total,
      resolved,
      open,
      pending,
      byType,
      members: users.filter((user) => !user.disabled).length,
      totalUsers: users.length,
    };
  }, [reports, users]);

  async function handleSeedCategories() {
    setSeeding("categories");
    try {
      await ensureAppConfig();
      const created = await seedDefaultCategories();
      toast.success(
        created > 0 ? `Added ${created} default categories` : "Categories are already seeded",
      );
    } catch (cause) {
      toast.error(describeFirebaseError(cause, "Could not seed categories"));
    } finally {
      setSeeding(null);
    }
  }

  async function handleSeedDemo() {
    if (!profile) return;
    setSeeding("demo");
    try {
      const result = await seedDemoData(profile);
      toast.success(`Added ${result.reports} demo reports`);
      setDemoConfirmOpen(false);
      await loadReports();
    } catch (cause) {
      toast.error(describeFirebaseError(cause, "Could not seed demo data"));
    } finally {
      setSeeding(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Community health at a glance: volume, mix, and resolution rate."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void loadReports()} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : undefined} /> Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/moderation">
                <Shield /> Moderation
                {stats.pending > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {stats.pending}
                  </span>
                )}
              </Link>
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Analytics unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total reports"
          value={stats.total}
          hint={`${stats.pending} awaiting review`}
          icon={Inbox}
        />
        <StatCard
          label="Open reports"
          value={stats.open}
          hint="Approved, not yet resolved"
          icon={Activity}
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          hint={
            stats.total > 0
              ? `${Math.round((stats.resolved / stats.total) * 100)}% resolution rate`
              : "No reports yet"
          }
          icon={CheckCircle2}
        />
        <StatCard
          label="Members"
          value={stats.members}
          hint={`${stats.totalUsers} total accounts`}
          icon={Users}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(REPORT_TYPE_META) as ReportType[]).map((type) => {
          const meta = REPORT_TYPE_META[type];
          return (
            <div
              key={type}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className={cn("size-2.5 rounded-full", meta.dotClass)} />
                {meta.label}
              </span>
              <span className="text-lg font-semibold tabular-nums">{stats.byType[type]}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" /> Reports over time
              </CardTitle>
              <CardDescription>New reports per day over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportsOverTime reports={reports} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports by category</CardTitle>
              <CardDescription>Top categories across all reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <ByCategory reports={reports} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lost vs found vs incident</CardTitle>
              <CardDescription>Where the community needs the most help.</CardDescription>
            </CardHeader>
            <CardContent>
              <TypeBreakdown reports={reports} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resolution rate</CardTitle>
              <CardDescription>
                Share of all reports that reached the resolved state.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
              <ResolutionRate resolved={stats.resolved} total={stats.total} />
              <div className="w-full max-w-sm space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Resolved items are removed from the open feed but stay searchable for
                  everyone&apos;s records.
                </p>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Awaiting review</span>
                  <span className="font-semibold tabular-nums">{stats.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pending claims</span>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                    <Link href="/moderation">Open queue</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" /> Demo setup
          </CardTitle>
          <CardDescription>
            Prepare the project for a presentation. Both actions are safe to run more than
            once.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void handleSeedCategories()}
            disabled={seeding !== null}
          >
            {seeding === "categories" ? <Loader2 className="animate-spin" /> : <FolderTree />}
            Seed default categories
          </Button>
          <Button
            onClick={() => setDemoConfirmOpen(true)}
            disabled={seeding !== null}
          >
            {seeding === "demo" ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Seed demo reports
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={demoConfirmOpen}
        onOpenChange={setDemoConfirmOpen}
        title="Seed 12 demo reports?"
        description="They will be authored by your admin account and published immediately. Existing demo data is not removed, so running this twice creates duplicates."
        confirmLabel="Seed demo data"
        loading={seeding === "demo"}
        onConfirm={handleSeedDemo}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
