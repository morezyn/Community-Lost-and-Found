"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Inbox, Loader2, PlusCircle, RotateCcw } from "lucide-react";

import { useReports } from "@/hooks/useReports";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { subscribeToCategories } from "@/lib/firebase/categories";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, StaggerGroup } from "@/components/motion/Reveal";
import { ReportFiltersBar } from "@/components/reports/ReportFilters";
import { ReportCard, ReportCardSkeleton } from "@/components/reports/ReportCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Category } from "@/types";

export function ReportsBrowser() {
  const {
    reports,
    loading,
    loadingMore,
    hasMore,
    error,
    filters,
    updateFilter,
    resetFilters,
    loadMore,
    loadedCount,
  } = useReports();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const motionEnabled = useMotionEnabled();

  // 7.5b: fade the grid while filters are applied instead of snapping to
  // skeletons. Client-side filters resolve instantly, so we hold a short dim;
  // server-side filters report through `loading`.
  const filterKey = React.useMemo(
    () =>
      JSON.stringify({
        types: filters.types,
        categoryId: filters.categoryId,
        status: filters.status,
        search: filters.search,
        location: filters.location,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sort: filters.sort,
      }),
    [filters],
  );
  const [fading, setFading] = React.useState(false);
  const previousFilterKey = React.useRef(filterKey);

  React.useEffect(() => {
    if (previousFilterKey.current === filterKey) return;
    previousFilterKey.current = filterKey;
    if (!motionEnabled) return;

    setFading(true);
    const timeout = window.setTimeout(() => setFading(false), 200);
    return () => window.clearTimeout(timeout);
  }, [filterKey, motionEnabled]);

  const filtering = loading || fading;

  React.useEffect(() => {
    const unsubscribe = subscribeToCategories((next) => setCategories(next), true);
    return () => unsubscribe();
  }, []);

  // Debounce the free-text search so filtering does not run on every keystroke.
  const [searchInput, setSearchInput] = React.useState(filters.search);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      updateFilter("search", searchInput);
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchInput, updateFilter]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        eyebrow="Community feed"
        title="Browse reports"
        description="Lost belongings, found items, and community concerns — all in one place."
        actions={
          <Button asChild>
            <Link href="/reports/new">
              <PlusCircle /> Report an item
            </Link>
          </Button>
        }
      />

      <ReportFiltersBar
        filters={{ ...filters, search: searchInput }}
        updateFilter={(key, value) => {
          if (key === "search") {
            setSearchInput(value as string);
            return;
          }
          updateFilter(key, value);
        }}
        resetFilters={() => {
          resetFilters();
          setSearchInput("");
        }}
        categories={categories}
        resultCount={reports.length}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Could not load reports</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && reports.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ReportCardSkeleton key={index} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={loadedCount === 0 ? "No reports yet" : "No reports match your filters"}
          description={
            loadedCount === 0
              ? "Nothing has been approved yet. Create the first report and a moderator will review it."
              : "Try widening your search, clearing filters, or loading more results."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw /> Clear filters
              </Button>
              <Button size="sm" asChild>
                <Link href="/reports/new">Report an item</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <StaggerGroup
          className={cn(
            "grid gap-4 lg:transition-opacity lg:duration-base lg:ease-out-soft sm:grid-cols-2 lg:grid-cols-3",
            loadingMore && "lg:opacity-60",
            filtering && "lg:opacity-40",
          )}
        >
          {reports.map((report) => (
            <Reveal key={report.id} className="h-full">
              <ReportCard report={report} className="h-full" />
            </Reveal>
          ))}
        </StaggerGroup>
      )}

      {!loading && reports.length > 0 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          {hasMore ? (
            <>
              <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore && <Loader2 className="motion-essential animate-spin" />}
                Load more reports
              </Button>
              <p className="text-xs text-muted-foreground">
                {reports.length} shown from {loadedCount} loaded
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">You&apos;re all caught up.</p>
          )}
        </div>
      )}
    </div>
  );
}
