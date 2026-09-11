# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are active brothers of a single Sigma Phi Epsilon (SigEp) chapter
running recruitment. They work from their phones, between classes and during or
just after rush events, usually while the interaction they are recording is
still fresh.

Two roles plus one capability:

- **General brothers** work the PNMs (potential new members) assigned to them —
  logging contact and moving them through bid stages.
- **Exec** additionally see and manage the whole pipeline: the brother roster,
  invite codes, lead assignments, and PNM deletion.
- **Reminder admin** is a capability exec grants to specific people, not tied to
  the exec role, to tune the reminder thresholds and run notification
  experiments.

## Product Purpose

Keep the chapter's recruitment pipeline visible and moving. Every PNM has one
brother assigned as their lead. The app records who contacted whom and when, and
nudges the lead when their PNM has gone quiet, escalating to exec past a longer
interval. Success is fewer PNMs going cold, more brothers actually logging their
interactions, and exec having a live read on contact coverage — replacing a
shared spreadsheet that held the right data but went unused.

## Positioning

The chapter already tracked all of this in an Excel "Master Sheet." It failed
for behavioral reasons, not data ones: it was not in front of anyone and nothing
prompted action. This tool's difference is the combination of a phone-native,
single-tap logging surface and a daily reminder engine that pushes the assigned
lead when a PNM has not been touched in a configurable number of days — with the
reminder copy, timing, and thresholds built to be experimented on, because the
entire premise is changing brother behavior rather than storing more fields.

## Operating Context

- **Recruitment cycle.** Work happens in bursts around rush events and slows
  between them. The migration source is the chapter's "Potential New Member
  List" spreadsheet (`pnm-list.csv`); an importer (`scripts/importPnms.mjs`)
  maps its stage numbers onto app statuses: (0) Notice to Remove -> dropped,
  (1) New Name -> identified, (2) Introduce to Others -> contacted, (3) Sell
  SigEp -> building relationship, (5) To Receive Bid -> bid extended. `pledged`
  is the terminal success state.
- **A PNM record** carries name, phone, email, socials, major, year, GPA,
  sports, hobbies, interests, standing notes, the event they were met at,
  assigned lead, status, and a contact log. GPA / year / notes are free text
  because the source data mixes real GPAs, hearsay ("2.7 HS"), and a yes/no
  against a 2.75 threshold.
- **A contact log entry** requires only a date and the logging brother. Method,
  notes, and event are optional and can be added to an entry after the fact.
- **Onboarding** is invite-driven: exec creates a brother record, the app
  generates a one-time code and a `/join?code=` link, exec shares it however the
  chapter already communicates (GroupMe, text), and the first Google sign-in
  with that code binds the account to that brother record. The first exec is
  seeded out-of-band with a service-account key (`scripts/seedAdmin.mjs`).
- **Reminders** run as a daily scheduled Cloud Function: one digest per brother
  rather than one push per PNM, escalation to exec at a higher day threshold,
  sticky A/B variant assignment per brother, and a server-computed "did they
  act" rate per variant. iOS delivers web push only to the installed
  (home-screen) PWA; Android and desktop Chrome work in-browser.

## Capabilities and Constraints

**Built:** invite-gated Google auth; PNM create / read / update / delete; list
with search and filters (major, sport, interest, status, assigned-to-me); PNM
detail with one-tap contact logging plus optional method / notes / event; lead
assignment and reassignment, kept in sync with each brother's assigned-PNM list;
the `reminderAdmin` capability; a reminder settings screen (day thresholds, send
hour, timezone, escalation toggle, app URL); a notification experiment editor
with a results table; per-device web-push registration; the daily reminder Cloud
Function; an on-demand test reminder; the CSV importer.

**Not yet built:** the activity leaderboard (brothers ranked by contacts logged,
response time, PNMs advanced); the exec dashboard (chapter-wide coverage, PNMs
going cold, status breakdown); lead reassignment *history*; in-app CSV upload;
any event-specific tracking screens.

**Hard constraint:** authentication is Google sign-in gated by one-time invite
codes — no passwords, no open sign-up, one code binds one account to one brother
record permanently. Future work must not add a sign-in path that bypasses the
invite.

