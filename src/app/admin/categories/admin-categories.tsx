"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderTree, Check, Loader2, Pencil, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import {
  createCategory,
  seedDefaultCategories,
  subscribeToCategories,
  updateCategory,
} from "@/lib/firebase/categories";
import {
  approveCategoryRequest,
  findCategoryByName,
  rejectCategoryRequest,
  subscribeToPendingCategoryRequests,
} from "@/lib/firebase/categoryRequests";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { categorySchema, type CategorySchemaValues } from "@/lib/validators";
import { REPORT_TYPE_META } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category, CategoryRequest, ReportType } from "@/types";

const ALL_TYPES: ReportType[] = ["lost", "found", "incident"];

export function AdminCategories() {
  const { profile } = useAuth();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [requests, setRequests] = React.useState<CategoryRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [seeding, setSeeding] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<CategoryRequest | null>(null);
  const [rejectNote, setRejectNote] = React.useState("");

  React.useEffect(() => {
    const unsubscribe = subscribeToCategories(
      (next) => {
        setCategories(next);
        setLoading(false);
      },
      false,
      () => setLoading(false),
    );
    return () => unsubscribe();
  }, []);

  // Moderator proposals waiting for an admin decision.
  React.useEffect(() => {
    const unsubscribe = subscribeToPendingCategoryRequests(
      setRequests,
      (error) => {
        toast.error(describeFirebaseError(error, "Could not load category requests"));
      },
    );
    return () => unsubscribe();
  }, []);

  const form = useForm<CategorySchemaValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", appliesTo: ["lost", "found"], active: true },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", appliesTo: ["lost", "found"], active: true });
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    form.reset({
      name: category.name,
      appliesTo: category.appliesTo,
      active: category.active,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: CategorySchemaValues) {
    try {
      if (editing) {
        await updateCategory(editing.id, values);
        toast.success("Category updated");
      } else {
        await createCategory(values);
        toast.success("Category created");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not save the category"));
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const created = await seedDefaultCategories();
      toast.success(
        created > 0 ? `Added ${created} default categories` : "Categories already seeded",
      );
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not seed categories"));
    } finally {
      setSeeding(false);
    }
  }

  async function handleApproveRequest(request: CategoryRequest) {
    if (!profile) return;
    setBusyId(request.id);
    try {
      // Two requests for the same name must not create duplicate categories.
      const existing = await findCategoryByName(request.name);
      if (existing) {
        toast.error(`"${existing.name}" already exists — reject this request instead.`);
        return;
      }
      await approveCategoryRequest({ request, reviewer: { uid: profile.uid } });
      toast.success(`Category "${request.name}" created`);
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not approve the request"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRejectRequest() {
    if (!rejectTarget || !profile) return;
    const note = rejectNote.trim();
    if (note.length < 5) {
      toast.error("Add a short reason (at least 5 characters)");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await rejectCategoryRequest({
        request: rejectTarget,
        reviewer: { uid: profile.uid },
        reviewNote: note,
      });
      toast.success("Request rejected");
      setRejectTarget(null);
      setRejectNote("");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not reject the request"));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(category: Category) {
    setBusyId(category.id);
    try {
      await updateCategory(category.id, { active: !category.active });
      toast.success(category.active ? "Category disabled" : "Category enabled");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not update the category"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <AdminNav />

      <PageHeader
        eyebrow="Admin"
        title="Categories"
        description="Categories drive filtering and the dashboard breakdown. Disabling one hides it from new reports but keeps existing reports intact."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => void handleSeed()} disabled={seeding}>
              {seeding ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Seed defaults
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus /> New category
            </Button>
          </>
        }
      />

      {requests.length > 0 && (
        <section className="space-y-3 rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div>
            <h2 className="text-sm font-semibold">Category requests ({requests.length})</h2>
            <p className="text-xs text-muted-foreground">
              Proposed by moderators. Approving creates the category immediately.
            </p>
          </div>

          {requests.map((request) => (
            <article key={request.id} className="space-y-2 rounded-lg border bg-card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{request.name}</span>
                {request.appliesTo.map((type) => (
                  <Badge
                    key={type}
                    className={cn("text-[10px]", REPORT_TYPE_META[type].badgeClass)}
                  >
                    {REPORT_TYPE_META[type].label}
                  </Badge>
                ))}
                <span className="text-[11px] text-muted-foreground">
                  by {request.requesterName} · {timeAgo(request.createdAt)}
                </span>
              </div>

              {request.note && (
                <p className="text-xs text-muted-foreground">Reason: {request.note}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => void handleApproveRequest(request)}
                  disabled={busyId === request.id}
                >
                  {busyId === request.id ? <Loader2 className="animate-spin" /> : <Check />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejectTarget(request);
                    setRejectNote("");
                  }}
                  disabled={busyId === request.id}
                >
                  <X /> Reject
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Seed the default set to get started, then customise it for your community."
          action={
            <Button onClick={() => void handleSeed()} disabled={seeding}>
              <Sparkles /> Seed default categories
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {category.appliesTo.map((type) => (
                        <Badge
                          key={type}
                          className={cn("text-[10px]", REPORT_TYPE_META[type].badgeClass)}
                        >
                          {REPORT_TYPE_META[type].label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={category.active}
                        onCheckedChange={() => void toggleActive(category)}
                        disabled={busyId === category.id}
                        aria-label={category.active ? "Disable category" : "Enable category"}
                      />
                      <span className="text-xs text-muted-foreground">
                        {category.active ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                      <Pencil /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              Categories apply to the report types you select.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                placeholder="e.g. Sports equipment"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Applies to</Label>
              <div className="flex flex-wrap gap-3">
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

            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive categories are hidden from new reports.
                </p>
              </div>
              <Switch
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked)}
                aria-label="Category active"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                {editing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject category request</DialogTitle>
            <DialogDescription>
              The moderator is notified with your reason and can submit a better proposal.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            placeholder="e.g. Covered by the existing Electronics category"
            maxLength={200}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRejectRequest()}
              disabled={busyId !== null}
            >
              {busyId ? <Loader2 className="animate-spin" /> : <X />}
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
