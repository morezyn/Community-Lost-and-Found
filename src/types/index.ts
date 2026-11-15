import type { Timestamp } from "firebase/firestore";

/* ------------------------------------------------------------------ */
/* Shared unions                                                       */
/* ------------------------------------------------------------------ */

export type Role = "user" | "moderator" | "admin";
export type ReportType = "lost" | "found" | "incident";
export type ReportStatus = "pending" | "approved" | "rejected" | "resolved";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type CategoryRequestStatus = "pending" | "approved" | "rejected";

export const ROLES: readonly Role[] = ["user", "moderator", "admin"];
export const REPORT_TYPES: readonly ReportType[] = ["lost", "found", "incident"];
export const REPORT_STATUSES: readonly ReportStatus[] = [
  "pending",
  "approved",
  "rejected",
  "resolved",
];

/* ------------------------------------------------------------------ */
/* Firestore documents                                                 */
/* ------------------------------------------------------------------ */

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: Role;
  disabled: boolean;
  createdAt: Timestamp;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  /**
   * Assigned by a moderator when the report is approved. Null while the report
   * is pending (or rejected) - users no longer pick a category themselves.
   */
  categoryId: string | null;
  /** Denormalized for display - avoids an extra read per card. */
  categoryName: string | null;
  locationText: string;
  coordinates: { lat: number; lng: number } | null;
  /** Date the item was lost/found or the incident occurred. */
  eventDate: Timestamp;
  images: string[];
  imagePaths: string[];
  status: ReportStatus;
  rejectionReason: string | null;
  /**
   * Public verification question for found items (e.g. "What is engraved on
   * the back?"). The matching answer lives in the private sub-document:
   * `reports/{reportId}/private/details`.
   */
  verificationQuestion: string | null;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  commentCount: number;
  /** Lowercased title/description words used for basic array-contains search. */
  searchTokens: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt: Timestamp | null;
}

/**
 * `reports/{reportId}/private/details` - readable only by the report author
 * and moderators/admins. Kept out of the public report doc because Firestore
 * document reads are all-or-nothing.
 */
export interface ReportPrivateDetails {
  verificationAnswer: string | null;
}

export interface Comment {
  id: string;
  reportId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  hidden: boolean;
  createdAt: Timestamp;
}

export interface Claim {
  id: string;
  reportId: string;
  reportTitle: string;
  reportAuthorId: string;
  claimantId: string;
  claimantName: string;
  answer: string;
  proofDescription: string;
  proofImageUrl: string | null;
  status: ClaimStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: Timestamp;
  reviewedAt: Timestamp | null;
}

export interface Category {
  id: string;
  name: string;
  /** Which report types can use this category. */
  appliesTo: ReportType[];
  active: boolean;
}

/**
 * `categoryRequests/{requestId}` - a moderator's proposal for a new category.
 *
 * Moderators cannot write the `categories` collection, so they file a request
 * instead; approving it creates the category (see lib/firebase/categoryRequests).
 */
export interface CategoryRequest {
  id: string;
  name: string;
  appliesTo: ReportType[];
  /** Why the category is needed. Optional on submit, required on rejection. */
  note: string | null;
  status: CategoryRequestStatus;
  requestedBy: string;
  requesterName: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  /** Set when an admin approves the request and the category is created. */
  categoryId: string | null;
  createdAt: Timestamp;
  reviewedAt: Timestamp | null;
}

export type NotificationType =
  | "report_approved"
  | "report_rejected"
  | "claim_received"
  | "claim_approved"
  | "claim_rejected"
  | "new_comment"
  | "category_request"
  | "category_request_approved"
  | "category_request_rejected";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  /** In-app route, e.g. `/reports/abc123`. */
  link: string;
  read: boolean;
  createdAt: Timestamp;
}

/** Public, client-readable config document at `config/app`. */
export interface AppConfig {
  requireApproval: boolean;
}

/* ------------------------------------------------------------------ */
/* UI / form helpers                                                   */
/* ------------------------------------------------------------------ */

export interface ReportFilters {
  types: ReportType[];
  categoryId: string | null;
  /** "all" = approved + resolved (everything publicly visible). */
  status: ReportStatus | "all";
  search: string;
  location: string;
  /** ISO date strings (yyyy-MM-dd) used by <input type="date">. */
  dateFrom: string;
  dateTo: string;
  sort: "newest" | "oldest";
}

export interface ReportFormValues {
  type: ReportType;
  title: string;
  description: string;
  categoryId: string;
  locationText: string;
  eventDate: string;
  verificationQuestion: string;
  verificationAnswer: string;
}

export interface ClaimFormValues {
  answer: string;
  proofDescription: string;
}

export interface CommentFormValues {
  text: string;
}

/** A report together with the images staged in the create form. */
export interface PendingImage {
  file: File;
  previewUrl: string;
}