**Architecture:** Firebase only — Firestore, Auth, Cloud Messaging, Cloud
Functions, Hosting. Scheduled functions require the Blaze plan. There is no
server the chapter operates; hosting is static and configuration is injected at
build time through `VITE_FIREBASE_*` environment variables. This reflects the
chapter having no one to run infrastructure; weigh added operational complexity
against that.

**Data model:** `contactLog` is an array on the PNM document, appended
atomically; `lastContactedDate` is denormalized from it and only ever moves
forward.

**Terminology:** PNM (potential new member); lead (the one brother who owns a
PNM relationship); exec vs. general; "going cold" (a PNM past the reminder
threshold); digest (one brother's daily reminder); variant / experiment (the
A/B notification copy).

**Open decisions:** whether and when to extend beyond one chapter — intended
once the tool is proven safe and genuinely useful, then shared with other
local chapters, but not scheduled; whether exec escalation and its ~10-day
threshold stay long term, kept configurable rather than settled.

## Brand Commitments

- **Name:** "PNM Tracking" — a working name, used in the PWA manifest, page
  title, and screen headers. Not confirmed as final.
- **Organization:** Sigma Phi Epsilon. The pipeline stage "Sell SigEp" comes
  from the chapter's own spreadsheet.
- **The SigEp national identity is binding.** The chapter supplied the
  official brand kit (`2026 SigEp Brand Guidelines.pdf` and the Logos archive)
  on 2026-09-11. The masthead, sign-in, and join screens render the real
  SigEp Crest — the shield element only, cropped from the kit's vector
  artwork, full color with the guide's white-outline-on-dark treatment —
  replacing the earlier hand-drawn placeholder; the favicon and PWA
  home-screen icons use it too. Per the brand guide's mark-tier rules, a
  heritage mark like the crest may stand alone only where every surface is
  member-facing (true here — brothers and exec only, never PNMs); it would
  need to travel alongside the master-brand "SigEp" logotype if this tool
  ever became public-facing.
- **The raw brand kit files** (the Logos zip, the guidelines PDF, a SigEp
  Fonts zip) live untracked at the repo root — large binaries not meant for
  git. Only the derived, optimized assets in `public/` are committed.
- **Voice** in the shipped UI is plain and functional: short labels, direct
  error messages that name the actual problem and where to fix it, no marketing
  tone.

## Evidence on Hand

- **`pnm-list.csv`** (repo root) — the chapter's real recruitment pipeline as of
  2026-09-09: 20 named PNMs with leads, majors, sports, and bid stages, one
  carrying chapter notes. Real lead first names appear throughout (Koen, Lutz,
  Tharpe, David, Ricky, Drew, Alex, Angel, and others).
- **Deployment target:** `pnmtracking.web.app` (Firebase project `pnmtracking`),
  being brought online this session.
- **Tests:** 28 unit tests (reminder logic, CSV parsing), 23 Firestore rules
  tests, and a Playwright smoke run of the full sign-in -> claim -> log ->
  settings flow.
- **No adoption data, testimonials, outcome metrics, or press exist.** The
  product has not launched. The premise that reminders and one-tap logging will
  change brother behavior is a hypothesis under test — future work must not
  present it as a demonstrated result or invent usage numbers.

## Product Principles

1. **Visibility beats data richness.** The previous tracker had the right fields
   and still failed because no one looked at it. Judge every feature first on
   whether it gets a brother to look and act.
2. **Logging costs one tap.** Recording *that* a contact happened always
   outranks recording details about it. Detail is invited, never required, and
   never blocks the log.
3. **The system nudges; it does not only record.** A PNM going quiet is the
   app's problem to surface, not the lead's to remember. Reminders, escalation,
   and cold-signal cues are core, not add-ons.
4. **Engagement is the metric under test.** Notification copy, timing, and
   thresholds are instrumented and swappable because behavior change, not
   feature count, is the bet.
5. **Operable by a volunteer.** Setup a motivated exec can do from a laptop; no
   server, no ops role. Anything that needs a maintainer is a design failure in
   this context.
