---
name: PNM Tracking
description: One-handed recruitment-pipeline ledger for a fraternity chapter.
colors:
  ledger-ink: "#111827"
  ink-hover: "#1f2937"
  surface: "#ffffff"
  ground: "#f9fafb"
  hairline: "#e5e7eb"
  hairline-strong: "#d1d5db"
  divider: "#f3f4f6"
  text-secondary: "#4b5563"
  text-muted: "#6b7280"
  text-label: "#374151"
  state-contacted: "#1d4ed8"
  state-building: "#4338ca"
  state-bid-extended: "#92400e"
  state-pledged: "#15803d"
  state-dropped: "#b91c1c"
  feedback-error: "#dc2626"
  feedback-success: "#166534"
  feedback-warning: "#78350f"
typography:
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  strong:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
  overline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "40px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.surface}"
  button-primary-cta:
    backgroundColor: "{colors.ledger-ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    typography: "{typography.strong}"
    width: "100%"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-label}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.state-dropped}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.label}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  badge:
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.caption}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-label}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    typography: "{typography.body}"
  chip-selected:
    backgroundColor: "{colors.ledger-ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  nav-tab:
    textColor: "{colors.text-muted}"
    padding: "12px"
    typography: "{typography.label}"
  nav-tab-active:
    textColor: "{colors.ledger-ink}"
    padding: "12px"
    typography: "{typography.label}"
---

# Design System: PNM Tracking

## Overview

**Creative North Star: "The Chapter Ledger"**

PNM Tracking is a disciplined record-keeping instrument that lives in a
backpack. It is used one-handed, mid-conversation, at a loud rush event, by a
brother who needs to mark that something happened and get back to the person in
front of him. So the interface behaves like a well-kept ledger: clean columns,
every entry accountable, quiet authority, nothing on the page that isn't
carrying weight. It is honest about being a utility and does not apologize for
it — sturdy, direct, unfussy.

The visual language is deliberately narrow. One ink color, `#111827`, does
almost all the work: it writes the body text and it draws every control. The
rest of the surface is white panels on a soft gray ground, separated by
hairline borders rather than shadow. Color enters only as vocabulary — blue,
indigo, amber, green, and red encode where a potential new member sits in the
pipeline, and a red line reports a form error. If a color on screen is not
carrying one of those meanings, it is gray.

The explicit anti-reference is **SaaS dashboard polish**: no gradient headers,
no card drop-shadows for emphasis, no accent-colored calls to action, no
illustrated empty states, no entrance animations or "delight" motion. This is a
ledger, not a landing page. The only motion in the system is a 150ms color
transition on interactive states and a spinner while data loads.

**Key Characteristics:**
- One ink color (`#111827`) on a white-and-gray field; hues are reserved for pipeline status and form feedback
- System font stack, three weights only (400 / 500 / 600), no web fonts
- Flat by default — hairline borders and dividers do the structural work; the `shadow-sm` hairline lift is a permitted exception, nothing deeper
- 8px corners on controls, 12px on cards, pill on badges and chips
- A single `max-w-3xl` column at every width; a phone in a hand is the design target, `sm:` (640px) the only breakpoint
- The primary action of every screen is a full-width button

## Colors

A monochrome system built on one near-black ink, with a fixed six-part status
palette and a three-part feedback palette layered on top. Neutrals are the
Tailwind gray ramp.

### Primary
- **Ledger Ink** (`#111827`): The single brand color and the body-text color at
  once — the same ink that writes the words draws the controls. Fills primary
  buttons, the active navigation tab (text and 2px underline), the focus
  border and ring on fields, and the selected state of method chips. On a
  typical screen it covers well under 10% of the surface; that restraint is the
  point.
- **Ink Hover** (`#1f2937`): The one-step-lighter fill a primary button takes
  on hover. The only hover treatment in the system that changes a fill.

### Neutral
- **Surface** (`#ffffff`): Cards, the sticky header, field and chip backgrounds.
- **Ground** (`#f9fafb`): The app background behind all cards. Also the hover
  fill for secondary buttons.
- **Hairline** (`#e5e7eb`): Card borders, the header's bottom edge, the spinner
  track. The primary structural line.
- **Hairline Strong** (`#d1d5db`): Field borders and the ring on unselected
  chips — one step darker where an input needs to read as tappable.
- **Divider** (`#f3f4f6`): Row dividers inside cards (`divide-y`), the rule
  above a card's disclosure section, and the fill of read-only tag pills.
