# DESIGN.md: UI Design System for FindIt (Lost & Found / Community Reporting Platform)

> UI specification for opencode. Read this together with `AGENTS.md`.
> `AGENTS.md` defines **what** to build (features, data, rules). This file defines **how it should look and feel**.
> If the two conflict on visual or layout matters, this file wins. On functionality, `AGENTS.md` wins.

---

## 1. Design Inspiration

The visual direction is inspired by the **Pebble Flow** marketing website (an all-electric travel trailer brand). We are borrowing its *style*, not its content, branding, logo, copy, or photos.

**What defines the look:**
- **Warm, calm, premium.** A soft cream/beige canvas instead of stark white, with dark charcoal text.
- **One confident accent color** (coral/orange) used only for primary calls to action.
- **Huge, centered headlines** with tight letter spacing and lots of breathing room.
- **Big rounded image cards**, full-width hero imagery, and photography-first sections.
- **Pill-shaped buttons and tabs**, soft rounded corners everywhere.
- **Simple, structured sections**: hero, short intro statement, feature cards, tabbed content, carousel, testimonials, FAQ accordion, final CTA, rich footer.
- **Minimal chrome**: a slim top navigation, a thin announcement banner, subtle borders, almost no shadows.

**Mood keywords:** calm, trustworthy, warm, modern, spacious, human, friendly.

> Do **not** copy the Pebble name, logo, trailer imagery, or text. Use FindIt branding and community-themed content.

---

## 2. Design Tokens

Colors below are approximations of the reference style. Tune them if they look off in the browser.

