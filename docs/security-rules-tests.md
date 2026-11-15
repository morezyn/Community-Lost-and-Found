# Security rules — scenarios checked

This document lists the access-control scenarios the Firestore rules in
`firestore.rules` are written to satisfy. Run them against the Firebase Emulator
with two or three seeded accounts (`admin`, `moderator`, `user`) plus an
anonymous client.

Photo uploads moved to Cloudinary, so there are no Storage-rule scenarios left;
the upload/delete API routes are covered in the last section.

## Setup

```bash
npm i -g firebase-tools        # or use npx firebase-tools@latest
firebase login
firebase emulators:start --only auth,firestore
```

Point the app at the emulators while testing:

```ts
// temporary: src/lib/firebase/client.ts, top of file
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";

connectAuthEmulator(getFirebaseAuth(), "http://127.0.0.1:9099");
connectFirestoreEmulator(getFirebaseDb(), "127.0.0.1", 8080);
```

## `users/{uid}`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 1 | Read own profile | member | allow |
| 2 | Read someone else's profile | member | deny |
| 3 | Read any profile | moderator / admin | allow |
| 4 | Create own profile with `role: "user"` | new user | allow |
| 5 | Create own profile with `role: "admin"` | new user | deny |
| 6 | Update own `displayName` / `photoURL` | member | allow |
| 7 | Update own `role` | member | deny |
| 8 | Update own `role` (self-promotion) | admin | deny |
| 9 | Change another user's `role` / `disabled` | admin | allow |
| 10 | Disable own account | admin | deny |
| 11 | Delete a user | admin | allow |
| 12 | Delete own user doc | member | deny |

## `reports/{reportId}`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 13 | Read `approved` / `resolved` report | guest | allow |
| 14 | Read `pending` / `rejected` report | guest, other member | deny |
| 15 | Read own `pending` report | author | allow |
| 16 | Read any report | moderator / admin | allow |
| 17 | Create report with `status: "pending"` and verified email | member | allow |
| 18 | Create report with unverified email | member | deny |
| 18b | Create report with unverified email on the demo allowlist | `user@findit.demo` | allow |
| 19 | Create report with `authorId` of someone else | member | deny |
| 20 | Create report with `status: "approved"` | member | deny |
| 21 | Create report with `status: "approved"` | moderator / admin | allow |
| 22 | Create report with 5 images | member | deny |
| 23 | Create report containing `verificationAnswer` on the public doc | member | deny |
| 24 | Update own report content fields | author | allow |
| 25 | Change `authorId` | author | deny |
| 26 | Set own report to `resolved` | author | allow |
| 27 | Approve / reject a report | moderator / admin | allow |
| 28 | Approve / reject a report | member | deny |
| 29 | Increment `commentCount` by +1 (posting a comment) | verified member | allow |
| 30 | Change `commentCount` by +5 | any member | deny |
| 31 | Delete own report | author | allow |
| 32 | Delete another member's report | member | deny |
| 33 | Delete any report | admin | allow |
| 33a | Create `pending` report with `categoryId`/`categoryName` = `null` | member | allow |
| 33b | Create report with `status: "approved"` and no category | moderator / admin | deny |
| 33c | Set `categoryId` / `categoryName` on own report | author | deny |
| 33d | Change the category of any report | moderator / admin | allow |
| 33e | Approve a report without assigning a category | moderator | deny |

## `reports/{reportId}/private/details`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 34 | Read verification answer | report author | allow |
| 35 | Read verification answer | moderator / admin | allow |
| 36 | Read verification answer | anyone else, guest | deny |
| 37 | Write verification answer | report author | allow |
| 38 | Write verification answer | non-author | deny |

