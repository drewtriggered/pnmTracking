---
name: PNM Tracking
description: A fraternity chapter's recruiting war-room board, one-handed on a phone.
colors:
  board: "#161513"
  board-edge: "#0d0c0b"
  board-rail: "#2b2926"
  orange: "#E4571C"
  orange-bright: "#F26B2E"
  orange-deep: "#B23E12"
  orange-onboard: "#FB8B57"
  bone: "#F3ECDD"
  bone-bright: "#FBF7EE"
  bone-aged: "#E7DCC4"
  ink: "#211E1A"
  ink-soft: "#4A443B"
  ink-faint: "#6B6253"
  chalk: "#E9E2D2"
  chalk-dim: "#A69C88"
  sigep-red: "#6E1327"
  sigep-purple: "#3B1F4A"
  sigep-gold: "#C6A24A"
  stage-identified: "#8A8079"
  stage-contacted: "#2563A8"
  stage-building: "#4B3E9E"
  stage-bid: "#B0741A"
  stage-pledged: "#2F7D4F"
  stage-dropped: "#9A3324"
  feedback-error: "#C0392B"
  feedback-warning: "#B0741A"
typography:
  wordmark:
    fontFamily: "'Barlow Condensed', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.13em"
  motto:
    fontFamily: "'Barlow Condensed', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.1em"
  plate-name:
    fontFamily: "'Barlow Condensed', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "0.02em"
  headline:
    fontFamily: "'Barlow Condensed', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
  section-head:
    fontFamily: "'Barlow Condensed', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.16em"
  label:
    fontFamily: "'Barlow Condensed', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "0.12em"
  stamp:
    fontFamily: "'Barlow Condensed', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.1em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "2px"
  md: "3px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.bone-bright}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.orange-bright}"
    textColor: "{colors.bone-bright}"
  button-primary-cta:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.bone-bright}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
    width: "100%"
  button-secondary:
    backgroundColor: "{colors.bone-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-danger:
    backgroundColor: "{colors.bone-bright}"
    textColor: "{colors.sigep-red}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  button-ghost-dark:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  field:
    backgroundColor: "{colors.bone-bright}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.body}"
  plate:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 12px 12px 20px"
  card:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  tag:
    backgroundColor: "{colors.bone-bright}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
    typography: "{typography.stamp}"
  tag-selected:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.bone-bright}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  status-tape:
    backgroundColor: "{colors.stage-contacted}"
    width: "10px"
  nav-tab:
    textColor: "{colors.chalk-dim}"
    padding: "12px"
    typography: "{typography.section-head}"
  nav-tab-active:
    textColor: "{colors.chalk}"
    padding: "12px"
    typography: "{typography.section-head}"
---

# Design System: PNM Tracking

## Overview

**Creative North Star: "The Recruiting Big Board"**

PNM Tracking is the chapter's recruiting war-room board, carried in a pocket. It
is the wall where every potential new member is a physical name plate that moves
through position columns toward a bid — and where a plate that nobody has
touched in a while visibly yellows and curls at the corner. The interface is
built from that scene: a near-black enamel board, bone name plates lifted off it
on real shadow, a strip of colored tape down each plate's edge for pipeline
stage, a grease-pencil date stamp, and jersey-condensed lettering on every
label. It is used one-handed, mid-conversation, at a loud rush event, by a
brother who needs to see who has gone quiet and mark that a contact happened.

Two references are refused, not one. The first is the app's own predecessor: an
austere monochrome ledger where a single ink color did all the work and nothing
on screen carried heat — correct, unloved, unlooked-at. The second is the
generic answer to "make it branded": a SaaS dashboard with a tinted header, a
rounded status pill, and an accent-colored button. This system is neither. Stage
is *where a plate sits* and *what color its tape is*, not a cell in a table.
Time since contact is *how weathered the plate looks*, not only a number. The
identity is athletic and institutional — Indiana Tech orange and black, the
Sigma Phi Epsilon crest and its red / purple / gold — and it is spent on the
board's furniture, never on the pipeline data.

**Key Characteristics:**
- A warm near-black enamel board (`#161513`) as the ground; bone plates
  (`#F3ECDD`) carry all the reading, lifted on a real cast shadow.
- Indiana Tech warrior orange (`#E4571C`) is the one working hue — the masthead
  rule, the add-a-name action, the active tab. SigEp red / purple / gold are
  crest-and-chrome only.
