# SECURITY.md: Security Requirements for FindIt (Lost & Found / Community Reporting Platform)

> Security specification for opencode. Read together with `AGENTS.md` (features/data) and `DESIGN.md` (UI).
> **Security requirements in this file override convenience.** If a feature in `AGENTS.md` cannot be built securely as written, build the secure version and leave a `// SECURITY:` comment explaining why.
> Never weaken a rule, header, or validation just to make something work. Fix the root cause instead.

---

## 1. Security Goals

1. **Only the right people can do the right things.** Enforce roles (guest, user, moderator, admin) on the server side (Firestore rules and server code), never only in the UI.
2. **Protect personal data.** Contact details, verification answers, emails, and private claim details must never leak to unauthorized users.
3. **Resist abuse.** Spam, fake claims, scraping, upload abuse, and quota exhaustion must be limited.
4. **Resist common web attacks.** XSS, CSRF, injection, clickjacking, IDOR, open redirects, and insecure uploads.
5. **Fail safely.** Deny by default, and never reveal internals in error messages.
6. **Be auditable.** Sensitive actions are logged so abuse can be investigated.

---

## 2. Threat Model

| Threat / Attacker | Example | Primary Defenses |
|---|---|---|
| Anonymous visitor | Scraping all reports, reading private data | Firestore rules, rate limiting, App Check |
| Malicious registered user | Editing someone else's report, escalating to admin, fake claims | Ownership checks in rules, role immutability, claim rules |
| Spammer / bot | Mass-creating accounts and posts | App Check + reCAPTCHA, rate limits, email verification |
| Thief posing as owner | Claiming a found item that isn't theirs | Hidden verification question, private details doc, manual review |
| XSS attacker | Script in title/description/comment | React escaping, no `dangerouslySetInnerHTML`, CSP, sanitization |
| Upload abuser | Huge or malicious files, quota drain on Cloudinary | Type/size limits, preset restrictions, server-signed uploads |
| Credential attacker | Brute force, credential stuffing, phishing | Firebase Auth protections, verified email, strong passwords |
| Insider / compromised moderator | Abusing moderation powers | Least privilege, audit logs, admin-only role changes |
| Supply chain | Malicious npm package | Lockfile, `npm audit`, minimal dependencies, Dependabot |
| Secret leakage | Admin keys committed to GitHub | `.gitignore`, env vars, secret scanning |

---

## 3. Secrets & Configuration

### 3.1 What is public vs. secret

| Value | Public? | Notes |
|---|---|---|
| Firebase web config (`NEXT_PUBLIC_FIREBASE_*`) | **Public by design** | Safe to expose. Protection comes from Security Rules, App Check, and API key restrictions, **not** from hiding it |
| Cloudinary cloud name + unsigned preset name | Public | Protect by locking down the preset (section 7) |
| Firebase **Admin SDK service account** | **SECRET** | Server only. Never in the client bundle, never committed |
| Cloudinary **API secret** | **SECRET** | Server only (no `NEXT_PUBLIC_` prefix) |
| reCAPTCHA **secret key** | **SECRET** | Server only |

### 3.2 Rules
- Never prefix a secret with `NEXT_PUBLIC_`. Anything with that prefix ships to every browser.
- `.env.local` and `*.json` service account files must be in `.gitignore`. Provide `.env.local.example` with empty values only.
- Never log secrets, tokens, or full request bodies.
- Store production secrets in **Vercel Environment Variables** (mark sensitive ones as such). Use separate Firebase projects (or at least separate config) for `development` and `production`.
- Enable **GitHub secret scanning** and push protection on the repository.
- If a secret is ever committed: **rotate it immediately**, then remove it from history. Removing the commit alone is not enough.

`.gitignore` must include:
```
.env
.env.*
!.env.local.example
*.pem
service-account*.json
firebase-adminsdk*.json
.firebase/
.vercel/
```