## `reports/{reportId}/comments`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 39 | Read non-hidden comments | guest | allow |
| 40 | Read hidden comment | member | deny |
| 41 | Read hidden comment | moderator / admin | allow |
| 42 | Create comment as self, 1–500 chars | verified member | allow |
| 43 | Create comment as another user (`authorId` spoofed) | member | deny |
| 44 | Create 501-character comment | member | deny |
| 45 | Create comment with `hidden: true` | member | deny |
| 46 | Hide / restore a comment | moderator / admin | allow |
| 47 | Hide a comment | member | deny |
| 48 | Edit comment text | anyone | deny |
| 49 | Delete own comment | author | allow |
| 50 | Delete another member's comment | member | deny |

## `claims/{claimId}`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 51 | Create a claim on someone else's `approved` found report | verified member | allow |
| 52 | Claim your own report | author | deny |
| 53 | Claim a `lost` report | member | deny |
| 54 | Claim a `pending` / `resolved` report | member | deny |
| 55 | Create claim with unverified email | member | deny |
| 56 | Read own claim | claimant | allow |
| 57 | Read claim on your report | report author | allow |
| 58 | Read any claim | moderator / admin | allow |
| 59 | Read someone else's claim | unrelated member | deny |
| 60 | Approve / reject claim | report author | allow |
| 61 | Approve / reject claim | moderator / admin | allow |
| 62 | Approve / reject claim | claimant | deny |
| 63 | Change claim `claimantId` | anyone | deny |

## `categories/{categoryId}`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 64 | Read categories | guest | allow |
| 65 | Create / update / delete category | admin | allow |
| 66 | Create / update / delete category | moderator, member | deny |

## `notifications/{notificationId}`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 67 | Read own notification | recipient | allow |
| 68 | Read someone else's notification | member | deny |
| 69 | Create notification for another user (allowed event type) | member | allow |
| 70 | Create notification for yourself | member | deny |
| 71 | Create notification with `read: true` | member | deny |
| 72 | Create notification with an unknown `type` | member | deny |
| 73 | Update `read` flag | recipient | allow |
| 74 | Update `message` | recipient | deny |

## `config/app`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 75 | Read app config | guest | allow |
| 76 | Write app config | admin | allow |
| 77 | Write app config | moderator, member | deny |

## Cloudinary API routes (`/api/cloudinary/*`)

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 78 | Request an upload signature | signed-in member | allow |
| 79 | Request an upload signature | guest | 401 |
| 80 | Request a signature with `reportId` containing `../` | member | 400 |
| 81 | Upload 6 MB image | member | rejected client-side |
| 82 | Upload a PDF / SVG | member | rejected client-side |
| 83 | Destroy own `findit/{uid}/…` public id | owner | deleted |
| 84 | Destroy another user's public id | member | ignored (not deleted) |
| 85 | Call either route with an invalid ID token | anyone | 401 |

## `categoryRequests/{requestId}`

| # | Scenario | Actor | Expected |
|---|---|---|---|
| 86 | Read own category request | requester (moderator) | allow |
| 87 | Read a category request | admin | allow |
| 88 | Read someone else's request | other moderator, member, guest | deny |
| 89 | Create a `pending` request for self with valid name/appliesTo | moderator | allow |
| 90 | Create a category request | member | deny |
| 91 | Create a request with someone else's `requestedBy` | moderator | deny |
| 92 | Create a request that is already `approved` | moderator | deny |
| 93 | Approve / reject a request | admin | allow |
| 94 | Approve a request without a `categoryId` | admin | deny |
| 95 | Set the request status | moderator | deny |
| 96 | Withdraw own `pending` request | requester | allow |
| 97 | Withdraw someone else's request | moderator | deny |
| 98 | Delete any request (cleanup) | admin | allow |

## Notes / known trade-offs

- Notifications are created client-side (no Cloud Functions in this build). The
  rules restrict shape, event type, and forbid self-notification, but a
  determined client could still send a notification to an arbitrary user. That
  is accepted for the demo; a Cloud Function or callable is the production fix.
- `commentCount` is maintained by clients, so rules only allow ±1 increments.
  A moderator can still force any value because `isMod()` bypasses the author
  branch — acceptable for moderation tooling.
- Collection-group reads for comments are allowed so moderators can list hidden
  comments across reports; non-moderators can only read non-hidden ones.
