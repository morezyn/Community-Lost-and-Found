# FindIt — Lost &amp; Found + Community Reporting

A community platform where people report **lost items**, **found items**, and
**community incidents**, talk to each other in real time, and hand found items
back through a verified claim flow. Built with Next.js 15 (App Router),
TypeScript, Firebase (Auth / Firestore), Cloudinary for photo uploads, Tailwind
CSS v4, React Hook Form + Zod, and Recharts.

> ELEC4 finals project. Roles: guest, member, moderator, admin.

---

## Features

- **Auth** — email/password and Google sign-in, email verification prompt,
  password reset, persisted session, role-aware navigation.
- **Reports** — one `reports` collection for `lost | found | incident`, up to 4
  photos (5 MB each), location, event date, optional hidden verification
  question for found items. Members do **not** pick a category: a moderator
  assigns one when approving, so the browse filters and charts stay clean.
- **Moderation** — pending queue with approve/reject + reason, pending claims,
  hidden comments. Approving asks for the category (required); published
  reports can be re-filed later. New reports from members start as `pending`
  (configurable). Moderators can also **request a new category**; the request
  appears in the admin queue and becomes a real category only when approved.
- **Browse &amp; search** — type / category / status / location / date filters,
  debounced text search, cursor pagination (`startAfter`), newest/oldest sort.
- **Real-time** — live comment threads, live report status badges, live
  notification bell with unread count, and email-verification state that flips
  without a reload (verified in another tab → the banner clears within seconds).
  All listeners unsubscribe on unmount.
- **Claims &amp; found reports** — two directions in one flow. On a *found* post
  the owner clicks “This is mine”; on a *lost* post whoever finds the item
  clicks “I found this” and tells the owner where it is. The report author (or a
  moderator) reviews each response; approval resolves the report and rejects the
  competing ones atomically.
- **Admin** — stat cards, reports-over-time line chart, by-category bar chart,
  type breakdown donut, resolution radial chart, member management (role +
  disable), category management (create / edit / disable / seed), the
  moderator category-request queue, and one-click demo seeding. The admin area
  shares a **Dashboard / Members / Categories** sub-nav.
- **UX** — dark mode, loading skeletons, empty states, toast feedback, inline
  Zod errors, keyboard-accessible dialogs, mobile-first layout.

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.local.example .env.local      # Windows: copy .env.local.example .env.local
# then fill in the values from your Firebase project

# 3. Run
npm run dev
```

Open <http://localhost:3000>. While the Firebase env vars are empty the app
renders normally and shows a setup banner instead of throwing SDK errors.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## Environment variables

`.env.local` (never committed — only `.env.local.example` is):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_REQUIRE_APPROVAL=true

# Cloudinary (server-only — never add the NEXT_PUBLIC_ prefix)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

`NEXT_PUBLIC_REQUIRE_APPROVAL` controls the copy shown in the UI. The **real**
switch lives in the Firestore document `config/app.requireApproval`, because
rules cannot read environment variables. The admin **Seed default categories**
action writes `config/app` from this env value, so the two stay in sync.

`CLOUDINARY_*` never reach the browser. They are read only inside
`/api/cloudinary/sign` and `/api/cloudinary/destroy`.

`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is kept because it is part of the standard
Firebase web config, but the app no longer uses Firebase Storage.

---

## Firebase setup

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication** → enable **Email/Password** and **Google**.
3. **Firestore Database** → create in production mode, then deploy the rules
   below (or paste them into the console).
4. Add a Web app to the project and copy its config keys into `.env.local`.
5. Deploy rules and indexes:

```bash
npm i -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore:rules,firestore:indexes
```

6. Sign up as the first account, then in **Firestore → users → your uid** set
   `role` to `"admin"`.
7. Open **/admin** and click **Seed default categories**, then **Seed demo
   reports**. This also writes `config/app` and gives the dashboard data.

> Firebase Storage is **not** required — the project runs on the free Spark plan.

### Photo uploads (Cloudinary)