### 2.1 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#EFECE3` | Page background (warm cream) |
| `--surface` | `#E6E1D3` | Feature cards, tab bar, muted sections |
| `--surface-2` | `#DDD6C5` | Hovered surfaces, large split cards |
| `--card` | `#F7F5EF` | Elevated cards, FAQ rows, form panels |
| `--border` | `#D8D2C2` | Hairline borders, dividers |
| `--ink` | `#23221E` | Primary text, dark buttons |
| `--ink-soft` | `#5E5B52` | Secondary text, captions |
| `--ink-faint` | `#8C887C` | Placeholder, disabled text |
| `--accent` | `#F2784B` | Primary CTA buttons, banner, key highlights |
| `--accent-hover` | `#E0653A` | CTA hover |
| `--accent-soft` | `#FBE0D3` | Accent tinted backgrounds |
| `--lime` | `#B9D37A` | Optional secondary highlight (used in the reference's product color) |
| `--success` | `#4F8A5B` | Found / approved |
| `--warning` | `#D9A441` | Pending / incident |
| `--danger` | `#C4553F` | Rejected / destructive |
| `--info` | `#4A7C9B` | Informational |

**Report type colors**
- **Lost** → `--danger` tint (`#C4553F` text on `#F6DDD6` background)
- **Found** → `--success` tint (`#4F8A5B` text on `#DCEBDD` background)
- **Incident** → `--warning` tint (`#9A6B12` text on `#F5E6C4` background)

**Status badge colors**
- pending → warning tint, approved → success tint, rejected → danger tint, resolved → neutral dark (`--ink` on `--surface`)

**Dark mode (optional, lower priority):** invert to deep warm charcoal (`#1B1A17` bg, `#26241F` cards, `#F2EFE6` text), keep the same accent.

### 2.2 Typography

- **Headings:** a modern grotesque/geometric sans with tight tracking. Use **"Inter Tight"** or **"Manrope"** from `next/font/google` (fallback: system sans).
- **Body:** **"Inter"** (fallback: system sans).
- Headings are **medium to semibold (500-600)**, never ultra-bold.
- Headings use negative letter spacing: `tracking-tight` (`-0.02em`) on large sizes.

| Role | Size (desktop) | Size (mobile) | Weight | Line height |
|---|---|---|---|---|
| Display / hero | 72-80px (`text-7xl`) | 40-44px | 600 | 1.0 |
| H1 section title | 56px (`text-5xl`) | 34px | 600 | 1.05 |
| H2 | 40px (`text-4xl`) | 28px | 600 | 1.1 |
| H3 card title | 24px (`text-2xl`) | 20px | 600 | 1.2 |
| Lead paragraph | 20-22px | 18px | 500 | 1.4 |
| Body | 16px | 16px | 400 | 1.6 |
| Small / caption | 13-14px | 13px | 400 | 1.5 |
| Overline (small label above titles) | 13px, uppercase optional | 12px | 500 | 1.3 |

Section titles are **centered** with a short centered subtitle in `--ink-soft` beneath.

### 2.3 Spacing, Radius, Shadow

- **Layout max width:** `1200px` for content, `1400px` for full-bleed imagery containers; page side padding `24px` mobile, `32-48px` desktop.
- **Section vertical spacing:** `96-140px` desktop, `64-80px` mobile. Generous whitespace is the point.
- **Radius scale:**
  - Buttons / tabs / badges: `9999px` (full pill)
  - Inputs: `14px`
  - Cards: `20-24px`
  - Large hero/feature image containers: `28-32px`
- **Shadows:** nearly none. Prefer 1px borders (`--border`) and background contrast. If needed: `0 8px 30px rgba(35,34,30,0.08)` for floating menus/dialogs only.
- **Motion:** subtle and quick. `150-250ms ease-out` for hovers and tab changes. Fade-up on scroll for sections (optional, respect `prefers-reduced-motion`).

### 2.4 Tailwind Setup

In `tailwind.config.ts`, extend the theme:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#EFECE3",
        surface: "#E6E1D3",
        "surface-2": "#DDD6C5",
        card: "#F7F5EF",
        border: "#D8D2C2",
        ink: { DEFAULT: "#23221E", soft: "#5E5B52", faint: "#8C887C" },
        accent: { DEFAULT: "#F2784B", hover: "#E0653A", soft: "#FBE0D3" },
        lime: "#B9D37A",
        success: "#4F8A5B",
        warning: "#D9A441",
        danger: "#C4553F",
        info: "#4A7C9B",
      },
      borderRadius: {
        card: "24px",
        hero: "32px",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: { content: "1200px", wide: "1400px" },
    },
  },
  plugins: [],
};
export default config;
```

Set `body` to `bg-bg text-ink font-body antialiased`. If using shadcn/ui, map its CSS variables (`--background`, `--foreground`, `--primary`, etc.) to these tokens so shadcn components automatically match.

---

## 3. Core Components

Build these as reusable components in `src/components/ui` and `src/components/layout`.

### 3.1 Buttons
All buttons are **pill-shaped** (`rounded-full`), medium weight, `px-5 py-2.5` (default), `px-7 py-3.5` (large).

| Variant | Style |
|---|---|
| **Primary (accent)** | `bg-accent text-white hover:bg-accent-hover`. Use for the single main action in a section (e.g., "Report an item") |
| **Dark** | `bg-ink text-bg hover:bg-ink/90`. Secondary strong action (e.g., "Browse reports") |
| **Soft** | `bg-surface text-ink hover:bg-surface-2`. Tertiary actions, navbar utility buttons |
| **Ghost / outline** | `border border-border bg-transparent hover:bg-surface` |
| **Link** | Underlined text, `text-ink-soft hover:text-ink` |

Pair a Primary + Dark button side by side in hero and CTA sections (as in the reference: "Explore the features" + "Build your Pebble").
Focus state: visible 2px ring in `--accent` with offset.

### 3.2 Announcement Banner
- Thin full-width bar at the very top, `bg-accent`, white small text (13px), centered.
- Message + inline underlined link. Example: "New: community map view coming soon. See what's planned".
- Dismissible (X), remembers dismissal in `localStorage`.

### 3.3 Navbar
- Slim (64px), `bg-bg`, bottom hairline border on scroll.
- **Left:** logo mark + wordmark "FindIt", followed by links (Browse, Report, Community / How it works).
- **Right:** soft pill buttons: "Login", and an accent pill "Report an item". When logged in: notification bell + avatar menu.
- Mobile: hamburger opening a full-screen sheet with large links.
- Role-aware links (Moderation, Admin) appear inside the avatar menu.

### 3.4 Hero
- Large centered display heading directly under the nav (e.g., **"Lost it? Found it."**) with a tagline below.
- Beneath: a **huge rounded image container** (`rounded-hero`, full content width, aspect ~16/7) showing community photography or an illustration collage of found items. Use a placeholder gradient if no image is available.
- Primary + Dark CTA pair centered below the statement block.
- A second short statement section follows: bold centered paragraph in two lines, e.g., *"Report in minutes. Reunite in days."*

### 3.5 Feature Split Card
Large `rounded-hero` card with two halves:
- Image half (full-bleed to the card edge) and text half on `--surface` with a heading, short paragraph, and an accent pill button.
- Alternate image left/right between sections.
- Stacks vertically on mobile (image on top).

### 3.6 Tabbed Segmented Control
- Pill-shaped container (`bg-surface`, `p-1`, `rounded-full`) with pill tabs; active tab is `bg-card` with subtle border/shadow, inactive is transparent.
- Used for report type filters: **All / Lost / Found / Incident**, and for profile tabs: **My Reports / My Claims / Notifications**.
- Horizontally scrollable on mobile.

### 3.7 Carousel Card
- Large rounded card (`bg-card`, `border`, `rounded-card`) with image on one side and text with a dark pill button on the other. A "peek" of the next card is visible at the edge.
- Round arrow buttons (`←` `→`, 40px circles, `bg-surface`) below left-aligned.
- Use it for "Recently reunited" success stories and featured reports. Implement with CSS scroll-snap (no heavy library needed).

### 3.8 Report Card (key component)
- `bg-card`, `border border-border`, `rounded-card`, overflow hidden.
- Top: image with `aspect-[4/3]`, rounded top corners; fallback illustration if no photo.
- Floating pill badges over the image: report **type** (top-left) and **status** (top-right if not approved).
- Body: title (semibold, 1-2 line clamp), category, location with a pin icon, date (relative, e.g., "2 days ago") in `--ink-soft`.
- Hover: image scales subtly (`scale-105`), card lifts border color to `--ink-faint`.
- Skeleton variant for loading.

### 3.9 FAQ Accordion
- Stack of full-width rows: `bg-card`, `border`, `rounded-xl`, 56-64px tall, question left, `+` icon right (rotates to `×`/`-` when open).
- Answer slides open with a height transition. Only one open at a time (optional).
- Centered "View the full FAQs" dark pill button below.

### 3.10 Testimonial / Story Block
- Card with large photo on the left and a quote on the right, with the person's name and a short descriptor underneath. Quote text ~20px medium weight.

### 3.11 Full-Bleed Image CTA Banner
- Edge-to-edge rounded container with a darkened photo background (`bg-black/40` overlay), huge white centered heading (e.g., **"Step in. Help out."** or **"Reunite someone today."**) and one pill CTA.

### 3.12 Footer
- `bg-bg` with top border. Multi-column layout:
  - Column 1: logo + **newsletter signup** (email field, small accent pill "Join us", consent checkbox, tiny legal text).
  - Columns 2-4: link groups (Platform, Community, Support) in small `--ink-soft` text.
- Bottom row: copyright, Privacy, Terms. Mobile: columns stack, accordions optional.

### 3.13 Forms, Inputs, Dialogs
- Inputs: `bg-card`, `border border-border`, `rounded-[14px]`, `h-12`, focus ring in `--accent`.
- Labels above fields in 14px medium. Helper text and errors in 13px (`--danger` for errors) directly under fields.
- Multi-step report form uses a slim progress indicator (dots or numbered pills).
- Image uploader: dashed-border rounded dropzone with preview thumbnails and remove (x) buttons.
- Dialogs/sheets: `rounded-card`, `bg-card`, soft shadow, dimmed backdrop (`bg-ink/40`).
- Toasts (sonner): rounded pill-style, `bg-ink text-bg`.

### 3.14 Badges
Small pill: `px-3 py-1 text-xs font-medium rounded-full`. Use tinted backgrounds from the color mappings in section 2.1.

---

## 4. Page-by-Page Layout Guidance

### 4.1 Landing Page (`/`)
Follow the structure of the reference page, adapted to FindIt:

1. **Announcement banner** (accent)
2. **Navbar**
3. **Hero**: display heading, subtext, large rounded hero image, Primary ("Report an item") + Dark ("Browse reports") buttons
4. **Statement block**: two-line bold centered message about reporting and reuniting
5. **Intelligent/simple feature intro**: heading like *"Simple tools. Real results."* with a big rounded image and a "Explore all features" dark button
6. **"One platform. Many uses."** tabbed section (segmented control): *Lost items / Found items / Community issues / Campus & barangay* with a carousel card per tab
7. **Split feature card** on `--surface`: e.g., "Verified claims" (explains the verification question flow) with an accent pill button
8. **Live stats row** (optional): total reports, items returned, active members, large numerals
9. **Latest reports** grid of `ReportCard`s with a "View all reports" dark pill
10. **Success stories** carousel ("Real stories from our community")
11. **Full-bleed image CTA banner**
12. **FAQ accordion** ("Have questions?")
13. **Final CTA** section with Primary + Dark buttons
14. **Footer** with newsletter signup

### 4.2 Browse Reports (`/reports`)
- Centered H1 ("Browse reports") + subtitle.
- Segmented control for type, then a row of filter pills/dropdowns (category, date, status) and a search input with a pill shape.
- Responsive grid: 1 col mobile, 2 tablet, 3-4 desktop. Generous gaps (`gap-6`).
- "Load more" dark pill button; skeleton cards while loading; friendly empty state with an illustration and CTA.

### 4.3 Report Detail (`/reports/[id]`)
- Two-column on desktop: left = large rounded image gallery (main image + thumbnails), right = sticky details card (type/status badges, title, category, location, date, author, action buttons: **"This is mine"** (accent) or **Resolve** (dark)).
- Below: description section, then a **Comments** card with live thread and a pill-shaped comment composer.
- Mobile: stacked, sticky bottom action bar.

### 4.4 Create / Edit Report (`/reports/new`)
- Centered narrow container (max `720px`) on a `bg-card` rounded panel.
- Step flow: **Type → Details → Photos → Review**, with a slim progress indicator.
- Type step uses three large selectable cards (Lost / Found / Incident) with icons and short descriptions.

### 4.5 Auth Pages
- Split layout on desktop: left = form on `--card` panel, right = large rounded image panel with a short quote or tagline. Mobile: form only.
- Google button as a Soft/outline pill with the Google icon.

### 4.6 Profile (`/profile`)
- Header with avatar, name, role badge.
- Segmented control tabs: My Reports / My Claims / Notifications / Settings.

### 4.7 Moderation (`/moderation`) and Admin (`/admin`)
- Calmer, more utilitarian: same tokens, but denser layout.
- Sidebar (desktop) or segmented tabs (mobile).
- Stat cards (`bg-card`, `rounded-card`, large numerals) and Recharts charts styled with the palette: ink for axes, accent for primary series, success/warning/danger for type series, `--surface` for grid lines, rounded bar tops.
- Tables: no heavy borders, row dividers with `--border`, pill badges for status, pill action buttons.

---

## 5. Imagery & Iconography

- **Photography-first.** Use large, high-quality images with rounded corners. Prefer warm natural lighting. Placeholders: Unsplash (community, campus, everyday objects) or soft illustrated placeholders.
- **No stock-photo clutter**: one strong image per section.
- Icons: `lucide-react`, 1.5px stroke, `size-5` default, colored `--ink` or `--ink-soft`.
- Provide an on-brand fallback illustration (simple line art of a bag/key/phone on `--surface`) when a report has no photo.
- Always add meaningful `alt` text. Use `next/image` with `sizes` set; images served from the configured remote host.

---

## 6. Responsive Behavior

| Breakpoint | Notes |
|---|---|
| Mobile `< 640px` | Single column, hero heading ~40px, buttons stack full-width, nav collapses to hamburger, carousels swipe, footer columns stack |
| Tablet `640-1024px` | 2-column grids, split cards remain stacked or 50/50 depending on width |
| Desktop `>= 1024px` | Full layout, 3-4 column grids, split cards side-by-side, sticky detail panel |

Design **mobile-first**. Test at 375px, 768px, and 1280px. Touch targets at least 44px.

---

## 7. Accessibility

- Text contrast of at least WCAG AA. Verify the white-on-accent button text (if contrast is borderline at small sizes, use `--ink` text on `--accent`, or darken the accent slightly to `#E2663A`).
- Visible focus rings on every interactive element.
- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, logical heading order.
- Accordions, tabs, dialogs, and carousels follow ARIA patterns (shadcn/Radix handles most of this).
- Respect `prefers-reduced-motion` and `prefers-color-scheme` if dark mode is added.
- Don't rely on color alone for report type or status: always include text labels in badges.

