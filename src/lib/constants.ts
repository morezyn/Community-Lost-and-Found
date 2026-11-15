import type { ReportStatus, ReportType, Role, Category } from "@/types";

/**
 * Whether newly created reports need moderator approval before they become
 * public. Mirrors the `config/app.requireApproval` flag used by the Firestore
 * rules (see firestore.rules + scripts/seed).
 */
export const REQUIRE_APPROVAL =
  process.env.NEXT_PUBLIC_REQUIRE_APPROVAL !== "false";

/**
 * Demo accounts used for the presentation. They have no real inbox, so
 * firestore.rules treats them as verified via `isDemoAccount()`.
 *
 * Keep this list in sync with firestore.rules. It only affects UI copy (the
 * "verify your email" banners); the rules remain the real gate.
 */
export const DEMO_ACCOUNT_EMAILS = [
  "admin@findit.demo",
  "moderator@findit.demo",
  "user@findit.demo",
] as const;

export function isDemoAccountEmail(email: string | null | undefined): boolean {
  return !!email && DEMO_ACCOUNT_EMAILS.some((demo) => demo === email.toLowerCase());
}

export const PAGE_SIZE = 9;

export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 2000;

interface TypeMeta {
  label: string;
  /** Short blurb used on the create form. */
  description: string;
  badgeClass: string;
  dotClass: string;
  ringClass: string;
}

export const REPORT_TYPE_META: Record<ReportType, TypeMeta> = {
  lost: {
    label: "Lost",
    description: "I lost something and I'm hoping to get it back.",
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    dotClass: "bg-rose-500",
    ringClass: "ring-rose-200 dark:ring-rose-500/30",
  },
  found: {
    label: "Found",
    description: "I found something and want to return it to its owner.",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    dotClass: "bg-emerald-500",
    ringClass: "ring-emerald-200 dark:ring-emerald-500/30",
  },
  incident: {
    label: "Incident",
    description: "Report a community concern: hazard, damage, or safety issue.",
    badgeClass: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    dotClass: "bg-amber-500",
    ringClass: "ring-amber-200 dark:ring-amber-500/30",
  },
};

interface StatusMeta {
  label: string;
  badgeClass: string;
}

export const REPORT_STATUS_META: Record<ReportStatus, StatusMeta> = {
  pending: {
    label: "Pending review",
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
  },
  approved: {
    label: "Approved",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  },
};

export const ROLE_META: Record<Role, { label: string; badgeClass: string }> = {
  user: {
    label: "Member",
    badgeClass: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
  },
  moderator: {
    label: "Moderator",
    badgeClass: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  },
  admin: {
    label: "Admin",
    badgeClass: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  },
};

/**
 * Default category set. Used by the admin "seed categories" action and by the
 * demo-data seeder. Kept in code so a fresh project has usable categories
 * without any extra tooling.
 */
export const DEFAULT_CATEGORIES: Array<Omit<Category, "id">> = [
  { name: "Electronics", appliesTo: ["lost", "found"], active: true },
  { name: "Documents & IDs", appliesTo: ["lost", "found"], active: true },
  { name: "Bags & Wallets", appliesTo: ["lost", "found"], active: true },
  { name: "Keys", appliesTo: ["lost", "found"], active: true },
  { name: "Clothing", appliesTo: ["lost", "found"], active: true },
  { name: "Pets", appliesTo: ["lost", "found"], active: true },
  { name: "Other", appliesTo: ["lost", "found"], active: true },
  { name: "Safety", appliesTo: ["incident"], active: true },
  { name: "Infrastructure", appliesTo: ["incident"], active: true },
  { name: "Sanitation", appliesTo: ["incident"], active: true },
  { name: "Noise", appliesTo: ["incident"], active: true },
  { name: "Other concern", appliesTo: ["incident"], active: true },
];

export const APP_NAME = "FindIt";
export const APP_TAGLINE = "Lost & found, and community concerns, handled.";