### 3.3 Firebase API key restrictions
In Google Cloud Console → APIs & Services → Credentials, restrict the browser API key:
- **Application restrictions:** HTTP referrers, allowing only your production domain, preview domain pattern, and `localhost` for development.
- **API restrictions:** limit to the APIs actually used (Identity Toolkit, Firestore, Firebase Installations, etc.).

---

## 4. Authentication Security

- Use **Firebase Authentication** only. Never build custom password storage or session crypto.
- **Email verification required** before a user can create reports, comments, or claims (enforced in Firestore rules via `request.auth.token.email_verified == true`, not just in the UI).
- Enforce a **minimum password length of 8+** characters (Firebase default is 6; validate 8+ with Zod on the client and enable password policy in Firebase Authentication settings if available).
- Enable **Firebase Authentication email enumeration protection** so login/reset flows don't reveal whether an email exists.
- Show **generic error messages**: "Invalid email or password," never "email not found."
- **Rate limiting / lockout:** Firebase throttles repeated failed sign-ins; additionally add a short client-side delay after failures.
- Google sign-in: restrict authorized domains in Firebase Authentication settings to your real domains only.
- Sign-out must clear client state and unsubscribe all Firestore listeners.
- Disabled users (`users/{uid}.disabled == true`) must be blocked by Firestore rules from creating or editing content.
- Never trust the role from the client. Roles come from Firestore (`users/{uid}.role`) read in rules, or preferably **Firebase custom claims** (see 5.3).
- If sessions are ever moved to server-side (cookies), cookies must be `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`), with a short lifetime.

---

## 5. Authorization & Firestore Security Rules

Firestore rules are your real backend security. The client is untrusted: anyone can open DevTools and call Firestore with your public config. **Every permission must be enforced here.**

### 5.1 Principles
1. **Deny by default.** End the rules with an explicit catch-all deny.
2. **Validate data shape, not just identity**: required fields, types, string lengths, enum values, array sizes.
3. **Immutable fields stay immutable** (`authorId`, `createdAt`, `role`, `type`).
4. **Prevent privilege escalation:** users must never be able to set `role`, `status: "approved"`, or `disabled`.
5. **No client-trusted counters or notifications** where abuse matters (see 5.4).
6. Test the rules with the **Firebase Emulator** and automated tests before deploying.