- Six fixed stage hues live on the status tape and its glyph and nowhere else.
- Barlow Condensed (jersey / scoreboard lettering) for every display and label
  string; the system stack for body prose. No third face.
- Sharp corners (2px on controls, 3px on cards); rectilinear, no clipping except
  the tape's torn ends and the plate's curling corner.
- One column at every width, `max-w-3xl`, `sm:` (640px) the only breakpoint.
- One authored motion moment: the contact stamp pressing onto the record.

## Colors

A three-ground system — enamel board, bone plate, ink text — with Indiana Tech
orange as the single working accent, a locked six-part stage vocabulary on the
tape, and the SigEp crest palette reserved for chrome.

### Primary
- **Warrior Orange** (`#E4571C`): Indiana Tech's driving hue and the only accent
  that touches a control. Fills the primary/CTA button ("+ PNM", "Log a
  contact"), the 3px masthead rule, the active nav tab's underline, the
  selected filter chip, and the field focus border/ring. On the near-black board
  it is also the text caret and the selection highlight.
- **Orange Bright** (`#F26B2E`): the one-step-lighter fill a primary button
  takes on hover.
- **Orange On-Board** (`#FB8B57`): a lightened orange used *only* for small
  orange text sitting directly on the board ground (the "Nobody goes cold"
  motto), where `#E4571C` at caption size falls under 4.5:1. ~7.9:1 on
  `#161513`.
- **Orange Deep** (`#B23E12`): reserved deep tone; available for a pressed or
  on-light orange surface.

### Secondary — SigEp conference palette
Used on the crest, the masthead chrome, and the pledged mark. Never on pipeline
status, never as a call to action.
- **SigEp Purple** (`#3B1F4A`): the crest's shield field.
- **SigEp Gold** (`#C6A24A`): the crest's star and edge stroke; the "· exec"
  role tag in the masthead; the glyph on a pledged plate.
- **SigEp Red** (`#6E1327`): the 1px rule stacked directly under the orange
  masthead rule (school hue over fraternity hue); the danger-button text and
  border.

### Tertiary — Stage vocabulary
Six fixed hues, one per pipeline stage, sourced from `STAGE_META` in
`src/lib/stages.tsx`. Each appears as the plate's left-edge tape and, tinting
`currentColor`, its drawn stage glyph. Nowhere else.
- **Identified** (`#8A8079`, warm grey): entered, nothing more.
- **Contacted** (`#2563A8`, blue): first real interaction logged.
- **Building** (`#4B3E9E`, indigo): sustained contact underway.
- **Bid extended** (`#B0741A`, ochre): the decisive stage — a yellow-orange kept
  distinct from Warrior Orange.
- **Pledged** (`#2F7D4F`, green): terminal success; its glyph renders in SigEp
  gold.
- **Dropped** (`#9A3324`, muted red): out of the pipeline; its column collapses.

### Neutral
- **Board** (`#161513`): the enamel ground behind everything; the masthead; the
  page `background`. Warm near-black — never a blue-black slate. Carries two
  fixed radial gradients (a top sheen, an edge vignette) so it reads as a
  surface, not a fill.
- **Board Rail** (`#2b2926`) / **Board Edge** (`#0d0c0b`): the hairline inset
  beneath the nav row, and reserved for a deeper board seam.
- **Bone** (`#F3ECDD`): plate and card stock. Every plate also mixes toward
  `#E0CFA8` on a 0–62% scale as it ages (see The Weathering Rule).
- **Bone Bright** (`#FBF7EE`): field fills, filter-chip fills, the fresh end of
  a plate.
- **Ink** (`#211E1A`): plate text — names, values, the stage glyph. Warm
  near-black.
- **Ink Soft** (`#4A443B`): the major·lead subline, secondary body, secondary
  button text. ~7:1 on bone.
- **Ink Faint** (`#6B6253`): timestamps, helper text, placeholder text, the
  "Met at" line.
- **Chalk** (`#E9E2D2`): text on the board ground — the wordmark, section
  headers, the active nav tab.
- **Chalk Dim** (`#A69C88`): the identity microline, counts, inactive nav tabs,
  the back-link, the spinner label.

### Named Rules
**The Hue-Is-Stage Rule.** The six stage hues exist only on the status tape and
its glyph. A stage hue used to decorate, to draw a control, or as a brand accent
is a bug. Pipeline meaning is the only meaning these colors carry.

**The Conference-Colours Rule.** SigEp red, purple, and gold appear only in the
crest, the masthead chrome, the "· exec" tag, and the pledged glyph. They are
never a call to action and never touch pipeline status.

**The One-Accent Rule.** Orange is the single working hue. There is no second
brand accent and no gradient text, ever. Anything on screen that is not orange,
a stage hue, a feedback hue, or the SigEp chrome is board, bone, ink, or chalk.

## Typography

**Display / Label Font:** Barlow Condensed (500 / 600 / 700), loaded from Google
Fonts with `display=swap`. It carries the masthead wordmark, plate names,
section headers, every control and field label, buttons, filter chips, and the
grease-pencil stamps.
**Body Font:** the platform UI stack —
`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
— for paragraph prose, notes, contact-log entries, and input values.

**Character:** Barlow Condensed is jersey and scoreboard lettering: narrow,
upright, athletic, set in caps with open tracking so a name reads across a room.
The system body face keeps the reading matter (notes, a phone number, a log
entry) native and instant on the phone the app runs on. The contrast between the
two — stamped condensed caps against plain sentences — is the type system.

### Hierarchy
- **Headline** (600, 1.5rem, ~1.0, +0.02em, caps): a PNM's name on the detail
  view; "New PNM" on the form.
- **Motto** (600, 1.125rem, ~1.0, +0.1em, caps): the standing "Nobody goes
  cold" line in the masthead, in Orange On-Board.
- **Wordmark** (600, 1rem, ~1.0, +0.13em, caps): "SigEp · Indiana Tech" in the
  masthead and sign-in lockup.
- **Plate name** (600, 1.125rem, ~1.15, +0.02em, caps): the PNM's name on a
  board plate.
- **Section head** (600, 0.875rem, +0.16em, caps): a stage column header on the
  board; a card's section title.
- **Body** (400, 0.875rem, ~1.45): notes, log entries, input values, the
  subline under a heading.
- **Label** (600, 0.75rem, +0.12em, caps): field labels, button text, nav tabs.
- **Stamp** (600, 0.75rem, +0.1em, caps, tabular-nums, rotated −1.5°): the
  grease-pencil date on a plate ("TODAY", "12D", "NEVER"); a log entry's date.
- **Caption** (400, 0.6875rem): the identity microline, counts, the "on the
  board" tally.

### Named Rules
**The Two-Family Rule.** Barlow Condensed for every display, label, and control
string; the system stack for body prose. No third face, and nothing lighter than
weight 500 on the condensed face.

**The Stamp-Case Rule.** Every condensed string is set in uppercase. A condensed
lowercase run is not part of this system.

## Layout

**Column.** Every screen is one centered column capped at `max-w-3xl` (48rem)
with `px-4` gutters. No sidebar, no second column — denser views (a future
dashboard, a leaderboard) stack within the cap. The design target is a phone in
one hand; the wide cap only keeps line length sane on a laptop.

**Masthead.** `sticky top-0 z-20` on the board ground: a row of crest +
wordmark + identity microline, with "Sign out" pushed right; the "Nobody goes
cold" motto on its own line, left-aligned to the wordmark. Then the 3px orange
rule, a 1px SigEp-red rule, and a full-width row of nav tabs with a
`board-rail` inset beneath.

**The board.** The PNM list is grouped into pipeline columns rendered as a
vertical stack of sections in fixed stage order (Identified → Contacted →
Building → Bid extended → Pledged), each led by a chalk section rule with the
stage name and a count, plates beneath sorted stalest-first. `Dropped` is a
collapsed `<details>` at the bottom. Section stack `space-y-6`; plates within a
section `space-y-2.5`.

**Content.** `py-5`, cards separated by `space-y-4`. Card internals `space-y-3`.
Form fields group as `grid gap-3`, one column on mobile, `sm:grid-cols-2` from
640px. Every `<select>` and `.field` carries `min-width: 0` so it collapses
cleanly in the one-column layout.

**Full-screen prompts.** Sign-in and invite-claim center a `max-w-sm` bone card
vertically on the board ground, the crest lockup above it.

**Breakpoints.** `sm:` (640px) only.

### Named Rules
**The Board-Order Rule.** The list is always the board: grouped into pipeline
columns, fixed order, stalest plate on top of each column. Position in the room
is progress. A flat unordered list is not an option.

**The One-Column Rule.** Nothing is ever placed beside the main column.

## Elevation & Depth

The board is a physical scene, so this system uses **real cast shadow** — a
deliberate reversal of the predecessor's flat printed-page rule. A name plate on
a board sits above the board and drops a shadow; that is the depth model. Shadow
is structural (it says "this is an object on the board"), never decorative and
never a hover flourish.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 1px 2px rgba(0,0,0,0.28), 0 8px 18px -6px rgba(0,0,0,0.5)`):
  every plate and card. A close contact shadow plus a soft lifted shadow.
