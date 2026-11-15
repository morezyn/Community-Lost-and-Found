# Lost & Found / Community Reporting Platform

> Project specification and agent instructions for opencode.
> Read this file fully before writing any code. Follow the conventions, build order, and constraints below.

---

## 1. Project Overview

**Name:** FindIt (working title; can be renamed)

**Purpose:** A web platform where community members (students, residents, employees) can:
1. Report **lost items** and **found items**
2. Report **community incidents/concerns** (e.g., broken lights, hazards, suspicious activity)
3. Browse, search, and filter reports
4. Claim found items through a verified claim process
5. Communicate through comments

Admins/moderators review reports, verify claims, manage categories, and view analytics.

**Context:** This is a school presentation project. It must be demo-friendly, finish-able in a short time, and showcase: authentication with roles, a real-time feature, file uploads, a dashboard with charts, TypeScript type safety, and live deployment.

---

## 2. Tech Stack (Required)

| Layer | Choice |
|---|---|
| Framework | **Next.js 14+ (App Router)** |
| Language | **TypeScript** (strict mode, no `any`) |
| Database | **Firebase Firestore** |
| Auth | **Firebase Authentication** (Email/Password + Google) |
| File storage | **Firebase Storage** (item/incident photos) |
| Styling | **Tailwind CSS** |
| UI components | **shadcn/ui** (optional but preferred) |
| Forms & validation | **React Hook Form + Zod** |
| Charts | **Recharts** |
| Icons | **lucide-react** |
| Notifications/toasts | **sonner** |
| Date handling | **date-fns** |
| Deployment | **Vercel** |

Do not introduce other major dependencies without a clear reason. Prefer the above.

---

## 3. User Roles & Permissions

| Role | Capabilities |
|---|---|
| **guest** (not logged in) | Browse and search public reports (read-only). Cannot comment, claim, or post. |
| **user** | Create/edit/delete own reports, comment, submit claims, mark own report as resolved, manage own profile. |
| **moderator** | Everything a user can do, plus: approve/reject pending reports, hide inappropriate comments, review claims, request new categories (admin approval required). |
| **admin** | Everything a moderator can do, plus: manage users and roles, manage categories, view analytics dashboard, delete any content. |

Role is stored in `users/{uid}.role` and enforced in **Firestore Security Rules** and in UI route guards. Never trust the client alone.

---

## 4. Core Features

### 4.1 Authentication
- Sign up / sign in with email + password and Google
- Email verification prompt (non-blocking for browsing, required for posting)
- Password reset
- Persisted session, auth context provider
- New accounts default to role `user`

### 4.2 Reports (Lost, Found, Incident)
A single `reports` collection with a `type` field: `lost | found | incident`.

Fields users fill in:
- Title, description
- ~~Category~~ — **not chosen by the reporter.** A moderator assigns the category during review (e.g., Electronics, Documents/IDs, Bags, Keys, Clothing, Pets, Other; incident categories: Safety, Infrastructure, Sanitation, Noise, Other)
- Location (text + optional pin on map coordinates)
- Date lost/found/occurred
- Up to 4 photos (max 5 MB each, JPEG/PNG/WebP)
- Contact preference (in-app only by default; do not expose email/phone publicly)
- For `found` items: optional "hidden detail" field (a verification question only the real owner would know, never shown publicly)

Status lifecycle:
```
pending -> approved -> resolved
        \-> rejected
```
- New reports start as `pending` (moderator approval) OR `approved` if the author is a moderator/admin. (Make this a config flag: `REQUIRE_APPROVAL`.)
- Only `approved` and `resolved` reports are publicly visible.
- Author can mark their report `resolved` (item returned / issue fixed).

### 4.3 Browse, Search & Filter
- Report feed with cards (image, title, type badge, category, location, date, status)
- Filters: type, category, status, date range, location keyword
- Text search on title and description (client-side filter over a fetched page is acceptable; note the limitation in comments, and optionally add a `searchTokens: string[]` array field for `array-contains` queries)
- Sort: newest first (default), oldest
- Pagination via Firestore cursors (`startAfter`) with "Load more" button
- Report detail page with image gallery, details, comments, and claim/resolve actions

