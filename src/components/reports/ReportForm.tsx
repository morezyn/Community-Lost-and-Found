"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate, fromDateInputValue, toDate, toDateInputValue } from "@/lib/utils";
import { MAX_DESCRIPTION_LENGTH, REQUIRE_APPROVAL, REPORT_TYPE_META } from "@/lib/constants";
import { reportSchema, type ReportSchemaValues } from "@/lib/validators";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { subscribeToCategories } from "@/lib/firebase/categories";
import { createReport, updateReport } from "@/lib/firebase/reports";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePicker, type ExistingImage } from "@/components/reports/ImagePicker";
import type { Category, PendingImage, Report, ReportType } from "@/types";

interface ReportFormProps {
  mode: "create" | "edit";
  initialReport?: Report;
  initialAnswer?: string | null;
}

const TYPE_ORDER: ReportType[] = ["lost", "found", "incident"];

export function ReportForm({ mode, initialReport, initialAnswer }: ReportFormProps) {
  const router = useRouter();
  const { profile, isModerator, canPost, loading } = useAuth();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);
  const [categoriesError, setCategoriesError] = React.useState<string | null>(null);

  const [newImages, setNewImages] = React.useState<PendingImage[]>([]);
  const [existingImages] = React.useState<ExistingImage[]>(
    initialReport
      ? initialReport.images.map((url, index) => ({
          url,
          path: initialReport.imagePaths[index] ?? `${initialReport.id}-${index}`,
        }))
      : [],
  );
  const [removedPaths, setRemovedPaths] = React.useState<string[]>([]);
  const [imageError, setImageError] = React.useState<string | null>(null);

  const previewUrls = React.useRef<string[]>([]);
  React.useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  React.useEffect(() => {
    setCategoriesLoading(true);
    const unsubscribe = subscribeToCategories(
      (next) => {
        setCategories(next);
        setCategoriesLoading(false);
      },
      true,
      (error) => {
        setCategoriesError(describeFirebaseError(error, "Could not load categories"));
        setCategoriesLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<ReportSchemaValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: initialReport?.type ?? "lost",
      title: initialReport?.title ?? "",
      description: initialReport?.description ?? "",
      categoryId: initialReport?.categoryId ?? "",
      locationText: initialReport?.locationText ?? "",
      eventDate: initialReport
        ? toDateInputValue(toDate(initialReport.eventDate) ?? new Date())
        : toDateInputValue(new Date()),
      verificationQuestion: initialReport?.verificationQuestion ?? "",
      verificationAnswer: initialAnswer ?? "",
    },
  });

  const type = watch("type");
  const categoryId = watch("categoryId");
  const description = watch("description") ?? "";
  const question = watch("verificationQuestion") ?? "";

  /**
   * Category is assigned by a moderator during review. The picker only shows
   * when the author can publish immediately (mods/admins, or approval disabled)
   * or when a moderator edits an existing report.
   */
  const publishesImmediately = isModerator || !REQUIRE_APPROVAL;
  const showsCategoryPicker =
    (mode === "create" && publishesImmediately) || (mode === "edit" && isModerator);

  const allCategories = React.useMemo(() => {
    // Keep the report's current category selectable even if it was disabled.
    const current =
      initialReport && initialReport.categoryId
        ? categories.find((category) => category.id === initialReport.categoryId)
        : undefined;
    const base = categories.filter((category) => category.appliesTo.includes(type));
    if (
      current &&
      initialReport?.categoryId &&
      !base.some((category) => category.id === current.id)
    ) {
      const fallback: Category = {
        id: initialReport.categoryId,
        name: initialReport.categoryName || current.name,
        appliesTo: [type],
        active: false,
      };
      return [...base, fallback];
    }
    return base;
  }, [categories, type, initialReport]);

  function handleTypeChange(nextType: ReportType) {
    if (mode === "edit") return;
    setValue("type", nextType, { shouldValidate: true });
    const selected = categories.find((category) => category.id === categoryId);
    if (selected && !selected.appliesTo.includes(nextType)) {
      setValue("categoryId", "", { shouldValidate: true });
    }
  }

  function addFiles(files: File[]) {
    setImageError(null);
    const room = 4 - (existingImages.length - removedPaths.length + newImages.length);
    const accepted = files.slice(0, Math.max(room, 0)).map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.push(previewUrl);
      return { file, previewUrl };
    });
    setNewImages((previous) => [...previous, ...accepted]);
  }

  function removeNewImage(index: number) {
    setNewImages((previous) => {
      const target = previous[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrls.current = previewUrls.current.filter((url) => url !== target.previewUrl);
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function toggleRemoveExisting(path: string) {
    setRemovedPaths((previous) =>
      previous.includes(path)
        ? previous.filter((item) => item !== path)
        : [...previous, path],
    );
  }

  async function onSubmit(values: ReportSchemaValues) {
    if (!profile) {
      toast.error("Sign in to submit a report");
      return;
    }
    if (!canPost) {
      toast.error("Verify your email address before posting");
      return;
    }

    const selectedCategory = categories.find((item) => item.id === values.categoryId);
    const existingCategory =
      initialReport && initialReport.categoryId
        ? {
            id: initialReport.categoryId,
            name: initialReport.categoryName ?? "",
            appliesTo: [initialReport.type],
            active: true,
          }
        : undefined;
    const category = selectedCategory ?? existingCategory;

    // Publishing straight away requires a category; submissions that go to the
    // review queue get theirs assigned by the moderator.
    if (publishesImmediately && !category) {
      toast.error("Choose a category before publishing");
      return;
    }

    const eventDate = fromDateInputValue(values.eventDate) ?? new Date();

    try {
      if (mode === "create") {
        const reportId = await createReport(
          {
            type: values.type,
            title: values.title,
            description: values.description,
            category: category ?? null,
            locationText: values.locationText,
            eventDate,
            verificationQuestion: values.verificationQuestion || null,
            verificationAnswer: values.verificationAnswer || null,
            images: newImages.map((image) => image.file),
          },
          { uid: profile.uid, displayName: profile.displayName, photoURL: profile.photoURL },
          { bypassApproval: publishesImmediately },
        );
        toast.success(
          publishesImmediately
            ? "Report published"
            : "Report submitted — a moderator will review it",
        );
        router.push(`/reports/${reportId}`);
      } else if (initialReport) {
        await updateReport(
          initialReport,
          {
            title: values.title,
            description: values.description,
            // Only moderators may re-file a report; authors keep the assigned one.
            ...(isModerator && category ? { category } : {}),
            locationText: values.locationText,
            eventDate,
            verificationQuestion: values.verificationQuestion || null,
            verificationAnswer: values.verificationAnswer || null,
            newImages: newImages.map((image) => image.file),
            removedImagePaths: removedPaths,
          },
        );
        toast.success("Report updated");
        router.push(`/reports/${initialReport.id}`);
      }
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not save the report"));
    }
  }

  const submitDisabled = isSubmitting || loading || !profile || !canPost;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {!loading && !profile && (
        <Alert variant="warning">
          <ShieldCheck />
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>
            You need an account to submit a report.{" "}
            <a href="/login" className="font-medium underline underline-offset-2">
              Sign in
            </a>{" "}
            or{" "}
            <a href="/register" className="font-medium underline underline-offset-2">
              create one
            </a>
            .
          </AlertDescription>
        </Alert>
      )}

      {!loading && profile && !canPost && (
        <Alert variant="warning">
          <ShieldCheck />
          <AlertTitle>Verify your email to post</AlertTitle>
          <AlertDescription>
            Check your inbox for the verification link, or resend it from your profile.
          </AlertDescription>
        </Alert>
      )}

      {mode === "create" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">What are you reporting?</h2>
            <p className="text-xs text-muted-foreground">
              Pick the type that fits best — it controls the categories and fields below.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Report type">
            {TYPE_ORDER.map((option) => {
              const meta = REPORT_TYPE_META[option];
              const selected = type === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleTypeChange(option)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-card border p-3 text-left transition-all duration-base ease-out-soft",
                    "focus-visible:ring-2 focus-visible:ring-accent-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none",
                    selected
                      ? cn("scale-[1.02] bg-card ring-2", meta.ringClass, "border-transparent")
                      : "border-border bg-card/60 hover:bg-card",
                  )}
                >
                  <span className="flex w-full items-center gap-2 text-sm font-semibold">
                    <span className={cn("size-2 rounded-full", meta.dotClass)} />
                    {meta.label}
                    {selected && (
                      <Check className="animate-badge-pop ml-auto size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {mode === "edit" && initialReport && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className={cn("size-2 rounded-full", REPORT_TYPE_META[initialReport.type].dotClass)} />
          {REPORT_TYPE_META[initialReport.type].label} report · created{" "}
          {formatDate(initialReport.createdAt)} · the type cannot be changed after posting.
        </div>
      )}

      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder={
              type === "lost"
                ? "e.g. Lost black AirPods Pro near the library"
                : type === "found"
                  ? "e.g. Found a blue umbrella in Room 204"
                  : "e.g. Broken street light outside Gate 2"
            }
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          <FieldError>{errors.title?.message}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {showsCategoryPicker && (
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={categoryId}
                onValueChange={(value) => setValue("categoryId", value, { shouldValidate: true })}
                disabled={categoriesLoading || allCategories.length === 0}
              >
                <SelectTrigger id="categoryId" aria-invalid={Boolean(errors.categoryId)}>
                  <SelectValue
                    placeholder={categoriesLoading ? "Loading…" : "Choose a category"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                      {!category.active && " (disabled)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.categoryId?.message}</FieldError>
              <FieldError>{categoriesError}</FieldError>
              {!categoriesLoading && allCategories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No categories yet — an admin needs to seed them from the admin dashboard.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="eventDate">
              {type === "incident" ? "Date of incident" : "Date lost / found"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="eventDate"
              type="date"
              max={toDateInputValue(new Date())}
              aria-invalid={Boolean(errors.eventDate)}
              {...register("eventDate")}
            />
            <FieldError>{errors.eventDate?.message}</FieldError>
          </div>
        </div>

        {!showsCategoryPicker && (
          <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Categories are assigned by a moderator when your report is reviewed.
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            rows={5}
            placeholder={
              type === "incident"
                ? "What is the issue? Include details that would help someone fix it."
                : "Describe the item, any distinguishing marks, and the circumstances."
            }
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
          <div className="flex items-center justify-between gap-2">
            {errors.description ? (
              <FieldError>{errors.description.message}</FieldError>
            ) : (
              <span />
            )}
            <span
              className={cn(
                "text-xs text-muted-foreground",
                description.length > MAX_DESCRIPTION_LENGTH && "text-destructive",
              )}
            >
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="locationText">
            Location <span className="text-destructive">*</span>
          </Label>
          <Input
            id="locationText"
            placeholder="e.g. Main Library, 2nd floor"
            aria-invalid={Boolean(errors.locationText)}
            {...register("locationText")}
          />
          <FieldError>{errors.locationText?.message}</FieldError>
        </div>
      </section>

      <section className="space-y-2 border-t pt-6">
        <ImagePicker
          newImages={newImages}
          onAddFiles={addFiles}
          onRemoveNew={removeNewImage}
          existingImages={existingImages}
          removedPaths={removedPaths}
          onToggleRemoveExisting={toggleRemoveExisting}
          onError={(message) => {
            setImageError(message);
            toast.error(message);
          }}
          disabled={isSubmitting}
        />
        {imageError && <FieldError>{imageError}</FieldError>}
      </section>

      {type === "found" && (
        <section className="space-y-4 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Verification (for the true owner)</h2>
            <p className="text-xs text-muted-foreground">
              Optional but recommended. Ask something only the owner would know — the
              answer stays private and is only visible to you and moderators.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="verificationQuestion">Verification question</Label>
            <Input
              id="verificationQuestion"
              placeholder="e.g. What is engraved on the back?"
              aria-invalid={Boolean(errors.verificationQuestion)}
              {...register("verificationQuestion")}
            />
            <FieldError>{errors.verificationQuestion?.message}</FieldError>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="verificationAnswer">Expected answer (hidden)</Label>
            <Input
              id="verificationAnswer"
              placeholder="Never shown publicly"
              aria-invalid={Boolean(errors.verificationAnswer)}
              {...register("verificationAnswer")}
            />
            <FieldError>{errors.verificationAnswer?.message}</FieldError>
            {question.length > 0 && !errors.verificationAnswer && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  resetField("verificationQuestion");
                  resetField("verificationAnswer");
                }}
              >
                Clear verification fields
              </button>
            )}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs text-muted-foreground">
          Contact happens inside FindIt via comments and claims — your email and phone
          number are never shown publicly.
          {mode === "create" && !isModerator && REQUIRE_APPROVAL && (
            <span className="mt-1 block">
              New reports are reviewed by a moderator before they appear in the feed.
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitDisabled}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {mode === "create" ? "Submit report" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
