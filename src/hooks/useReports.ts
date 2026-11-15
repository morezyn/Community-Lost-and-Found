"use client";

import * as React from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { fetchReportPage } from "@/lib/firebase/reports";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { fromDateInputValue, toDate } from "@/lib/utils";
import type { Report, ReportFilters } from "@/types";

export const DEFAULT_FILTERS: ReportFilters = {
  types: [],
  categoryId: null,
  status: "all",
  search: "",
  location: "",
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

function matchesClientFilters(report: Report, filters: ReportFilters): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search) {
    const haystack =
      `${report.title} ${report.description} ${report.categoryName ?? ""} ${report.locationText}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }

  const location = filters.location.trim().toLowerCase();
  if (location && !report.locationText.toLowerCase().includes(location)) {
    return false;
  }

  const eventDate = toDate(report.eventDate);
  if (eventDate) {
    if (filters.dateFrom) {
      const from = fromDateInputValue(filters.dateFrom);
      if (from && eventDate.getTime() < from.getTime()) return false;
    }
    if (filters.dateTo) {
      const to = fromDateInputValue(filters.dateTo);
      if (to) {
        to.setHours(23, 59, 59, 999);
        if (eventDate.getTime() > to.getTime()) return false;
      }
    }
  }

  return true;
}

interface UseReportsResult {
  /** Server-filtered + client-filtered reports for the current page. */
  reports: Report[];
  /** How many docs are loaded for this query (ignoring client filters). */
  loadedCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  filters: ReportFilters;
  setFilters: React.Dispatch<React.SetStateAction<ReportFilters>>;
  updateFilter: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void;
  resetFilters: () => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Feed data hook: server-side status/type/category filtering with cursor
 * pagination, plus client-side search/location/date filtering for the current
 * page (see the NOTE in lib/firebase/reports.ts).
 */
export function useReports(initial?: Partial<ReportFilters>): UseReportsResult {
  const [filters, setFilters] = React.useState<ReportFilters>({
    ...DEFAULT_FILTERS,
    ...initial,
  });
  const [allReports, setAllReports] = React.useState<Report[]>([]);
  const [cursor, setCursor] =
    React.useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const requestId = React.useRef(0);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  const fetchFirstPage = React.useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchReportPage({ filters: filtersRef.current });
      if (requestId.current !== currentRequest) return;
      setAllReports(page.reports);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (cause) {
      if (requestId.current !== currentRequest) return;
      setError(describeFirebaseError(cause, "Could not load reports"));
      setAllReports([]);
      setCursor(null);
      setHasMore(false);
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  // Re-fetch when any server-side filter changes.
  const serverKey = JSON.stringify({
    status: filters.status,
    type: filters.types[0] ?? null,
    categoryId: filters.categoryId,
    sort: filters.sort,
  });

  React.useEffect(() => {
    void fetchFirstPage();
  }, [serverKey, fetchFirstPage]);

  const loadMore = React.useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchReportPage({
        filters: filtersRef.current,
        cursor,
      });
      setAllReports((previous) => [...previous, ...page.reports]);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (cause) {
      setError(describeFirebaseError(cause, "Could not load more reports"));
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  const updateFilter = React.useCallback(
    <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
      setFilters((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const resetFilters = React.useCallback(() => {
    setFilters((previous) => ({
      ...DEFAULT_FILTERS,
      sort: previous.sort,
    }));
  }, []);

  const reports = React.useMemo(
    () => allReports.filter((report) => matchesClientFilters(report, filters)),
    [allReports, filters],
  );

  return {
    reports,
    loadedCount: allReports.length,
    loading,
    loadingMore,
    hasMore,
    error,
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    refresh: fetchFirstPage,
    loadMore,
  };
}