### 4.4 Claim System (for found items)
1. A logged-in user clicks **"This is mine"** on a `found` report.
2. User answers the verification question and provides proof description (optional photo).
3. Claim is created with status `pending`.
4. The report author or a moderator reviews and sets the claim to `approved` or `rejected`.
5. On approval, the report becomes `resolved` and both parties are notified in-app.

Rules:
- A user cannot claim their own report.
- A user can have only one active (pending) claim per report.
- The hidden verification detail is only visible to the report author and moderators/admins.

### 4.5 Comments
- Subcollection `reports/{reportId}/comments`
- **Real-time** updates using `onSnapshot`
- Users can delete their own comments; moderators/admins can hide any

### 4.6 Real-Time Features (Demo Highlights)
- Live comment thread on report detail pages
- Live status badge updates on report cards (when moderator approves/resolves)
- Live notification bell with unread count

### 4.7 Notifications (In-App)
Collection `notifications` for events:
- Your report was approved/rejected
- Someone claimed your found item
- Your claim was approved/rejected
- New comment on your report

Bell icon in navbar with unread count, dropdown list, mark as read.

### 4.8 Moderation Panel (moderator + admin)
- Queue of `pending` reports with approve/reject (with rejection reason); approving requires picking the category (reports can be re-filed later)
- Pending claims list
- Reported/hidden comments list
- Category requests: moderators propose new categories from the **Categories** tab; only admins can approve/reject them (approval creates the category)

### 4.9 Admin Dashboard
- Stat cards: total reports, lost vs found vs incident, resolved rate, active users
- Charts (Recharts):
  - Reports over time (line, last 30 days)
  - Reports by category (bar)
  - Lost vs Found vs Incident (pie/donut)
  - Resolution rate (progress/radial)
- User management table: change role, disable account
- Category management (add/edit/disable)

### 4.10 User Profile & "My Reports"
- Edit display name and avatar
- Tabs: My Reports, My Claims, Notifications
- Edit/delete own reports (only while `pending` or `approved`)

---

## 5. Firestore Data Model

Use these as the canonical TypeScript interfaces in `src/types/`. Use Firestore `Timestamp` on the wire and convert as needed.

```ts
// src/types/index.ts
import type { Timestamp } from "firebase/firestore";

export type Role = "user" | "moderator" | "admin";
export type ReportType = "lost" | "found" | "incident";
export type ReportStatus = "pending" | "approved" | "rejected" | "resolved";
export type ClaimStatus = "pending" | "approved" | "rejected";

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
  categoryId: string | null;     // null while pending - set by a moderator
  categoryName: string | null;   // denormalized for display
  locationText: string;
  coordinates: { lat: number; lng: number } | null;
  eventDate: Timestamp;          // date lost/found/occurred
  images: string[];              // Storage download URLs
  imagePaths: string[];          // Storage paths (for deletion)
  status: ReportStatus;
  rejectionReason: string | null;
  verificationQuestion: string | null; // found items only
  verificationAnswer: string | null;   // never exposed publicly (see section 6)
  authorId: string;
  authorName: string;            // denormalized
  authorPhotoURL: string | null;
  commentCount: number;
  searchTokens: string[];        // lowercased title words for basic search
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt: Timestamp | null;
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
  appliesTo: ReportType[];       // which report types can use it
  active: boolean;
}

export type CategoryRequestStatus = "pending" | "approved" | "rejected";

/** Moderator proposal for a new category; admins approve and create it. */
export interface CategoryRequest {
  id: string;
  name: string;
  appliesTo: ReportType[];
  note: string | null;           // reason, optional on submit
  status: CategoryRequestStatus;
  requestedBy: string;
  requesterName: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  categoryId: string | null;     // set on approval
  createdAt: Timestamp;
  reviewedAt: Timestamp | null;
}

export interface AppNotification {
  id: string;
  userId: string;                // recipient
  type:
    | "report_approved"
    | "report_rejected"
    | "claim_received"
    | "claim_approved"
    | "claim_rejected"
    | "new_comment"
    | "category_request"
    | "category_request_approved"
    | "category_request_rejected";
  message: string;
  link: string;                  // in-app route
  read: boolean;
  createdAt: Timestamp;
}
```