### 5.2 Baseline Rules (adapt to the final data model)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ---------- Helpers ----------
    function signedIn() { return request.auth != null; }
    function uid() { return request.auth.uid; }
    function verified() { return signedIn() && request.auth.token.email_verified == true; }
    function userDoc() { return get(/databases/$(database)/documents/users/$(uid())).data; }
    function role() { return signedIn() ? userDoc().role : "guest"; }
    function isActive() { return signedIn() && userDoc().disabled == false; }
    function isMod() { return isActive() && (role() == "moderator" || role() == "admin"); }
    function isAdmin() { return isActive() && role() == "admin"; }
    function isOwner(id) { return signedIn() && uid() == id; }

    function validStr(v, min, max) { return v is string && v.size() >= min && v.size() <= max; }

    // ---------- Users ----------
    match /users/{userId} {
      allow read: if isOwner(userId) || isMod();
      // Created once at first sign-in; must start as a normal, enabled user
      allow create: if isOwner(userId)
        && request.resource.data.role == "user"
        && request.resource.data.disabled == false
        && request.resource.data.uid == userId;
      // Users may change display info only. Role/disabled are admin-only.
      allow update: if (isOwner(userId)
          && request.resource.data.role == resource.data.role
          && request.resource.data.disabled == resource.data.disabled
          && request.resource.data.uid == resource.data.uid)
        || isAdmin();
      allow delete: if isAdmin();
    }

    // ---------- Reports ----------
    match /reports/{reportId} {
      allow read: if resource.data.status in ["approved", "resolved"]
        || (signedIn() && resource.data.authorId == uid())
        || isMod();

      allow create: if verified() && isActive()
        && request.resource.data.authorId == uid()
        && request.resource.data.type in ["lost", "found", "incident"]
        && validStr(request.resource.data.title, 3, 120)
        && validStr(request.resource.data.description, 10, 2000)
        && request.resource.data.images.size() <= 4
        && request.resource.data.status == (isMod() ? request.resource.data.status : "pending")
        && request.resource.data.commentCount == 0;

      allow update: if isActive() && (
        // Author: edit content or mark resolved. Cannot change owner, type, or approve themselves.
        (resource.data.authorId == uid()
          && request.resource.data.authorId == resource.data.authorId
          && request.resource.data.type == resource.data.type
          && request.resource.data.status in [resource.data.status, "resolved"]
          && request.resource.data.images.size() <= 4)
        // Moderators/admins: change status
        || isMod()
      );

      allow delete: if isActive() && (resource.data.authorId == uid() || isAdmin());

      // Private data (verification answer): author and mods only
      match /private/{docId} {
        allow read, write: if isActive()
          && (get(/databases/$(database)/documents/reports/$(reportId)).data.authorId == uid() || isMod());
      }

      // ---------- Comments ----------
      match /comments/{commentId} {
        allow read: if resource.data.hidden == false || isMod();
        allow create: if verified() && isActive()
          && request.resource.data.authorId == uid()
          && validStr(request.resource.data.text, 1, 500)
          && request.resource.data.hidden == false;
        allow update: if isMod();
        allow delete: if isActive() && (resource.data.authorId == uid() || isMod());
      }
    }

    // ---------- Claims ----------
    match /claims/{claimId} {
      allow read: if signedIn() && (
        resource.data.claimantId == uid()
        || resource.data.reportAuthorId == uid()
        || isMod());
      allow create: if verified() && isActive()
        && request.resource.data.claimantId == uid()
        && request.resource.data.reportAuthorId != uid()   // cannot claim own item
        && request.resource.data.status == "pending"
        && validStr(request.resource.data.answer, 1, 500)
        && validStr(request.resource.data.proofDescription, 0, 1000);
      allow update: if isActive()
        && (resource.data.reportAuthorId == uid() || isMod())
        && request.resource.data.claimantId == resource.data.claimantId;
      allow delete: if isAdmin();
    }

    // ---------- Categories ----------
    match /categories/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // ---------- Notifications ----------
    match /notifications/{id} {
      allow read: if signedIn() && resource.data.userId == uid();
      // Recipients can only flip the "read" flag
      allow update: if signedIn() && resource.data.userId == uid()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["read"]);
      allow create: if false;   // created server-side only (see 5.4)
      allow delete: if signedIn() && resource.data.userId == uid();
    }

    // ---------- Default deny ----------
    match /{document=**} { allow read, write: if false; }
  }
}
```

> Treat the above as a **starting point**. Test every rule with the emulator. Adjust to the final field names, and keep the final rules in `firestore.rules`.

### 5.3 Roles: prefer custom claims (hardening upgrade)
Reading `users/{uid}` inside rules costs an extra read per request and relies on that doc being untampered. A stronger approach:
- Store role as a **Firebase custom claim** (`request.auth.token.role`), set only by a trusted server route using the **Admin SDK**.
- Admin role changes happen via a protected Next.js route handler that verifies the caller's ID token and checks they are an admin before calling `setCustomUserClaims`.
- After a role change, force the target user's token refresh.

### 5.4 Server-side actions for sensitive operations
Some things should not be trusted to client code. Implement these as **Next.js Route Handlers / Server Actions using the Firebase Admin SDK**, each verifying the caller's Firebase ID token first:

| Operation | Why server-side |
|---|---|
| Creating notifications | Prevents users forging notifications to others |
| Changing user roles / disabling accounts | Privilege escalation risk |
| Approving a claim (sets report to resolved + notifies both parties) | Multi-document consistency + authorization |
| Maintaining `commentCount` | Prevents tampering (or accept it as cosmetic and never rely on it for logic) |
| Signing Cloudinary uploads | Needs API secret (section 7) |
| Deleting Cloudinary images | Needs API secret |

Server route checklist:
1. Extract `Authorization: Bearer <idToken>`.
2. `adminAuth.verifyIdToken(token)`. Reject with `401` if invalid.
3. Load the user's role; reject with `403` if not permitted.
4. Validate the body with **Zod**. Reject with `400` on failure.
5. Perform the action. Return minimal data. Log the event (section 12).

### 5.5 IDOR (Insecure Direct Object Reference) prevention
- Never assume that knowing an ID (report, claim, user) grants access. Every read/write path must be gated by rules or by server checks.
- Pages like `/reports/[id]/edit` must verify ownership server-side (rules) **and** redirect in the UI.
- Never expose another user's email, phone, UID lists, or role in public documents. Public `authorName`/`authorPhotoURL` only.

---

## 6. Input Validation & Output Encoding (XSS, Injection)

- Validate **every** input with **Zod** on the client (UX) **and** re-validate on any server route (security). Firestore rules provide a third layer.
- Limits: title 3-120, description 10-2000, comment 1-500, location 2-200, max 4 images.
- **Never use `dangerouslySetInnerHTML`** with user content. React escapes output by default. Keep it that way.
- Do not render user-provided URLs as links without validating the scheme (allow only `https:`/`http:`; block `javascript:` and `data:`).
- Strip or reject control characters and excessive whitespace. Trim all strings.
- If rich text is ever added, sanitize with **DOMPurify** (allowlist of tags). Not needed for the MVP (plain text only).
- Firestore is NoSQL, but still **never build queries from raw unvalidated input** (e.g., user-controlled field names). Only use allowlisted filter/sort fields.
- Search tokens: lowercase, alphanumeric only, limited count (e.g., max 20 tokens).
- Treat everything from the URL (`searchParams`, route params) as untrusted. Validate and clamp (`limit`, `page`, enums).
- **Open redirect protection:** any `?redirect=` / `?next=` parameter must be validated as a relative path starting with a single `/` (reject `//`, `http:`, `\`).

