"use client";

import * as React from "react";
import { Loader2, Plus, Tag } from "lucide-react";
import { toast } from "sonner";

import { subscribeToCategories } from "@/lib/firebase/categories";
import { approveReport, setReportCategory } from "@/lib/firebase/reports";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { CategoryRequestDialog } from "@/components/categories/CategoryRequestDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category, Report } from "@/types";

interface ReportCategoryDialogProps {
  /** Report being approved or re-filed. The dialog closes when this is null. */
  report: Report | null;
  /** "approve" publishes the report; "reassign" only changes the category. */
  mode?: "approve" | "reassign";
  onOpenChange: (open: boolean) => void;
}

/**
 * Moderators are the only ones who assign categories, so both the approval
 * step and later re-filing share this dialog. Categories are filtered by the
 * report type (a "Sanitation" incident category makes no sense on a lost bag).
 */
export function ReportCategoryDialog({
  report,
  mode = "approve",
  onOpenChange,
}: ReportCategoryDialogProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [categoryId, setCategoryId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [requestOpen, setRequestOpen] = React.useState(false);

  const open = Boolean(report);

  React.useEffect(() => {
    if (!open) return;

    const unsubscribe = subscribeToCategories(
      setCategories,
      true,
      (error) => {
        toast.error(describeFirebaseError(error, "Could not load categories"));
      },
    );
    return () => unsubscribe();
  }, [open]);

  // Default to the report's current category when re-filing.
  React.useEffect(() => {
    if (open) setCategoryId(report?.categoryId ?? "");
  }, [open, report?.categoryId]);

  const options = React.useMemo(
    () =>
      report
        ? categories.filter((category) => category.appliesTo.includes(report.type))
        : [],
    [categories, report],
  );

  const isApprove = mode === "approve";

  async function handleSubmit() {
    if (!report) return;

    const category = options.find((item) => item.id === categoryId);
    if (!category) {
      toast.error("Choose a category first");
      return;
    }

    setBusy(true);
    try {
      if (isApprove) {
        await approveReport(report, category);
        toast.success(`Approved and filed under ${category.name}`);
      } else {
        await setReportCategory(report, category);
        toast.success(`Category changed to ${category.name}`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        describeFirebaseError(
          error,
          isApprove ? "Could not approve the report" : "Could not change the category",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isApprove ? "Approve and categorize" : "Change category"}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? "Pick the category that best fits this report. It becomes public as soon as you approve."
              : "The new category is shown on the report and used by the browse filters."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="report-category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={busy}>
            <SelectTrigger id="report-category">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {options.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {options.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No active categories match this report type. Request one below, or add it under
              Admin → Categories.
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => setRequestOpen(true)}
            disabled={busy}
          >
            <Plus /> Request a new category
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={busy || !categoryId}>
            {busy ? <Loader2 className="animate-spin" /> : <Tag />}
            {isApprove ? "Approve report" : "Save category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <CategoryRequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        suggestedType={report?.type}
      />
    </>
  );
}