- **Plate flat** (`box-shadow: 0 1px 2px rgba(0,0,0,0.35)`): a plate while
  pressed (`:active`) — it settles onto the board.
- **Tape** (`box-shadow: 0 1px 1px rgba(0,0,0,0.3)`): the status strip and the
  inline tape tag, so the tape reads as applied *onto* the plate.
- **Enamel** (two fixed radial gradients on `body`): a soft top sheen and an
  edge vignette from a single top origin — never a linear band that smears
  across a long scroll.

### Named Rules
**The Object-On-Board Rule.** Shadow means "physical object resting on the
board." Plates and cards carry it at rest; nothing deepens it on hover (a plate
lifts 1px on hover via transform, not shadow); no other surface invents a new
elevation.

## Shapes

Rectilinear and hard-edged. Two working radii: **2px** (`rounded-sm`) on every
control — buttons, fields, chips, plates, the tape strip — and **3px**
(`rounded-md`) on cards and the notes inset. Badges and the spinner are
`rounded-full`. Corners are otherwise square.

The only non-rectangular geometry is world-specific and functional: the status
tape's ends are torn (a top/bottom `mask-image` fade) and it sits at a −0.6°
angle with an inner grain gradient, so it reads as applied tape rather than a
CSS border; an aging plate's bottom-right corner carries a curl shadow whose
opacity scales with `--age`; and the chalk section rule is a 3px band masked
into uneven dashes and skips.

