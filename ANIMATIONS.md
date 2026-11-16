# ANIMATIONS.md: Motion & Animation Guide for FindIt (Lost & Found / Community Reporting Platform)

> Motion specification for opencode. Read together with `AGENTS.md` (features), `DESIGN.md` (visual style), and `SECURITY.md` (security).
> Motion supports the design. It never blocks the user, hides content, or slows the app down.
> If this file conflicts with `DESIGN.md` on visual style, `DESIGN.md` wins. On accessibility and performance, **this file wins**.
>
> **Scope: desktop website only.** Animations run only on desktop-size screens (viewport 1024px and wider). On phones and tablets (below 1024px) the site has **no animations or transitions**: everything appears instantly. See section 1A.

---

## 1. Motion Philosophy

The design language is **calm, warm, and premium** (inspired by the Pebble Flow site). Motion should feel the same:

- **Gentle, not flashy.** Soft fades, small upward drifts, slow image scaling. No bouncing, spinning, shaking, or parallax overload.
- **Purposeful.** Every animation must do one of these: guide attention, show a state change, give feedback, or smooth a transition. If it does none, remove it.
- **Fast.** UI feedback is quick (150-250ms). Only large, one-time reveals take longer (up to ~700ms).
- **Consistent.** Reuse the same durations and easings everywhere (section 3).
- **Accessible.** Respect `prefers-reduced-motion`. Nothing essential depends on animation.
- **Cheap.** Animate only `transform` and `opacity`. Smooth 60fps on a mid-range laptop.

**Mood keywords:** smooth, soft, unhurried, confident, polished.

---

## 1A. Platform Scope: Desktop Website Only

This animation system is **for the desktop website only. It does not apply to mobile.**

- **Enabled:** viewport width **1024px and up** (Tailwind `lg` breakpoint), and only when the user has not enabled `prefers-reduced-motion`.
- **Disabled:** everything below 1024px (phones and most tablets). Menus, dialogs, sheets, tabs, accordions, toasts, cards, and lists simply appear, change, and disappear **instantly**. No reveals, no hover/press effects, no page transitions, no count-ups, no chart animation, no confetti, no bell wiggle.
- This is a responsive website, not a native mobile app. Nothing here targets React Native or app-style gestures.

### How to enforce it (two layers, use both)

1. **Prefix every animation and transition utility with `lg:`.**
   Examples: `lg:animate-fade-up`, `lg:transition-transform lg:duration-slow lg:ease-out-soft`, `lg:hover:-translate-y-1`, `lg:data-[state=open]:animate-in`.
   An unprefixed `animate-*` or `transition-*` class is a bug.
2. **Global safety net in CSS** (section 4.2) that switches off any remaining motion below 1024px, so a missed prefix can never animate on mobile.
3. **JS-driven motion** must be gated by the `useMotionEnabled()` hook (section 6.3). It returns `true` only at 1024px+ **and** when reduced motion is off. `Reveal`, `CountUp`, parallax, Recharts animation, the bell wiggle, confetti, and carousel arrow effects all check it.

### Exceptions (functional, kept on mobile)
- **Loading spinners** (`Loader2` with `animate-spin`) stay, because they tell the user something is in progress. Give them the class `motion-essential` so the safety net skips them.
- **Native swipe scrolling** in carousels (CSS scroll-snap) stays, since it is normal browser behavior, not an added animation.
- Skeleton placeholders stay on mobile but are **static** (no shimmer).

### Mobile rules
- Mobile always gets the **final state immediately**. Never hide content waiting for an animation to play.
- State changes on mobile are still communicated with color, text, and icons (for example, the new status badge simply appears).
- Resizing the window across 1024px must switch behavior cleanly (the hook listens for changes).

---

## 2. Tooling

### 2.1 Default approach (use this first)
- **CSS transitions + Tailwind utilities** (`transition`, `duration-*`, `ease-*`, `hover:`, `group-hover:`)
- **Tailwind keyframes** defined in `tailwind.config.ts` (section 4)
- A tiny **`<Reveal>`** component using `IntersectionObserver` for scroll reveals (section 6)
- **`tailwindcss-animate`** (comes with shadcn/ui) for dialogs, dropdowns, sheets, accordions, and toasts

### 2.2 Optional library: `motion` (the Framer Motion successor)
Allowed **only** for things CSS handles poorly:
- Animated list reordering / items entering and leaving (comments, notifications, report grid filtering)
- Shared layout transitions (tab underline/pill sliding)
- Animated number counters
- Page transitions (optional)