### Collections
```
users/{uid}
reports/{reportId}
reports/{reportId}/comments/{commentId}
reports/{reportId}/private/details      // verificationAnswer lives here, NOT on the public doc
claims/{claimId}
categories/{categoryId}
categoryRequests/{requestId}            // moderator proposals, admin-approved
notifications/{notificationId}
```

> **Important:** Because Firestore documents are all-or-nothing readable, store `verificationAnswer` in the `reports/{reportId}/private/details` doc, readable only by the author and moderators/admins. Remove `verificationAnswer` from the public `Report` document. Update the interface accordingly when implementing.

### Recommended Composite Indexes
- `reports`: `status` ASC + `createdAt` DESC
- `reports`: `type` ASC + `status` ASC + `createdAt` DESC
- `reports`: `categoryId` ASC + `status` ASC + `createdAt` DESC
- `reports`: `authorId` ASC + `createdAt` DESC
- `claims`: `reportAuthorId` ASC + `status` ASC + `createdAt` DESC
- `categoryRequests`: `requestedBy` ASC + `createdAt` DESC
- `categoryRequests`: `status` ASC + `createdAt` ASC
- `notifications`: `userId` ASC + `read` ASC + `createdAt` DESC

Document the required indexes in `firestore.indexes.json`.

---

## 6. Security Rules (Firestore + Storage)

Write rules in `firestore.rules` and `storage.rules`. Requirements:

**Firestore**
- Helper functions: `isSignedIn()`, `isOwner(uid)`, `role()`, `isMod()`, `isAdmin()`
- `users/{uid}`: read own doc, mods/admins read any; user can update own profile fields but **cannot change `role`**; only admin can change `role`/`disabled`
- `reports`:
  - Read: `approved`/`resolved` reports are public; `pending`/`rejected` readable by author and mods/admins
  - Create: signed in, email verified, `authorId == request.auth.uid`, status must be `pending` (or `approved` for mods/admins), field validation (title length, type enum, images <= 4). `categoryId`/`categoryName` may be `null` only while `pending` — anything approved/resolved must carry a category
  - Update: author may edit content fields and set `resolved`, but **may not touch `categoryId`/`categoryName`**; mods/admins assign the category and change `status`, and may not publish an uncategorized report; no one may change `authorId`
  - Delete: author or admin
- `reports/{id}/private/details`: read/write only by report author and mods/admins
- `comments`: public read when not hidden; create when signed in with `authorId == uid` and text length 1-500; author can delete own; mods can set `hidden`
- `claims`: create by signed-in non-author; read by claimant, report author, mods/admins; update status only by report author or mods/admins
- `categories`: public read; write admin only
- `categoryRequests`: create by mods/admins for their own uid, `pending` only; read by requester and admins; approve/reject by admin only (approval must carry the created `categoryId`); requester may delete while pending, admin may delete any
- `notifications`: read/update (`read` flag only) by recipient; create via client only for allowed event types (or move to a Cloud Function if time permits)

**Storage**
- Path: `reports/{uid}/{reportId}/{filename}`
- Write: owner only, image content types, max 5 MB
- Read: public

Add a short `docs/security-rules-tests.md` listing the scenarios checked (ideally tested with the Firebase Emulator).

---

## 7. Project Structure

