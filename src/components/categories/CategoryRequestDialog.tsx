"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { findCategoryByName, requestCategory } from "@/lib/firebase/categoryRequests";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { categoryRequestSchema, type CategoryRequestSchemaValues } from "@/lib/validators";
import { REPORT_TYPE_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReportType } from "@/types";

const ALL_TYPES: ReportType[] = ["lost", "found", "incident"];

interface CategoryRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selects the report type the moderator was filing (optional). */
  suggestedType?: ReportType;
}

/**
 * Moderators cannot write `categories` directly, so they propose one here and an
 * admin approves it under Admin -> Categories.
 */
export function CategoryRequestDialog({
  open,
  onOpenChange,
  suggestedType,
}: CategoryRequestDialogProps) {
  const { profile } = useAuth();

  const form = useForm<CategoryRequestSchemaValues>({
    resolver: zodResolver(categoryRequestSchema),
    defaultValues: {
      name: "",
      appliesTo: suggestedType ? [suggestedType] : ["lost", "found"],
      note: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        appliesTo: suggestedType ? [suggestedType] : ["lost", "found"],
        note: "",
      });
    }
    // `form` is stable; resetting only when the dialog opens is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, suggestedType]);

  async function onSubmit(values: CategoryRequestSchemaValues) {
    if (!profile) {
      toast.error("Sign in again to request a category");
      return;
    }

    try {
      const existing = await findCategoryByName(values.name);
      if (existing) {
        toast.error(`"${existing.name}" already exists — pick that one instead.`);
        return;
      }

      await requestCategory({
        name: values.name,
        appliesTo: values.appliesTo,
        note: values.note,
        requester: { uid: profile.uid, displayName: profile.displayName },
      });

      toast.success("Request sent to the admins for review");
      onOpenChange(false);
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not send the category request"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a category</DialogTitle>
          <DialogDescription>
            Admins review new categories. You will be notified here as soon as it is approved.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="request-category-name">Category name</Label>
            <Input
              id="request-category-name"
              placeholder="e.g. Sports equipment"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Applies to</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map((type) => {
                const selected = form.watch("appliesTo").includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const current = form.getValues("appliesTo");
                      const next = selected
                        ? current.filter((item) => item !== type)
                        : [...current, type];
                      form.setValue("appliesTo", next, { shouldValidate: true });
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                    aria-pressed={selected}
                  >
                    {REPORT_TYPE_META[type].label}
                  </button>
                );
              })}
            </div>
            {form.formState.errors.appliesTo && (
              <p className="text-xs text-destructive">
                {form.formState.errors.appliesTo.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="request-category-note">
              Why is it needed? <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="request-category-note"
              rows={3}
              placeholder="e.g. We see several reports a week for PE gear that has no fitting category."
              aria-invalid={Boolean(form.formState.errors.note)}
              {...form.register("note")}
            />
            {form.formState.errors.note && (
              <p className="text-xs text-destructive">{form.formState.errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
