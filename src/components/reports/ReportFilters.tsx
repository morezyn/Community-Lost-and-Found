"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_TYPE_META } from "@/lib/constants";
import type { Category, ReportFilters as Filters, ReportType } from "@/types";

interface ReportFiltersProps {
  filters: Filters;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  categories: Category[];
  resultCount: number;
}

export function ReportFiltersBar({
  filters,
  updateFilter,
  resetFilters,
  categories,
  resultCount,
}: ReportFiltersProps) {
  const activeType = filters.types[0] ?? "all";
  const filteredCategories = filters.types.length
    ? categories.filter((category) => category.appliesTo.includes(filters.types[0]))
    : categories;

  const activeFilterCount =
    (filters.types.length ? 1 : 0) +
    (filters.categoryId ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.location.trim() ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm" aria-label="Report filters">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search titles, descriptions, categories…"
              className="pl-9"
              aria-label="Search reports"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={activeType}
              onValueChange={(value) => {
                updateFilter("types", value === "all" ? [] : [value as ReportType]);
                updateFilter("categoryId", null);
              }}
            >
              <SelectTrigger className="w-[130px]" aria-label="Filter by type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(REPORT_TYPE_META) as ReportType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {REPORT_TYPE_META[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sort}
              onValueChange={(value) =>
                updateFilter("sort", value as Filters["sort"])
              }
            >
              <SelectTrigger className="w-[130px]" aria-label="Sort reports">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="filter-category" className="text-xs text-muted-foreground">
              Category
            </Label>
            <Select
              value={filters.categoryId ?? "all"}
              onValueChange={(value) =>
                updateFilter("categoryId", value === "all" ? null : value)
              }
            >
              <SelectTrigger id="filter-category" aria-label="Filter by category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                updateFilter("status", value as Filters["status"])
              }
            >
              <SelectTrigger id="filter-status" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Open &amp; resolved</SelectItem>
                <SelectItem value="approved">Open only</SelectItem>
                <SelectItem value="resolved">Resolved only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="filter-location" className="text-xs text-muted-foreground">
              Location
            </Label>
            <Input
              id="filter-location"
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
              placeholder="e.g. Library"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="filter-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="filter-from"
                type="date"
                value={filters.dateFrom}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="filter-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="filter-to"
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal className="size-3.5" />
            {resultCount} {resultCount === 1 ? "report" : "reports"} on this page
            {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} active`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={resetFilters}
            disabled={activeFilterCount === 0 && !filters.search}
          >
            <X className="size-3.5" /> Clear filters
          </Button>
        </div>
      </div>
    </section>
  );
}
