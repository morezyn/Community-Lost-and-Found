"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderTree, Loader2, Pencil, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  createCategory,
  seedDefaultCategories,
  subscribeToCategories,
  updateCategory,
} from "@/lib/firebase/categories";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { categorySchema, type CategorySchemaValues } from "@/lib/validators";
import { REPORT_TYPE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { Category, ReportType } from "@/types";

const ALL_TYPES: ReportType[] = ["lost", "found", "incident"];

export function AdminCategories() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [seeding, setSeeding] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

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
    </div>
  );
}