```
.
├── AGENTS.md
├── README.md
├── .env.local.example
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── public/
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                      # landing + latest reports
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   └── forgot-password/page.tsx
    │   ├── reports/
    │   │   ├── page.tsx                  # browse/search/filter
    │   │   ├── new/page.tsx              # create report
    │   │   └── [id]/
    │   │       ├── page.tsx              # detail + comments + claim
    │   │       └── edit/page.tsx
    │   ├── profile/page.tsx              # my reports, claims, settings
    │   ├── moderation/page.tsx           # mod + admin
    │   ├── admin/
    │   │   ├── page.tsx                  # dashboard + charts
    │   │   ├── users/page.tsx
    │   │   └── categories/page.tsx
    │   └── not-found.tsx
    ├── components/
    │   ├── ui/                           # shadcn components
    │   ├── layout/ (Navbar, Footer, NotificationBell, RouteGuard)
    │   ├── reports/ (ReportCard, ReportForm, ReportFilters, ReportGallery, StatusBadge)
    │   ├── comments/ (CommentList, CommentForm)F
    │   ├── claims/ (ClaimDialog, ClaimReviewCard)
    │   ├── categories/ (CategoryRequestDialog, ModerationCategories)
    │   └── charts/ (ReportsOverTime, ByCategory, TypeBreakdown)
    ├── lib/
    │   ├── firebase/
    │   │   ├── client.ts                 # initializeApp, auth, db, storage
    │   │   ├── auth.ts                   # sign in/up/out helpers
    │   │   ├── reports.ts                # CRUD + queries
    │   │   ├── comments.ts
    │   │   ├── claims.ts
    │   │   ├── notifications.ts
    │   │   ├── categories.ts
    │   │   ├── categoryRequests.ts        # moderator proposals -> admin approval
    │   │   └── storage.ts                # upload/delete images
    │   ├── validators/                   # Zod schemas
    │   ├── utils.ts
    │   └── constants.ts
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useReports.ts
    │   ├── useComments.ts                # onSnapshot
    │   └── useNotifications.ts           # onSnapshot
    ├── context/
    │   └── AuthContext.tsx
    └── types/
        └── index.ts
```

---

## 8. Environment Variables