## Components

Every control is solid and unadorned — a rectangle with a 2px radius, a fill or
a thin border, condensed caps, and a single-property hover.

### Buttons
- **Shape:** 2px radius, `inline-flex`, centered, `gap-2`, condensed caps
  (`text-base`, +0.08em), 150ms color transition; disabled drops to 50% opacity.
- **Primary:** Warrior Orange fill, bone-bright text. Hover → Orange Bright.
  The screen's main action; goes full-width. The one true action — "Log a
  contact" — sizes up to `py-3.5 text-lg`.
- **Secondary:** bone-bright fill, `ink/25` border, ink text. Hover → bone.
- **Danger:** bone-bright fill, `sigep-red/40` border, SigEp-red text. Hover →
  `sigep-red/10`. Destructive actions only.
- **Ghost (dark):** transparent, `chalk/25` border, chalk text. Hover →
  `white/10`. Used on the board ground — the masthead "Sign out".
- **Tertiary:** a plain condensed-caps underlined text link in Ink Faint
  ("Add details (optional)").

### Chips (filters)
- **Style:** `.tag` — 2px radius, `ink/25` border, bone-bright fill, condensed
  caps (`text-xs`, +0.08em), Ink Soft. Hover → bone. Used for "My names" and the
  major / sport / interest `<select>`s.
- **Selected:** `.tag-on` — Warrior Orange fill, bone-bright text, orange
  border.

### Status tape
- **Strip:** a 10px-wide element absolutely positioned at the plate's left
  edge, overhanging top and bottom by 3px, rotated −0.6°, with a repeating grain
  gradient and mask-faded ends and its own `tape` shadow. The stage hue is an
  inline `background-color` from `STAGE_META`. It is **not** a `border-left`.
- **Inline tag:** `.tape-tag` — the stage word on a scrap of tape (the stage
  hue as background, bone-bright text, condensed caps) with the drawn glyph, for
  the detail header. Text comes from `STAGE_LABEL` (Titlecase), never the raw
  enum.
- **Glyph:** a 16px authored SVG per stage (ring / dot / bars / rising triangle
  / star / cross), one consistent weight, tinting `currentColor` — Ink on a
  plate, SigEp Gold on a pledged plate.

### Cards / Containers
- **Corner:** 3px.
- **Background:** Bone on the board ground, with a faint top-light gradient.
- **Border:** none — the cast shadow does the separating.
- **Shadow:** `plate` (see Elevation).
- **Padding:** `p-4` standard; `p-6` for auth cards.
- **Card header pattern:** `border-b border-ink/10 px-4 py-3`, title in Section
  Head type, a stamp or value pushed right.

### Inputs / Fields
- **Style:** `.field` — full width, `min-width: 0`, 2px radius, `ink/30` border,
  Bone Bright fill, `px-3 py-2`. Font locked to 16px against iOS zoom. Textareas
  reuse it.