- **Text Label** (`#374151`): Field labels, secondary-button text, and the
  "identified" status badge — where the absence of a hue is itself the signal.
- **Text Secondary** (`#4b5563`): Explanatory body copy under a heading.
- **Text Muted** (`#6b7280`): Timestamps, counts, helper text, inactive
  navigation tabs, the back-link.

### Tertiary — Status vocabulary
Six fixed tints, one per pipeline stage. Each renders as a pill: a `50`-level
background, a `700`/`800`-level text color, a `200`-level inset ring.
- **Identified** (text `#374151`): No hue. A name that has been entered and
  nothing more.
- **Contacted** (`#1d4ed8`, blue): First real interaction logged.
- **Building Relationship** (`#4338ca`, indigo): Sustained contact underway.
- **Bid Extended** (`#92400e`, amber): The decisive stage before pledging.
- **Pledged** (`#15803d`, green): Terminal success.
- **Dropped** (`#b91c1c`, red): Out of the pipeline. Also the text color of the
  danger button.

### Feedback
- **Error** (`#dc2626`): Form-error lines, always as text beneath the field.
- **Success** (`#166534` on a `#f0fdf4` green-50 strip): The confirmation strip
  after an action ("Logged.", "Details saved.").
- **Warning** (`#78350f` on a `#fffbeb` amber-50 card with an amber-300
  border): The duplicate-detection notice on PNM creation. The only place a
  full panel takes a colored background.

### Named Rules
**The Single Ink Rule.** One brand color, `#111827`. It is also the body-text
color. There is no second accent and no gradient, ever. Anything that isn't ink
or a status/feedback hue is gray.

**The Hue-Means-Status Rule.** Blue, indigo, amber, green, and red appear only
to encode pipeline stage or form feedback. A color with no such meaning is a
bug. Never use a status hue decoratively or as a brand accent.

## Typography