If used:
- `npm install motion`, import from `motion/react`
- Use **`LazyMotion` with `domAnimation`** and the `m` component to keep the bundle small
- Mark animated components `"use client"`
- Do **not** add GSAP, Lottie, anime.js, or other animation libraries without asking the user

### 2.3 Rules
- Server Components stay free of animation logic. Wrap animated pieces in small client components.
- Never animate layout properties (`width`, `height`, `top`, `left`, `margin`) on frequently updated elements. Use `transform`. (Accordion height animation is the one allowed exception, done via CSS grid trick or Radix's built-in height variable.)
- Never use `will-change` globally. Apply it temporarily only to elements actively animating.

---

## 3. Motion Tokens

### 3.1 Durations

| Token | Value | Use |
|---|---|---|
| `instant` | 100ms | Button press, checkbox, tiny state flips |
| `fast` | 150ms | Hover color/background changes, icon swaps |
| `base` | 250ms | Dropdowns, tabs, accordions, toasts, dialogs |
| `slow` | 400ms | Card/image hover scale, carousel slide, sheets |
| `reveal` | 600-700ms | Scroll reveals, hero entrance |

### 3.2 Easings

| Token | Value | Use |
|---|---|---|
| `ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | **Default for almost everything** (entrances, reveals, hover) |
| `ease-in-out-soft` | `cubic-bezier(0.65, 0, 0.35, 1)` | Moves between two visible states (tab indicator, carousel) |
| `ease-in-soft` | `cubic-bezier(0.55, 0, 1, 0.45)` | Exits (leaving elements) |
| `linear` | `linear` | Only for progress bars and loading shimmer |

Exits are **faster** than entrances (about 70% of the duration).

### 3.3 Distances & Scales
- Reveal drift: `translateY(24px)` (desktop only)
- Hover lift (cards): `translateY(-4px)`
- Image hover zoom: `scale(1.05)`, never more than `1.08`
- Button press: `scale(0.97)`
- Dialog entrance: from `scale(0.96)` + fade
- Stagger step: `70ms` between siblings, cap total stagger at ~500ms (so large lists don't take forever)

---

## 4. Tailwind & Global CSS Setup

### 4.1 `tailwind.config.ts` additions

```ts
// inside theme.extend
transitionTimingFunction: {
  "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
  "in-out-soft": "cubic-bezier(0.65, 0, 0.35, 1)",
  "in-soft": "cubic-bezier(0.55, 0, 1, 0.45)",
},
transitionDuration: {
  instant: "100ms",
  fast: "150ms",
  base: "250ms",
  slow: "400ms",
  reveal: "650ms",
},
keyframes: {
  "fade-up": {
    "0%": { opacity: "0", transform: "translateY(24px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  "fade-in": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  "scale-in": {
    "0%": { opacity: "0", transform: "scale(0.96)" },
    "100%": { opacity: "1", transform: "scale(1)" },
  },
  "slide-down": {
    "0%": { opacity: "0", transform: "translateY(-8px)" },
    "100%": { opacity: "1", transform: "translateY(0)" },
  },
  shimmer: {
    "0%": { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
  "pulse-ring": {
    "0%": { boxShadow: "0 0 0 0 rgba(242,120,75,0.45)" },
    "100%": { boxShadow: "0 0 0 10px rgba(242,120,75,0)" },
  },
  "highlight-flash": {
    "0%": { backgroundColor: "rgba(242,120,75,0.18)" },
    "100%": { backgroundColor: "transparent" },
  },
  "badge-pop": {
    "0%": { transform: "scale(0.6)", opacity: "0" },
    "60%": { transform: "scale(1.08)", opacity: "1" },
    "100%": { transform: "scale(1)" },
  },
},
animation: {
  "fade-up": "fade-up 650ms cubic-bezier(0.22,1,0.36,1) both",
  "fade-in": "fade-in 400ms ease-out both",
  "scale-in": "scale-in 250ms cubic-bezier(0.22,1,0.36,1) both",
  "slide-down": "slide-down 250ms cubic-bezier(0.22,1,0.36,1) both",
  shimmer: "shimmer 1.6s linear infinite",
  "pulse-ring": "pulse-ring 1.2s ease-out 1",
  "highlight-flash": "highlight-flash 1.8s ease-out 1",
  "badge-pop": "badge-pop 350ms cubic-bezier(0.22,1,0.36,1) both",
},
```

### 4.2 `globals.css`: reduced motion and helpers

```css
/* Safety net: NO motion on mobile/tablet (below 1024px) or when the user
   prefers reduced motion. Functional spinners opt out with .motion-essential */
@media (max-width: 1023.98px), (prefers-reduced-motion: reduce) {
  *:not(.motion-essential),
  *:not(.motion-essential)::before,
  *:not(.motion-essential)::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
}

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface, #E6E1D3) 25%,
    var(--card, #F7F5EF) 50%,
    var(--surface, #E6E1D3) 75%
  );
  background-size: 200% 100%;
}

/* Smooth anchor scrolling: desktop only, and not for reduced motion */
@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
```

---

## 5. Core Animation Patterns

### 5.1 Hover & Press (buttons, links, cards)
- **Buttons:** `transition-colors duration-fast ease-out-soft`, plus `active:scale-[0.97] transition-transform duration-instant`. The accent button gets a slightly darker background on hover (no glow or bounce).
- **Links:** underline slides in from the left using a pseudo-element (`scaleX` from 0 to 1, `origin-left`).
- **Cards (`ReportCard`):** the card lifts `-translate-y-1` and the border darkens (`duration-slow`). The image inside scales to `1.05` inside an `overflow-hidden` wrapper. Always add `group` on the card and `group-hover:` on the image.
- **Icon buttons:** background fades in (`hover:bg-surface`), no movement.
- Hover animations apply only on devices that support hover: use Tailwind's `hover:` (it already uses `@media (hover: hover)` in v3.4+) or guard manually.

### 5.2 Scroll Reveal (sections and cards)
- Elements fade up (`opacity 0 → 1`, `translateY 24px → 0`) once when they enter the viewport (trigger at ~15% visible). They **animate once**, never replay on scroll back.
- Children of a grid/list use **stagger** (70ms steps, capped).
- Hero content animates **on load**, not on scroll.
- Never hide critical content behind a reveal if JavaScript fails. Elements default to **visible** without JS (progressive enhancement; see `Reveal` below).

### 5.3 Page / Route Transitions
- Keep it minimal: a quick **fade + 8px upward drift** (200-250ms) on the main content area when navigating. Do not animate the navbar or footer.
- Implement with `app/template.tsx` (re-mounts per navigation) applying `animate-fade-in`. Do not block navigation waiting for animations.
- Use Next.js `loading.tsx` with skeletons for async routes (section 5.6).

### 5.4 Loading States
- **Skeletons** (`.skeleton` shimmer) for report cards, detail page, comments, profile lists, charts. Skeleton dimensions must match the real content to prevent layout shift.
- **Buttons with async actions:** replace the label with a small spinner (`lucide-react` `Loader2` with `animate-spin`) while keeping the button width fixed. Disable the button.
- **Page-level top progress bar** (optional): thin accent line at the top that animates during route changes (`nextjs-toploader` or a small custom component).
- Spinners only for actions under ~2 seconds. For longer ones, use progress indicators.

### 5.5 Image Loading
- Use `next/image` with a **blur-up placeholder**: while loading, show the `--surface` color; on load, fade the image in (`opacity-0 → opacity-100`, 400ms).
- Cloudinary images: use `onLoad` to toggle an `opacity` class, or use the `placeholder="blur"` with a tiny base64 blurDataURL.
- Always reserve space with `aspect-ratio` to avoid layout shift.

### 5.6 Skeleton → Content swap
Fade the content in (`animate-fade-in`) when it replaces the skeleton so it doesn't snap.

---

## 6. Reusable Animation Components & Hooks

Create these in `src/components/motion/` and `src/hooks/`.

### 6.1 `Reveal` (scroll reveal using IntersectionObserver, desktop only)

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

interface RevealProps {
  children: ReactNode;
  delay?: number;          // ms (use for stagger)
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

type RevealState = "visible" | "hidden" | "shown";

export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const motionEnabled = useMotionEnabled();
  // Start VISIBLE so server render, no-JS, and mobile all show content immediately
  const [state, setState] = useState<RevealState>("visible");

  useEffect(() => {
    const el = ref.current;
    // Mobile / reduced motion: stay visible, do nothing
    if (!el || !motionEnabled) {
      setState("visible");
      return;
    }

    setState("hidden"); // desktop only: hide, then reveal when scrolled into view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect(); // animate once only
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [motionEnabled]);

  const style: CSSProperties = motionEnabled ? { transitionDelay: `${delay}ms` } : {};

  return (
    // @ts-expect-error polymorphic ref typing kept simple on purpose
    <Tag
      ref={ref}
      style={style}
      className={[
        // lg: prefix = desktop only
        "lg:transition-all lg:duration-reveal lg:ease-out-soft",
        state === "hidden" ? "opacity-0 lg:translate-y-6" : "opacity-100 lg:translate-y-0",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
```
> Hero content uses the load animation (section 7.3) instead of `Reveal`, so above-the-fold content doesn't flash hidden on desktop.

### 6.2 `StaggerGroup` helper
Wraps children and assigns `delay = Math.min(index * 70, 500)` to each `Reveal`.

### 6.3 `useMotionEnabled` hook (replaces any `useReducedMotion` usage)

```ts
"use client";
import { useEffect, useState } from "react";

// Motion is allowed ONLY on desktop-size screens AND when the user has not asked for reduced motion
const QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

export function useMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(false); // false on server and first render = safe default
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setEnabled(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return enabled;
}
```
Every JS-driven animation (`Reveal`, `CountUp`, parallax, Recharts `isAnimationActive`, confetti, bell wiggle) must read this hook and do nothing when it returns `false`.

### 6.4 `useCountUp` / `CountUp` component
Animates numbers from 0 to the target over ~1200ms with an ease-out curve when scrolled into view (used for landing stats and admin dashboard stat cards). Uses `requestAnimationFrame`. Shows the final value immediately when motion is disabled (mobile or reduced motion). Format with `Intl.NumberFormat`.

### 6.5 `useInView` hook
Small reusable wrapper around `IntersectionObserver` (used by `Reveal`, `CountUp`, and charts).

---

## 7. Component-by-Component Motion Spec

### 7.1 Announcement Banner
- Slides down from above on first load (`animate-slide-down`).
- Dismiss: fades out and collapses height over 250ms (use `grid-template-rows: 1fr → 0fr` trick), then unmounts.

### 7.2 Navbar
- Transparent bottom border at the top of the page. On scroll past ~8px, the border and a subtle backdrop blur fade in (`transition duration-base`).
- Optional: hide on scroll down, show on scroll up (`translateY(-100%)`, 250ms). Keep it always visible if it causes jank.
- **Mobile menu:** opens and closes **instantly** (no slide, fade, or stagger). Lock body scroll while open.
- Avatar dropdown: `lg:animate-scale-in` from the top-right origin (desktop only; instant on mobile).

### 7.3 Hero
- On load, sequence (each `animate-fade-up`):
  1. Heading (delay 0ms)
  2. Subtext (delay 100ms)
  3. CTA buttons (delay 200ms)
  4. Hero image container (delay 300ms) with a gentle scale from `1.04 → 1` on the inner image (900ms, ease-out-soft)
- The hero image may drift very slightly on scroll (parallax up to ±20px) **only** on desktop and only with `transform`. Skip entirely for reduced motion. Parallax is optional; skip it if it risks jank.

### 7.4 Buttons
See 5.1. Loading state swaps in a spinner without changing the button size.

### 7.5 Segmented Tabs (pill tabs)
- The active pill **slides** to the selected tab (animated `transform: translateX` + width via a single absolutely positioned indicator, or `motion`'s `layoutId`), 250ms `ease-in-out-soft`.
- Tab content crossfades (opacity 0 → 1, 200ms) with a tiny 8px drift. Never animate height of the panel abruptly: set `min-height` or animate with `grid` trick.

### 7.5b Filtering the Report Grid
- When filters change, cards **fade out/in** (200ms) rather than jump. With `motion`: `AnimatePresence` + `layout` on cards so remaining cards slide to their new positions (250ms). Without `motion`: simply fade the grid (`opacity` 0.4 while loading, then 1) and show skeletons.

### 7.6 Carousel
- Native **CSS scroll-snap** (`scroll-snap-type: x mandatory`) with `scroll-behavior: smooth`.
- Arrow buttons call `scrollBy` for one card width. Disabled arrows fade to 40% opacity at the ends.
- The next card "peeks" at the edge. The active card is full opacity; off-screen cards slightly dimmed (opacity 0.6, transition 250ms).
- Touch swipe works through native scrolling (browser behavior, not an added animation, so it stays on mobile). Arrow buttons, smooth `scrollBy`, and the dimming of off-screen cards are **desktop only**. No autoplay (autoplay hurts accessibility). If autoplay is ever added, it must pause on hover/focus and be disabled for reduced motion.

### 7.7 Report Card
- Entrance: `Reveal` with stagger when the grid first loads.
- Hover: lift + image zoom (5.1).
- **Real-time status change:** when `status` updates through an `onSnapshot` listener, the badge does a one-time `animate-badge-pop` and the card flashes `animate-highlight-flash` (soft accent tint fading out). This is a key demo moment.
- Deleted/hidden cards: fade + shrink (200ms) before removal when using `motion`.

### 7.8 Accordion (FAQ)
- Plus icon rotates 45° into a close icon (`rotate-45`, 250ms).
- Content expands smoothly using Radix `Accordion` with CSS variable `--radix-accordion-content-height` and keyframes (`accordion-down` / `accordion-up`, 250ms `ease-out-soft`), as included in shadcn/ui's setup.
- Row background shifts subtly on hover (`hover:bg-surface`).

### 7.9 Dialogs, Sheets, Dropdowns, Popovers
- Dialog (desktop only): overlay fades (200ms); content `scale-in` (from 0.96, 250ms). On mobile, dialogs appear instantly.
- Sheet (mobile): appears and disappears **instantly**, with no slide or fade.
- Dropdowns/popovers: `scale-in` from the trigger edge (transform-origin set from Radix CSS variable).
- Exits are faster (about 150ms).
- Use shadcn/Radix `data-[state=open]` / `data-[state=closed]` animation classes, **prefixed with `lg:`** (for example `lg:data-[state=open]:animate-in lg:data-[state=open]:fade-in-0 lg:data-[state=open]:zoom-in-95`) so they only run on desktop.

### 7.10 Toasts (sonner)
- Desktop: slide + fade in from the bottom-right. Mobile: appears instantly at the top, no motion (the global CSS safety net handles sonner's internal animations). Auto-dismiss after 4s, pause on hover. Themed with `bg-ink text-bg` and pill shape.

### 7.11 Forms
- **Focus:** the input border transitions to ink and shows the accent ring (`transition-shadow duration-fast`).
- **Validation errors:** error text fades and drifts down 4px (`animate-slide-down`, 200ms). On submit failure, a quick horizontal "nudge" (±4px, 2 cycles, 300ms) on the invalid field is allowed but **skipped for reduced motion**. Never shake aggressively.
- **Multi-step report form:** steps crossfade and slide 16px in the direction of travel (forward: from right, back: from left), 250ms. The progress indicator fills smoothly (`transform: scaleX` on a bar, `origin-left`).
- **Type selection cards:** selecting a card scales to `1.02` with an accent border and a small checkmark that pops in (`animate-badge-pop`).
- **Success:** after submitting, show a checkmark whose SVG stroke **draws itself** (`stroke-dashoffset` animation, 500ms), followed by a toast and navigation.

### 7.12 Image Upload
- Dropzone: on drag-over, border becomes accent and the background tints (`transition-colors duration-fast`), icon scales to `1.1`.
- Each thumbnail: **scales/fades in** when added (`animate-scale-in`). While uploading, show a progress ring/bar overlay (`linear` easing, driven by real upload progress). On completion the overlay fades out. Removing a thumbnail fades/shrinks it (200ms).

### 7.13 Comments (Real-Time)
- A **new comment** arriving via `onSnapshot` slides in from the top of the thread (`animate-slide-down`) and flashes with `animate-highlight-flash` for 1.8s so the viewer notices it. This is the headline real-time demo.
- The comment composer: send button shows a spinner, then the textarea clears with a tiny fade.
- A hidden/deleted comment collapses smoothly (height via grid trick, 250ms).
- Do **not** animate the initial batch of existing comments individually (only stagger lightly, 40ms, capped, or fade the whole list in once).

### 7.14 Notifications
- **Bell icon:** when a new notification arrives, the bell does a short **ring/wiggle** (rotate ±12°, 600ms, once) and the unread count badge does `animate-badge-pop`. Subtle `animate-pulse-ring` on the badge once. Skip wiggle for reduced motion (badge still updates).
- **Dropdown list:** items stagger in (40ms steps, max 6). Unread items have a soft accent dot; marking as read fades the dot out (200ms).
- Never auto-open the dropdown.

### 7.15 Claim Flow
- The "This is mine" dialog: `scale-in`. Submitting shows spinner → success checkmark draw animation.
- When a claim is **approved**, the report's status badge morphs from "approved" to "resolved" using a crossfade and `badge-pop`. A restrained confetti burst is **optional** (`canvas-confetti`, small, ~1s, 40 particles). Only fires once, skipped for reduced motion. Ask the user before adding the dependency.

### 7.17 Moderation Queue
- Approving or rejecting a pending report: the row slides out to the side and fades (250ms) while the list closes the gap (200ms), then a toast confirms. Optimistic UI with rollback on error.

### 7.18 Admin Dashboard & Charts
- Stat cards: stagger reveal and `CountUp` numbers when scrolled into view.
- Recharts: enable built-in animation (`isAnimationActive`, `animationDuration={900}`, `animationEasing="ease-out"`) **on first mount only**. Disable animation on data refreshes or when reduced motion is on. Bars grow from the baseline, lines draw left to right, donut sweeps clockwise.
- Chart tooltips fade in (150ms).

### 7.19 Footer & Newsletter
- Footer content uses a single `Reveal` (no per-link stagger).
- Newsletter "Join us" success: button morphs to a checkmark with label "Joined", reverting after 3s.

### 7.20 Empty States
- Illustration fades up (`animate-fade-up`), with a very slow float (translateY ±6px, 4s ease-in-out infinite). **Reduced motion: static.**

### 7.21 Landing Page Sections (order of effects)
1. Banner slide down, navbar fade in
2. Hero load sequence (7.3)
3. Statement block: lines reveal one after another on scroll (`Reveal`, 100ms apart)
4. Big feature image: `Reveal` + inner image scale `1.06 → 1` as it enters
5. Tabbed section: slider pill + crossfade content
6. Split feature card: image and text reveal from opposite sides (±24px X drift)
7. Stats: `CountUp`
8. Latest reports grid: staggered reveal
9. Success stories carousel: standard carousel behavior
10. Full-bleed CTA banner: background image slow zoom on enter (`scale 1.08 → 1`, 1.2s) and text fade-up
11. FAQ: accordion
12. Footer: single reveal

---

## 8. Accessibility Rules for Motion

- **`prefers-reduced-motion: reduce`** is honored globally (section 4.2) and in JS hooks (`useMotionEnabled`). With reduced motion: no parallax, no wiggle, no float, no confetti, no auto-playing anything; opacity fades of up to 150ms are acceptable.
- **Never** flash more than 3 times per second (WCAG 2.3.1). Highlight flashes fade slowly (1.8s) specifically to comply.
- No autoplaying carousels or looping decorative animation that can't be paused.
- Don't hide content until an animation completes in a way that traps keyboard/screen-reader users. Animated elements stay in the DOM and focusable.
- Focus management: when a dialog opens, focus moves into it even while it animates; when it closes, focus returns to the trigger.
- Don't convey information through motion alone (e.g., status changes must also have text/color change).
- Animated live updates (new comments, notifications) should also use `aria-live="polite"` regions so screen readers announce them.

---

## 9. Performance Rules

1. Animate **only `transform` and `opacity`** wherever possible.
2. Keep animated elements off the main layout flow: prefer `position: absolute/fixed` overlays or `transform`.
3. Limit simultaneous animations: no more than ~12 elements animating at once. Cap stagger totals (500ms).
4. Run scroll-based logic with **IntersectionObserver**, not scroll event listeners. If a scroll listener is unavoidable, use `requestAnimationFrame` and `{ passive: true }`.
5. Observers and listeners must be cleaned up (`disconnect`, `removeEventListener`) in effect cleanups.
6. Unsubscribe `onSnapshot` listeners on unmount (see `AGENTS.md`), and don't re-trigger entrance animations on every snapshot update. Only animate **newly added** documents and **changed fields** (compare against the previous list by ID).
7. Keep animated images optimized (`next/image`, correct `sizes`, Cloudinary `f_auto,q_auto` transformations).
8. Do not animate large blurred or `filter`/`backdrop-filter` areas continuously. Avoid animating `box-shadow` on big elements (animate an `opacity` pseudo-element instead).
9. Test on a throttled CPU (Chrome DevTools: 4x slowdown) at desktop width. Remove any effect that drops below ~50fps. Also check a phone-size viewport (and a real phone) to confirm **no animation runs** there.
10. Cumulative Layout Shift must stay near 0. Reserve space for images, skeletons, and expanding elements.

---

## 10. What NOT to Do

- No bouncing, elastic, or overshoot easings (except the tiny `badge-pop`)
- No spinning logos, marquee text, or typewriter effects
- No animated gradients or moving backgrounds across the whole page
- No scroll-jacking or locked scroll sections
- No page-load splash screen or intro animation that delays content
- No hover effects that shift surrounding layout
- No full-page parallax or 3D tilt effects
- No animation that repeats forever on content the user is trying to read
- No blocking animations (user must be able to click and navigate at any moment)

---

## 11. Implementation Order for the Agent (opencode)

Integrate with the phases in `AGENTS.md`. Don't build all motion up front. Add it after the underlying feature works.

| When | Motion work |
|---|---|
| **Phase 1** | Add Tailwind motion tokens, keyframes, and the reduced-motion CSS (section 4). Create `useMotionEnabled`, `useInView`, `Reveal` (all desktop-only, section 1A) |
| **Phase 2-3** | Button/hover/press states, navbar behavior, skeletons and image fade-in, form focus/validation motion, upload thumbnails and progress |
| **Phase 3** | Landing page sections and hero sequence, report card hover, grid reveal, filter transitions, tabs, carousel, accordion |
| **Phase 4** | Real-time comment entrance + highlight (7.13) |
| **Phase 5** | Notification bell/badge animations (7.14), claim flow success states |
| **Phase 6-7** | Moderation row exit animations, `CountUp`, Recharts animation settings |
| **Phase 8** | Polish pass: reduced-motion audit, performance audit (CPU throttling), remove anything janky |
| **Phase 9** | Final check: animations work on desktop and a real phone shows none; record the real-time demos on desktop |

---

## 12. Presentation Highlights (Motion Moments to Demo)

Make these feel great because they will be shown live. Demo them on a **desktop browser** (animations are off on mobile by design):
1. **Hero load sequence** and smooth scroll reveals on the landing page
2. **Two-window real-time demo:** post a comment in one browser; it slides in and flashes in the other
3. **Moderator approves a report:** the status badge pops and the card flashes in the user's feed; the bell rings with a new notification
4. **Claim approved:** the badge morphs to "resolved" with a subtle celebration
5. **Admin dashboard:** numbers count up and charts draw in

---

## 13. Quality Checklist

- [ ] All durations/easings come from the tokens in section 3, with no random values
- [ ] Reduced motion tested: enable it in OS/DevTools and confirm no parallax, wiggle, float, or confetti
- [ ] No layout shift when images, skeletons, or accordions load/expand
- [ ] Only `transform`/`opacity` animated on frequently updating elements
- [ ] Real-time animations fire only for new/changed items, not on every snapshot
- [ ] All animations are interruptible; nothing blocks clicks or navigation
- [ ] Focus states remain visible and dialogs manage focus properly
- [ ] 60fps on desktop, including with 4x CPU throttling in DevTools
- [ ] **No animations or transitions below 1024px** (test at 375px and 768px); content shows instantly
- [ ] Every animation/transition utility has the `lg:` prefix; JS motion is gated by `useMotionEnabled()`
- [ ] Live regions (`aria-live`) announce new comments and notifications
- [ ] No console warnings from hydration mismatches caused by animation state (initial render must match on server and client)

---

## 14. Instructions to the Agent (opencode)

1. Start with CSS/Tailwind and the `Reveal` component. Only add the `motion` library if a pattern truly needs it (list reordering, shared layout, counters), and tell the user why.
2. Use the motion tokens only. Don't invent new durations or easings without a reason noted in a comment.
3. Every animated component is **desktop only** (section 1A): use `lg:`-prefixed utilities, gate JS motion with `useMotionEnabled()`, and respect `prefers-reduced-motion`. Mobile gets no animations.
4. Keep animation code in small client components. Don't convert whole pages to Client Components just to animate them.
5. Avoid hydration mismatches: default animated elements to their final visible state on the server render, and apply the "hidden" starting state only after mount when JS is available.
6. Never let animation interfere with `SECURITY.md` requirements (for example, don't inline scripts that would break the CSP; use components and CSS instead).
7. After each phase, state which animations were added and how to see them.
8. If something looks janky, remove or simplify it. Smooth and subtle beats fancy.