`.env.local.example` (never commit real values):
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_REQUIRE_APPROVAL=true
```

---

## 9. UI / UX Guidelines

- Clean, modern, mobile-first responsive layout
- Consistent color coding for report types: **Lost = red/orange**, **Found = green**, **Incident = blue/amber**
- Status badges: pending (gray), approved (green), rejected (red), resolved (purple)
- Loading skeletons for feeds and detail pages
- Empty states with helpful messages and calls to action
- Toast feedback for every create/update/delete action
- Form errors shown inline under fields (from Zod)
- Dark mode support (optional, nice to have)
- Accessible: labels on inputs, alt text on images, keyboard navigable dialogs

---

## 10. Coding Conventions

- TypeScript `strict: true`; **no `any`**, use `unknown` + narrowing where needed
- Use Server Components by default; add `"use client"` only where hooks, Firebase client SDK, or interactivity are required
- Keep Firebase calls inside `src/lib/firebase/*`; components never call Firestore directly
- All user input validated with Zod before writing to Firestore
- Use path alias `@/*` for `src/*`
- Function components with explicit prop types; name files in PascalCase for components, camelCase for utilities
- Handle and surface errors (try/catch with user-friendly toasts); never swallow errors silently
- Convert Firestore `Timestamp` to `Date` at the UI boundary with a helper
- Unsubscribe all `onSnapshot` listeners in `useEffect` cleanup
- Keep components small and focused; extract repeated UI into shared components
- Add brief comments for non-obvious logic (queries, rules, transactions)
- Run `npm run lint` and `npx tsc --noEmit` before considering a phase done

---

## 11. Build Order (Phased Plan)

Complete each phase fully and make sure it runs before starting the next.

**Phase 1: Setup**
1. Scaffold Next.js (App Router, TypeScript, Tailwind, ESLint, `src/` dir)
2. Install dependencies (firebase, react-hook-form, zod, @hookform/resolvers, recharts, lucide-react, sonner, date-fns, shadcn/ui)
3. Create Firebase client config and `.env.local.example`
4. Define all types in `src/types/index.ts`

**Phase 2: Auth & Roles**
1. AuthContext + `useAuth`
2. Register, login (email + Google), logout, forgot password
3. Create `users/{uid}` doc on first sign-in with role `user`
4. `RouteGuard` component for protected, moderator, and admin routes
5. Navbar showing auth state and role-aware links

**Phase 3: Reports (Core)**
1. Image upload helper (validate type/size, upload, return URL + path)
2. `ReportForm` (create) with Zod validation and image previews
3. Seed default categories
4. Reports feed with cards, filters, sorting, and cursor pagination
5. Report detail page with gallery
6. Edit/delete own report, mark as resolved

**Phase 4: Real-Time Comments**
1. `useComments` with `onSnapshot`
2. Comment form, delete own comment
3. Maintain `commentCount` on the report

**Phase 5: Claims & Notifications**
1. Claim dialog for found items (verification question flow, private details doc)
2. Claim review UI for report author and moderators
3. Notification creation helpers for each event
4. Notification bell with real-time unread count

**Phase 6: Moderation**
1. Pending reports queue with approve/reject (reason required for reject)
2. Pending claims overview
3. Hide/unhide comments

**Phase 7: Admin Dashboard**
1. Stat cards and Recharts visualizations
2. User management (role change, disable)
3. Category management

**Phase 8: Security & Polish**
1. Write and test Firestore + Storage rules (emulator)
2. Add composite indexes file
3. Loading/empty/error states everywhere
4. Responsive and accessibility pass
5. Seed script or manual seed data for demo

**Phase 9: Deployment & Docs**
1. Deploy to Vercel with env vars
2. `firebase deploy --only firestore:rules,firestore:indexes,storage`
3. Write README (setup, env vars, scripts, demo accounts, screenshots)

---

## 12. Demo Readiness Checklist (Presentation)

Prepare these so the live demo goes smoothly:

- [ ] 3 demo accounts: `admin`, `moderator`, `user` (credentials in README, not in code)
- [ ] 10-15 seeded reports with photos across all three types and categories
- [ ] Real-time demo plan: two browser windows, post a comment in one and watch it appear in the other
- [ ] Moderation demo: submit a report as user, approve it as moderator, show live status change and notification
- [ ] Claim flow demo: claim a found item, approve it, show the report become `resolved`
- [ ] Admin dashboard populated with meaningful chart data
- [ ] Live Vercel URL working on mobile as well as desktop
- [ ] Slide talking points ready: architecture diagram, data model, security rules, TypeScript type safety, role-based access

---

## 13. Out of Scope (Do Not Build Unless Asked)

- Payments or monetization
- Native mobile apps
- AI image matching or auto-matching lost/found (can be mentioned as future work)
- Real-time chat between users (use comments + in-app notifications instead)
- Email/SMS delivery (in-app notifications only, unless Cloud Functions time permits)

---

## 14. Future Improvements (Mention in Presentation)

- Map view with clustered pins (Google Maps / Leaflet)
- Automatic lost/found match suggestions based on category, date, and keywords
- Push notifications (Firebase Cloud Messaging)
- Cloud Functions for notification fan-out and image moderation
- Multi-language support (English/Filipino)
- Algolia or Typesense for full-text search

---

## 15. Instructions to the Agent (opencode)

1. Start with **Phase 1** and proceed in order. After each phase, summarize what was built and what to test.
2. Ask before making any decision that changes the data model, adds a major dependency, or deviates from this spec.
3. Never hardcode secrets; use environment variables.
4. Keep the app runnable at the end of every phase (`npm run dev` must work, no TypeScript errors).
5. If a requirement is ambiguous, choose the simplest approach that satisfies the demo goals and leave a short `// NOTE:` comment explaining the choice.
6. Prefer clarity and correctness over cleverness; this code will be explained live in a presentation.