---

## 8. Implementation Notes for the Agent (opencode)

1. Implement the **design tokens and Tailwind config first** (section 2), then the shared components (section 3), then pages (section 4).
2. Create a simple **component preview page** (`/design`, dev-only) showing all buttons, badges, cards, inputs, accordion, and tabs. It makes visual review quick and is handy for the presentation.
3. Load fonts via `next/font/google` and expose them as `--font-heading` and `--font-body` CSS variables in `layout.tsx`.
4. Use `shadcn/ui` primitives (Button, Dialog, Tabs, Accordion, Input, DropdownMenu, Sheet, Skeleton) and **restyle them** to the pill/rounded look through the theme variables and component variants rather than writing everything from scratch.
5. Keep animations light; use CSS transitions or `tailwindcss-animate`. Avoid heavy animation libraries.
6. Keep class lists readable. Extract repeated patterns (section wrappers, headings) into small components such as `<Section>`, `<SectionHeading title subtitle />`, and `<PillButton />`.
7. Placeholder content should feel real (realistic titles, locations, dates) so the UI looks finished in screenshots and demos.
8. After each page is built, check it visually at mobile and desktop widths and fix spacing issues before moving on.

---

## 9. Visual Quality Checklist

- [ ] Background is warm cream, not pure white; text is warm charcoal, not pure black
- [ ] Only one accent color; used sparingly for primary actions
- [ ] Headings are large, centered where specified, tight tracking, medium-semibold weight
- [ ] All buttons, tabs, and badges are fully rounded pills
- [ ] Cards and images have large, consistent rounded corners
- [ ] Sections have generous vertical spacing; nothing feels cramped
- [ ] Photography/imagery appears in every major section
- [ ] FAQ, tabs, and carousels match the described patterns
- [ ] Footer includes link columns and newsletter signup
- [ ] Everything looks good at 375px, 768px, and 1280px
- [ ] Focus states and contrast pass an accessibility check