**Display / Body / Label Font:** the platform UI stack —
`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
One family for everything. No web fonts, no display face.

**Character:** Native and unremarkable by design. It paints instantly, it
matches the phone the app runs on, and it keeps the reader's attention on names
and dates rather than on letterforms. Weights are limited to Regular (400),
Medium (500), and Semibold (600).

### Hierarchy
- **Headline** (600, 1.25rem / `text-xl`, ~1.4): The subject of a screen — a
  PNM's name on the detail view, "New PNM" on the form, the app name on the
  sign-in card.
- **Title** (600, 1.125rem / `text-lg`, ~1.5): The app name in the header, and
  the title of a settings or roster section card.
- **Strong** (500, 1rem, ~1.5): Subsection headings inside a card — "Contact
  log", "Results", "Reminders on this device". Also the sized-up primary CTA.
- **Body** (400, 0.875rem / `text-sm`, ~1.45): The workhorse. List-row primary
  text, paragraphs, input values, standard buttons (at weight 500).
- **Label** (500, 0.875rem, ~1.45): Field labels (`text-label` gray, `mb-1`,
  block) and button text.
- **Caption** (400, 0.75rem / `text-xs`, ~1.35): Timestamps, counts, the
  header identity line, helper text under a field, badge text.
- **Overline** (500, 0.75rem, uppercase, 0.05em tracking): Table column
  headers only, in `text-muted`.

### Named Rules
**The System-Stack Rule.** No web fonts are loaded. The OS UI font is a
deliberate choice — instant first paint and a native feel on the device the app
is actually used on. Do not add a display face "for personality"; personality
lives in the restraint.

**The Three-Weight Rule.** 400, 500, 600. No Light (300), no Bold (700). If a
thing needs more emphasis than Semibold gives it, it needs more size or more
space, not more weight.

## Layout

**Column.** Every screen is a single centered column capped at `max-w-3xl`
(48rem) with `px-4` gutters. There is no multi-column layout and no sidebar.
The design target is a phone held in one hand; the wide cap only keeps line
lengths sane on a laptop.

**Header.** A `sticky top-0 z-10` bar on `surface` white with a `hairline`
bottom border — never a shadow. It holds a title block (app name + the signed-in
brother's name in `caption`) and a Sign-out button, then a full-width row of
navigation tabs beneath.

**Content.** `px-4 py-4`, a vertical stack of cards separated by `space-y-4`
(16px). Card internals use `space-y-3` (12px). Form fields group as
`grid gap-3` — one column on mobile, `sm:grid-cols-2` or `sm:grid-cols-3` from
640px up.

**Full-screen prompts.** Sign-in and invite-claim center a single
`max-w-sm` card vertically: `flex min-h-screen items-center justify-center px-4`.

**Spacing rhythm.** A 4px base. The steps in active use are 6 (chip gaps), 8
(control gaps, button padding-y), 12 (form-grid gaps, card-internal stacks), 16
(page section gaps, card padding, CTA padding-y), 24 (auth-card padding), and
40 (spinner block padding). Body padding also carries `env(safe-area-inset-*)`
for the home-screen install.

**Breakpoints.** `sm:` (640px) is the only one. No `md` / `lg` / `xl`.

### Named Rules
**The One-Column Rule.** Nothing is ever placed beside the main column. Denser
data (a dashboard, a leaderboard) stacks or scrolls within `max-w-3xl`; it does
not earn a second column or a wider cap.

## Elevation & Depth

Flat by default. This is a printed page: separation comes from `hairline` and
`hairline-strong` borders, `divider` rules between rows, and white panels
sitting on the `ground` gray. The sticky header separates from scrolling
content with a border and `z-10`, not a shadow.

One exception is permitted. Cards and fields may carry `shadow-sm` — a 1px,
near-invisible lift (`0 1px 2px 0 rgb(0 0 0 / 0.05)`). It is the ceiling.
Nothing deeper exists, no shadow appears on hover, and shadow is never used to
signal hierarchy or importance. Whether a given surface uses even the hairline
lift is a per-screen call; the safe default is none.

### Shadow Vocabulary
- **Hairline lift** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): The only
  shadow. Optional on `card` and `field`. Not for hover, not for modals (there
  are none), not for emphasis.

### Named Rules
**The Printed-Page Rule.** Default to flat. Borders, dividers, and
white-on-ground contrast do the structural work. The hairline `shadow-sm` is a
tolerated lift on raised surfaces and nothing more — no deeper shadow, no hover
elevation, no decorative depth.

## Shapes

Rectilinear and calm. Two working radii: `rounded-lg` (8px) on every
interactive element — buttons, fields, inline alert panels, small bordered
sub-panels — and `rounded-xl` (12px) on cards. Badges, chips, and the spinner
are `rounded-full`; checkboxes keep the 4px `rounded` default.

Borders are always 1px and low-contrast. Badges and selectable chips use
`ring-1 ring-inset` instead of `border` so that toggling selection never
changes an element's box size. There is no clipping, no asymmetry, no
decorative geometry, no diagonal or angled edge anywhere in the system.

## Components

Every control is **solid and unadorned**: it looks like exactly what it does,
with no ornament. Rectangles with a modest radius, a border or a fill, and a
single-property hover.

### Buttons
- **Shape:** 8px radius (`rounded-lg`). Base is `inline-flex`, centered,
  `gap-2`, `px-4 py-2`, `text-sm font-medium`, a 150ms `transition`; disabled
  drops to 50% opacity with `cursor: not-allowed`.
- **Primary:** `ledger-ink` fill, white text. Hover: fill shifts to
  `ink-hover` (`#1f2937`). The screen's main action, and it goes full-width.
- **Primary CTA (sized up):** the single most important action — "Log a
  contact" — takes `w-full py-3 text-base`. It is the only button that breaks
  the base size, and it never sits behind a form.
- **Secondary:** white fill, `hairline-strong` border, `text-label` text.
  Hover: fill goes to `ground`.
- **Danger:** white fill, `red-200` border, `state-dropped` (`#b91c1c`) text.
  Hover: fill goes to `red-50`. Used for destructive actions only (delete a
  PNM, revoke an invite).
- **Tertiary:** not a button shape at all — a plain `text-sm text-gray-600
  underline` text link ("Add details (optional)", "Edit details").
- **Focus:** buttons currently rely on the user-agent focus ring. New work
  should add a visible `focus-visible` ring in `ledger-ink` to match fields.

### Chips
- **Method selector (toggle):** `rounded-full px-3 py-1 text-sm`,
  `ring-1 ring-inset`. Unselected: white fill, `hairline-strong` ring,
  `text-label`; hover fill `ground`. Selected: `ledger-ink` fill, white text,
  `ledger-ink` ring. Carries `aria-pressed`; tapping a selected chip clears it.
- **Tag pill (read-only):** `rounded-full bg-divider px-2 py-0.5 text-xs
  text-gray-700`. Displays a PNM's sports / hobbies / interests. Not
  interactive.