---

## 7. File Upload Security (Cloudinary)

Photos are the biggest abuse surface. Apply all of the following.

### 7.1 Baseline: Unsigned preset hardening (MVP)
In Cloudinary → Settings → Upload → Upload presets (unsigned):
- **Allowed formats:** `jpg, jpeg, png, webp` only. No SVG (SVG can carry scripts), no PDF, no GIF unless required.
- **Folder** locked (e.g., `findit/reports`) and **use_filename off / unique filename on** so users can't overwrite assets.
- **Max file size** set on the preset (e.g., 5 MB) and **max image dimensions** (incoming transformation: limit to ~2000px).
- Enable **auto-moderation** (Cloudinary add-on, e.g., AWS Rekognition / WebPurify) if available, to flag explicit content.
- **Strip metadata** (EXIF, including GPS location) from stored images via an eager/incoming transformation. Users' photos often contain their home location.
- Set **allowed upload domains/referrers** where Cloudinary supports it, and enable **usage alerts/quotas** so abuse doesn't silently drain the account.
- Do **not** allow `overwrite` and do not enable "unsafe" arbitrary transformations on delivery (enable **strict transformations** and only allow named transformations).

### 7.2 Client-side checks (UX only, not security)
- Check `file.type` and `file.size` before upload and show friendly errors.
- Verify the **magic bytes** (file signature) of the file client-side as an extra check, since `file.type` can be spoofed.
- Limit to 4 files per report. Compress large images client-side before upload if possible.

### 7.3 Recommended hardening: signed uploads
Unsigned presets let anyone who finds the preset name upload to your account. For stronger security:
1. Create a route handler `POST /api/cloudinary/sign` that:
   - verifies the Firebase ID token and `email_verified`,
   - rate limits per user (e.g., 20 uploads/hour),
   - generates a signature with the Cloudinary API secret for fixed params (folder, timestamp, allowed formats).
2. The client uploads directly to Cloudinary using the returned signature, timestamp, and API key.
3. Switch the preset to **Signed** and remove the unsigned one.