- **Label:** `.label` above the control — condensed caps, `text-xs`, +0.12em,
  Ink Soft, `mb-1`.
- **Focus:** border → Warrior Orange with a matching 1px ring; native outline
  removed. Everything else keeps the global `focus-visible` orange ring.
- **Error:** the field is untouched; a `text-sm text-feedback-error` line
  appears beneath it.

### Navigation
One horizontal tab row in the masthead, below the orange + red rules. Tabs are
`flex-1`, condensed caps (`text-sm`, +0.07em), `py-3`, `text-center`, 2px bottom
border. Active: orange border, `white/5` fill, Chalk text. Inactive: transparent
border, Chalk Dim, hover → Chalk. Tabs render by role — "Roster" shows for exec
only. No drawer, no hamburger, no breadcrumb.

### Signature Component — the Plate
A PNM as a name plate on the board. `.plate` is a Bone card with a
`pl-5` gutter for the tape. It carries, left to right: the status tape strip;
the PNM's name in condensed caps; a `major · lead` subline in Ink Soft; and, at
the top-right, the stage glyph over the grease-pencil date stamp. The stock
color is `color-mix(bone, #E0CFA8 calc(var(--age) * 62%))` where `--age` is
`daysSince(lastContact) / escalateAfterDays` clamped to 0–1, and a
`::after` corner-curl shadow fades in on the same `--age`. Tapping a plate opens
the detail view (the plate "pulled" and enlarged). Hover lifts it 1px via
transform.

### Signature Component — QuickLogCard
The one-tap logger, unchanged in behavior from the ledger era: a bone card whose
body is the sized-up orange "Log a contact" button. Pressing it writes the entry
immediately (date + brother only) and swaps in a confirmation strip where the
word **"Logged · today"** presses on as a grease-pencil stamp — the system's one
authored motion (`stamp-in`, ~400ms, ease-out-quint, a press-past-and-settle in
the keyframe scale, `prefers-reduced-motion` collapses it). Optional detail
fields (method chips, notes, event, back-date) sit behind a disclosure link and
never gate the log.

### Inline feedback
- **Error:** a bare `text-sm text-feedback-error` line. No box.
- **Success:** `.note-ok` — a `stage-pledged/12` strip, SigEp-green text.
- **Warning:** `.note-warn` — a `feedback-warning` bordered/tinted panel. The
  duplicate-detection notice on PNM creation.

## Do's and Don'ts

### Do:
- **Do** build every accent on Warrior Orange (`#E4571C`), lightened to
  `#FB8B57` for small text on the board ground, and keep the six stage hues on
  the tape and its glyph only.
- **Do** ground every screen on the enamel board (`#161513`) and do all reading
  on Bone plates lifted with the `plate` cast shadow.
- **Do** set every display, label, and control string in Barlow Condensed
  uppercase; keep body prose on the system stack.
- **Do** render the PNM list as the board — grouped into fixed-order pipeline
  columns with chalk section rules and counts, stalest plate on top.
- **Do** weather a plate continuously with time since contact (stock yellows,
  corner curls), capped at the escalation threshold.
- **Do** keep a plate's reading surface ink-on-bone; let color onto a plate only
  as the tape edge and the stamp's threshold tone.
- **Do** use 2px corners on controls and 3px on cards; keep everything
  rectilinear.
- **Do** route stage names through `STAGE_LABEL` everywhere they render as text.
- **Do** hold every screen to one `max-w-3xl` column; `sm:` (640px) is the only
  breakpoint.

### Don't:
- **Don't** reintroduce the monochrome ledger — a single ink color on white with
  no heat is the world this replaced.
- **Don't** reach for the SaaS-dashboard move either: a tinted header, a rounded
  status pill, an accent-colored button floating on a white card.
- **Don't** put SigEp red / purple / gold on a control or on pipeline status;
  they are crest and chrome.
- **Don't** render the status tape as a CSS `border-left` — it is an applied,
  textured, mask-torn strip with its own shadow.
- **Don't** add a second display face, a weight below 500 on the condensed face,
  or a condensed string in lowercase.
- **Don't** deepen a shadow on hover or invent a new elevation; a plate lifts
  1px by transform.
- **Don't** add motion beyond the 150ms state transitions and the single
  contact-stamp moment.
- **Don't** place a required field, a modal, or a confirmation step in front of
  logging a contact.
- **Don't** build a drawer or hamburger nav; the top tab row is the navigation
  at every width.