### Status Badge
`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset`, `shrink-0`.
One of the six status tints (`50` bg / `700`–`800` text / `200` ring). Always
shows the raw status string. Appears on the PNM list row and the detail header.

### Cards / Containers
- **Corner:** 12px (`rounded-xl`).
- **Background:** `surface` white on the `ground` page.
- **Border:** 1px `hairline`.
- **Shadow:** optional hairline `shadow-sm` only (see Elevation).
- **Padding:** caller-applied — `p-4` standard, `p-6` for auth cards,
  `space-y-3 p-4` for forms.
- **Card header pattern:** `border-b border-divider px-4 py-3`, title at
  `font-medium`, often with a `caption` value pushed right.
- **List inside a card:** `divide-y divide-divider`, rows at `px-4 py-3`, the
  whole row a tap target when it links.

### Inputs / Fields
- **Style:** `.field` — full width, 8px radius, `hairline-strong` border,
  white fill, `px-3 py-2`, optional `shadow-sm`. Font is locked to 16px to stop
  iOS zoom-on-focus. Textareas reuse `.field` verbatim.
- **Label:** `.label` above the control — `text-sm font-medium text-label`,
  block, `mb-1`.
- **Focus:** border switches to `ledger-ink` with a matching `ring-1`; the
  native outline is removed.
- **Error:** the field does **not** change. A `text-sm text-red-600` line
  appears beneath it.
- **Disabled:** no dedicated field style; disabled state is expressed on the
  submit button.

### Navigation
A single horizontal tab row in the header. Tabs are `flex-1` (equal width),
`text-sm font-medium`, `py-3`, `text-center`, with a 2px bottom border.
Active: `border-ledger-ink text-ledger-ink`. Inactive: `border-transparent
text-muted`, hover `text-gray-700`. Tabs render by role — "Brothers" shows for
exec only. There is no other navigation: no drawer, no hamburger, no
breadcrumb.

### Signature Component — QuickLogCard
The physical form of the product's core principle. A `card p-4` whose main
content is the full-width sized-up primary button ("Log a contact"). Below it, a
single underlined text link reveals an all-optional detail region (method chips,
a notes textarea, an event field, a back-date picker) separated by a
`border-t border-divider` rule. Pressing the button writes the entry
immediately — date and brother only — then swaps in a green confirmation strip
that offers "Add details" against the entry just created. Nothing in the detail
region can block or gate the log.

### Inline feedback patterns
- **Error:** bare `text-sm text-red-600` line. No box, no icon.
- **Success:** `rounded-lg bg-green-50 px-3 py-2`, `text-green-800` message,
  `text-green-900 underline` action.
- **Warning:** `card border-amber-300 bg-amber-50 p-4`, `text-amber-900`. The
  only tinted full panel.

## Do's and Don'ts

### Do:
- **Do** build every accent on **Ledger Ink** (`#111827`) and treat blue /
  indigo / amber / green / red strictly as the pipeline-status and
  form-feedback vocabulary.
- **Do** keep surfaces flat: structure with `hairline` (`#e5e7eb`) borders and
  `divider` (`#f3f4f6`) rules, and use the `shadow-sm` hairline only as a light
  lift on cards and fields.
- **Do** use 8px radius on controls, 12px on cards, and `rounded-full` with
  `ring-1 ring-inset` on badges and chips so selection never shifts layout.
- **Do** hold every screen to one `max-w-3xl` column designed for one-handed
  phone use; `sm:` (640px) is the only breakpoint.
- **Do** make the screen's primary action a full-width button, and size the one
  true action — logging a contact — up to `text-base` / `py-3`.
- **Do** put optional inputs behind a disclosure link so the fast path stays a
  single control.
- **Do** report a form error as a `text-sm text-red-600` line under the field,
  leaving the field's own styling untouched.
- **Do** keep type on the system stack at weights 400 / 500 / 600.

### Don't:
- **Don't** add a second brand color, a gradient, or a tinted header.
- **Don't** add drop shadows for emphasis, hover elevation, or depth stacking —
  there is no elevation language to extend.
- **Don't** place a required field, a modal, or a confirmation step in front of
  logging a contact.
- **Don't** build a hamburger or drawer nav; the top tab bar is the navigation
  at every width.
- **Don't** introduce web fonts, weight 300, or weight 700.
- **Don't** recolor, outline, or animate a field to signal an error.
- **Don't** reach for SaaS-dashboard moves — illustrated empty states,
  stat-card shadows, accent CTAs, entrance animations. This is a ledger, not a
  landing page.