### 7.4 Deletion
- Deleting images requires the API secret, so do it only in a server route that confirms the caller owns the report (or is an admin). When a report is deleted, delete its images server-side.

### 7.5 Delivery
- Only allow `res.cloudinary.com` in `next.config.mjs` `images.remotePatterns` and in the CSP `img-src`.
- Always store `secure_url` (https).

---

## 8. HTTP Security Headers & CSP

Add to `next.config.mjs`:

```js
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }, // needed for Google sign-in popup
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
export default nextConfig;
```

### Content Security Policy
Implement a CSP (via `next.config.mjs` headers or middleware with nonces). Start in **report-only mode**, fix violations, then enforce. A baseline for this stack:

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com;
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.cloudinary.com wss://*.firebaseio.com;
frame-src https://*.firebaseapp.com https://accounts.google.com https://www.google.com/recaptcha/;
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```
> `'unsafe-inline'` for scripts is a compromise for Next.js and Firebase auth. If time permits, move to **nonce-based CSP** via middleware to remove it. If fonts are loaded with `next/font`, the Google Fonts entries may be unnecessary.

---

## 9. Abuse Prevention (Spam, Bots, Rate Limiting)

### 9.1 Firebase App Check (required for production)
- Enable **App Check with reCAPTCHA v3 (or Enterprise)** for the web app.
- **Enforce** App Check for Firestore (and Authentication if available). This blocks requests that don't come from your real site, which stops most scripted abuse using your public config.
- Use the **debug token** only in local development and never commit it.

### 9.2 Rate limits
Firestore rules can't count requests, so use layered controls:
- **Server routes:** per-user and per-IP rate limiting with **Upstash Redis + `@upstash/ratelimit`** (free tier works on Vercel). Suggested limits:
  - Sign-up/sign-in helpers: 10 / 10 min / IP
  - Cloudinary sign endpoint: 20 / hour / user
  - Claims: 5 / hour / user
  - Reports: 10 / day / user (new accounts: 3 / day)
- **Firestore rules throttle trick:** store `lastPostAt` on the user doc and require `request.time > resource.data.lastPostAt + duration.value(30, 's')` for creating reports/comments.
- Send **429** with a `Retry-After` header when limited.

### 9.3 Content abuse
- New accounts start with posting limits until email verified.
- Add a **Report/Flag** button on reports and comments. Flags go to the moderation queue.
- Moderators can hide content and disable users. Admin can delete content.
- Optional: simple profanity/keyword filter and duplicate-post detection (same title + author within 24 hours).

### 9.4 Fake claims & privacy
- The **verification answer** lives only in `reports/{id}/private/details`, never in the public document or API responses.
- A claim never reveals the correct answer to the claimant (approve/reject only).
- Limit **one active claim per user per report**; limit total claims per user per day.
- Contact between users happens **in-app only**. Never display email or phone numbers publicly.
- Advise users in the UI **not to post sensitive documents** (IDs, cards) in public photos; for found IDs/cards, require a **blurred/cropped image** and hide key details. Show a warning banner when category is "Documents/IDs".

---

## 10. Privacy & Data Protection

- **Data minimization:** collect only what's needed (name, email, optional avatar). No phone/address fields unless essential.
- **No PII in public documents.** Public report docs contain only display name and avatar.
- **Strip image EXIF/GPS** (7.1) and don't store precise home coordinates. Round map coordinates (e.g., 3 decimals) or use an approximate area.
- Provide **"Delete my account"** in profile: removes the user doc, anonymizes or deletes their reports/comments, and deletes their Cloudinary images (server route).
- Add **Privacy Policy** and **Terms of Use** pages describing data usage, moderation, and retention.
- Do not send user data to third parties other than Firebase and Cloudinary. No analytics or trackers without disclosure.
- Philippine context: be mindful of the **Data Privacy Act of 2012 (RA 10173)**: collect with consent, protect data, and allow deletion.

---

## 11. Dependency & Supply Chain Security

- Commit `package-lock.json`; use `npm ci` in CI and deployment.
- Run `npm audit` regularly and fix high/critical issues.
- Enable **Dependabot** (or Renovate) for security updates.
- Keep dependencies **minimal**; avoid abandoned or obscure packages. Check download counts, maintainers, and last publish date before adding one.
- Pin major versions; review changelogs for Next.js and Firebase SDK upgrades.
- Never `curl | bash` installers or run untrusted scripts in the project.
- Keep **Node.js** and **Next.js** on supported, patched versions.

---

## 12. Logging, Monitoring & Audit Trail

- Create an `auditLogs` collection (write via server routes only; read by admin only) recording: role changes, account disable/enable, report approvals/rejections, claim decisions, content deletions, and failed authorization attempts.
  - Fields: `actorId`, `action`, `targetType`, `targetId`, `timestamp`, `ipHash` (hashed, not raw IP), `metadata` (no secrets).
- Admin dashboard section to view recent audit events.
- Never log passwords, tokens, API secrets, or full personal data.
- Monitor in **Firebase Console** (Auth, Firestore usage) and **Vercel** (logs, errors). Set **budget alerts** in Google Cloud and **usage alerts** in Cloudinary to detect abuse early.
- Optional: add **Sentry** for error tracking (scrub PII).

---

## 13. Error Handling

- Show **generic, user-friendly messages** to users ("Something went wrong. Please try again.").
- Log details server-side only. Never return stack traces, Firebase error internals, or file paths to the client.
- Use Next.js `error.tsx` and `not-found.tsx` boundaries.
- Return consistent status codes from server routes: `400` invalid input, `401` unauthenticated, `403` forbidden, `404` not found, `429` rate limited, `500` generic failure.
- Do **not** reveal whether a resource exists to unauthorized users when that would leak info (e.g., return `404` for a pending report the user can't see, not `403`).

---

## 14. CSRF, CORS & Related Web Attacks

- With Firebase client SDK + bearer ID tokens in headers (not cookies), classic CSRF risk is low. If cookies are ever used for sessions, use `SameSite` cookies and CSRF tokens on state-changing requests.
- Server route handlers: accept only the expected HTTP methods; reject others with `405`. Require `Content-Type: application/json` and validate the `Origin` header against your allowed origins for state-changing requests.
- **CORS:** don't enable wildcard CORS (`*`) on API routes. Allow only your own origin.
- **Clickjacking:** `frame-ancestors 'none'` and `X-Frame-Options: DENY` (section 8).
- **Tabnabbing:** any `target="_blank"` link must include `rel="noopener noreferrer"`.
- **Open redirects:** see section 6.
- **Prototype pollution / mass assignment:** never spread raw request bodies into Firestore writes. Pick allowlisted fields explicitly after Zod validation.
- **SSRF:** server routes must never fetch URLs supplied by users.

---

## 15. Deployment & Infrastructure Security

- Deploy on **Vercel** over **HTTPS only** with HSTS enabled (section 8).
- Enable **Vercel deployment protection** for preview deployments (password or Vercel Auth) so previews with real data aren't public.
- Production and development use **separate Firebase projects** (or at minimum, separate rules/data).
- Deploy rules and indexes with `firebase deploy --only firestore:rules,firestore:indexes`. Always review rule diffs before deploying.
- **Firebase Authentication → Settings → Authorized domains:** only your production domain, Vercel domain, and localhost.
- Restrict who has Owner/Editor access in the Firebase/Google Cloud project. Use **2-Step Verification** on every account that can access Firebase, Vercel, Cloudinary, and GitHub.
- Enable **branch protection** on `main` and require pull request review where possible.
- Keep **backups**: schedule Firestore exports (managed backups) if the data matters beyond the demo.

---

## 16. Security Testing

### Automated
- **Firestore Emulator rule tests** (`@firebase/rules-unit-testing`) covering at minimum:
  - Guest cannot read `pending`/`rejected` reports
  - User cannot create a report with `status: "approved"` or another user's `authorId`
  - User cannot update `role`, `disabled`, or `authorId`
  - User cannot read another user's claims or private details
  - User cannot claim their own report
  - Non-moderator cannot change report status or hide comments
  - Unverified email cannot create content
  - Disabled user cannot write anything
  - Notification creation from the client is denied
  - Unknown collections are denied
- `npm run lint`, `npx tsc --noEmit`, `npm audit` in CI.

### Manual checks before the presentation
- [ ] Try editing/deleting another user's report from the browser console. It must fail.
- [ ] Try setting your own `role` to `admin` through the console. It must fail.
- [ ] Open a pending report URL in an incognito window. It must not load.
- [ ] Post `<script>alert(1)</script>` as a title and comment. It must display as plain text.
- [ ] Upload a `.svg`, `.exe`, or oversized file. It must be rejected.
- [ ] Hammer the sign-up/claim endpoints. Rate limiting must kick in.
- [ ] Inspect the page source and network tab. No secrets (API secrets, service accounts) appear.
- [ ] Run [securityheaders.com](https://securityheaders.com) and Mozilla Observatory against the deployed site.
- [ ] Run `npm audit` and confirm there are no high/critical findings.

---

## 17. Incident Response (Simple Plan)

1. **Detect:** unusual usage spike, user report, or alert.
2. **Contain:** disable the affected account(s) (admin panel), temporarily tighten rules or enable maintenance mode, turn off the Cloudinary preset if upload abuse is occurring.
3. **Rotate:** if any secret may be exposed, rotate Firebase service account keys, Cloudinary API secret, and reCAPTCHA keys immediately, then redeploy.
4. **Investigate:** review `auditLogs`, Vercel logs, and Firebase usage.
5. **Recover:** remove malicious content, restore from backup if needed.
6. **Learn:** document what happened and add a rule/test so it can't recur.

---

## 18. Responsible Disclosure

Add a `/security` page and a short note in the README:
- How to report a vulnerability (a contact email, e.g., `security@yourdomain` or the maintainer's email).
- Ask reporters not to access other users' data, and not to run destructive tests.
- Commit to acknowledging reports within a few days.

---

## 19. Implementation Order (Security Phases for the Agent)

Integrate these alongside the phases in `AGENTS.md`:

| When | Security work |
|---|---|
| **Phase 1** | `.gitignore`, `.env.local.example`, secret handling, `next.config.mjs` security headers (CSP in report-only) |
| **Phase 2** | Auth hardening: email verification gate, generic errors, safe redirect handling, Zod password rules |
| **Phase 3** | Zod validation everywhere, upload validation, Cloudinary preset restrictions, no `dangerouslySetInnerHTML` |
| **Phase 4-5** | Server routes (Admin SDK) for notifications and claim approval, rate limiting, private details doc |
| **Phase 6-7** | Role management via server route/custom claims, audit logs, flag/report-abuse feature |
| **Phase 8** | Final Firestore rules + emulator tests, App Check enforcement, enforce CSP, run manual security checks |
| **Phase 9** | Vercel env vars, preview protection, authorized domains, key restrictions, security headers scan, `/security` page |

---

## 20. Instructions to the Agent (opencode)

1. **Never** put secrets in client code, `NEXT_PUBLIC_` variables, or Git.
2. **Never** rely on UI checks for authorization. Every protected action needs a Firestore rule or server-side check.
3. **Never** use `dangerouslySetInnerHTML`, `eval`, or `new Function` with user-influenced data.
4. Validate with Zod at every boundary, and use allowlisted fields when writing to Firestore.
5. Keep Firebase Admin SDK code in server-only files (`import "server-only"`) so it can't leak into the client bundle.
6. When unsure whether something is safe, choose the more restrictive option and add a `// SECURITY:` comment.
7. After each phase, list any security-relevant decisions and open items (for example, "rate limiting not yet added").
8. Do not disable ESLint/TypeScript checks, lower rule strictness, or add `'unsafe-eval'` to the CSP to silence errors. Fix the cause.
9. Flag to the user any requirement in this file that you could not implement and why.