Report photos are stored in Cloudinary instead of Firebase Storage, which keeps
the whole project on the free plan.

1. Create a free account at <https://cloudinary.com> and note the **cloud name**,
   **API key**, and **API secret** from the dashboard.
2. Put them in `.env.local` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and
   `CLOUDINARY_API_SECRET` (server-only — never `NEXT_PUBLIC_`).
3. That's it. The browser asks `/api/cloudinary/sign` for a short-lived
   signature, then uploads **directly** to Cloudinary:

```
browser ──(Bearer ID token)──▶ /api/cloudinary/sign ──(api_secret)──▶ signature
   └──(file + signature)──────────────────────────────────────────▶ Cloudinary
```

Assets land in `findit/{uid}/{reportId}/`. `report.imagePaths` holds the
Cloudinary `public_id`s so edits and deletions can remove the files through
`/api/cloudinary/destroy`, which only accepts ids inside the caller's own
folder. Uploading directly to Cloudinary also avoids Vercel's 4.5 MB
request-body limit, so the full 5 MB per photo works in production.

> Demo photos are stable `picsum.photos` URLs, so the seeder needs no uploads.

### Demo accounts

The three accounts below exist in Firebase Auth. Their addresses have no real
inbox, so rather than being verified they are **allowlisted** in
`firestore.rules` (`isDemoAccount()`) and treated as verified: the demo logins
can post reports, comments, claims, and notifications while every other account
still has to verify its email. Their roles come from the `users/{uid}` documents.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@findit.demo` | `FindIt123!` |
| Moderator | `moderator@findit.demo` | `FindIt123!` |
| Member | `user@findit.demo` | `FindIt123!` |

> The allowlist is a closed list of these exact addresses — `isDemoAccount()` in
> `firestore.rules`, mirrored by `DEMO_ACCOUNT_EMAILS` in
> `src/lib/constants.ts`. It is deliberately not a domain wildcard.
>
> These are *demo* credentials for the presentation only — they are not created
> by code and not committed to any environment file.

---

## Project structure

```
src/
├── app/                    # routes (App Router)
│   ├── (auth)/             # login, register, forgot-password
│   ├── reports/            # feed, new, [id], [id]/edit
│   ├── profile/            # my reports, claims, notifications, settings
│   ├── moderation/         # moderator + admin queue
│   └── admin/              # dashboard, users, categories
├── components/
│   ├── ui/                 # shadcn-style primitives (Radix + cva)
│   ├── layout/             # Navbar, Footer, RouteGuard, NotificationBell…
│   ├── reports/            # card, form, filters, gallery, detail
│   ├── comments/           # real-time list + form
│   ├── claims/             # claim dialog + review card
│   └── charts/             # Recharts wrappers
├── context/AuthContext.tsx # Firebase user + Firestore profile (role)
├── hooks/                  # useAuth, useReports, useComments, useNotifications
├── lib/
│   ├── firebase/           # client, auth, reports, comments, claims, …
│   ├── cloudinary.ts       # client-side upload/delete helpers
│   ├── cloudinary-server.ts# signatures + ID-token verification
│   ├── validators/         # Zod schemas
│   ├── constants.ts        # type/status/role metadata, defaults
│   └── utils.ts            # cn, dates, search tokens, errors
└── types/index.ts          # canonical Firestore interfaces
```

API routes live in `src/app/api/cloudinary/{sign,destroy}/route.ts`.

**Rule of thumb:** components never touch Firestore directly — all reads and
writes live in `src/lib/firebase/*`. Auth context is the only place that
subscribes to the `users` document.

---

## Data model

```
users/{uid}
reports/{reportId}
reports/{reportId}/comments/{commentId}
reports/{reportId}/private/details      # verificationAnswer only
claims/{claimId}
categories/{categoryId}
categoryRequests/{requestId}            # moderator proposals, admin-approved
notifications/{notificationId}
config/app                              # { requireApproval: boolean }
```

Key decisions:

- `verificationAnswer` is **not** on the public report document. Firestore
  document reads are all-or-nothing, so it lives in
  `reports/{id}/private/details`, readable only by the author and mods/admins.
- `categoryName`, `authorName`, `authorPhotoURL`, and `commentCount` are
  denormalized for cheap card rendering (writes update them in one batch where
  it matters). `categoryId` / `categoryName` are `null` while a report is
  pending — the rules require both to be strings once it is published.
- `searchTokens` holds lowercased title/description/location words for a future
  `array-contains` query. Today search runs client-side over the fetched page —
  documented in `src/lib/firebase/reports.ts`.
- `categories` is admin-only, so moderators propose changes through
  `categoryRequests`: they can create a `pending` request for their own uid and
  withdraw it while pending. Only an admin can move it to `approved`/`rejected`,
  and approving writes the category document in the same batch as the status
  change — a half-approved request cannot exist.
- Report status: `pending → approved → resolved`, or `pending → rejected`.
- `images` holds Cloudinary `secure_url`s; `imagePaths` holds the matching
  `public_id`s (used for deletion, never rendered).

---

## Security rules

`firestore.rules` is the real enforcement layer; the client `RouteGuard` is UX
only.

- Helpers: `isSignedIn()`, `isOwner(uid)`, `isVerified()`, `role()`, `isMod()`,
  `isAdmin()`, `canAutoApprove()`.
- Members can only edit `displayName`/`photoURL` on their own profile; roles and
  the `disabled` flag are admin-only, and admins cannot demote/disable
  themselves.
- Publishing (`status: "approved"` on create) is limited to mods/admins, or to
  members when `config/app.requireApproval == false`.
- Claims can only be created by verified non-authors against an `approved`
  `found` or `lost` report (`reportType` on the claim must match), and only the
  report author or a mod/admin can review them.
- `categories` is admin-write-only. Moderators file `categoryRequests` for their
  own uid (`pending` only) and may withdraw them while pending; admins alone set
  `approved`/`rejected`, and approval must include the created `categoryId`.
- Photo ownership is enforced server-side: `/api/cloudinary/destroy` refuses
  public ids outside `findit/{uid}/`.

`docs/security-rules-tests.md` lists the emulator scenarios (access matrix) that
the rules are written to satisfy.

### Composite indexes

`firestore.indexes.json` includes the recommended indexes: status+createdAt,
status+type+createdAt, status+categoryId+createdAt, authorId+createdAt,
claims by report/claimant/author, category requests by requester/status,
notifications by user, moderation queues.

---

## Real-time demo plan

1. Open the same report in two browser windows (one signed in as member A, one
   as member B), post a comment in one — it appears instantly in the other.
2. Moderator approves a pending report from **/moderation** while the author
   watches the report page: the status badge flips to **Approved** live and a
   notification lands in the author's bell.
3. Member claims a found item → the finder approves the claim → the report
   becomes **Resolved** and the competing claims are rejected in one batch.
4. Reverse direction: on a **lost** post, a second member clicks **I found this**,
   the owner gets a notification, approves it, and the lost post becomes
   **Resolved**.
5. Moderator requests a category from **/moderation → Categories** → it appears
   instantly in **/admin/categories** for the admin; approving it creates the
   category and the moderator gets a notification.

---

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add every `NEXT_PUBLIC_FIREBASE_*` variable, `NEXT_PUBLIC_REQUIRE_APPROVAL`,
   and the three `CLOUDINARY_*` variables in **Project → Settings → Environment
   Variables**. `CLOUDINARY_API_SECRET` must stay server-side (no
   `NEXT_PUBLIC_` prefix) — the API routes read it at runtime.
4. In Firebase **Authentication → Settings → Authorized domains**, add your
   Vercel domain (and preview domains) so Google sign-in popups work.
5. Deploy. Rules/indexes are deployed separately with the Firebase CLI.

---

## Out of scope / future work

- Map view with clustered pins, automatic lost/found matching, push
  notifications, Cloud Functions for notification fan-out and image moderation,
  multi-language (English/Filipino), Algolia/Typesense search.
