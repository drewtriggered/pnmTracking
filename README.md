# PNM Tracking

Rush pipeline tracking for a fraternity chapter — a React + Firebase PWA that
brothers install to their home screen. Phase 1 (auth, PNM CRUD, list/detail) is
built; the reminder system, exec dashboard and CSV import come later.

## What works today

- **Google sign-in gated by one-time invite codes.** Exec creates a brother
  record, which mints a code and a `/join?code=…` link. The first Google
  account to use that code is bound to that brother record, permanently. A
  Google account that has never claimed a code can reach nothing.
- **PNM list** with free-text search and filters by status, major, sport and
  interest, plus an "only mine" toggle.
- **One-tap contact logging.** The *Log a contact* button writes an entry the
  moment it is pressed — date and brother, nothing else required. Method,
  notes and event sit on the same card as optional fields: fill them in first
  and they ride along with the tap, or attach them to the entry afterwards
  from the confirmation. Nothing optional can block a log.
- **PNM detail** with the full contact log and inline status and lead changes.
- **Duplicate detection** on name + phone before a new PNM is inserted.
- **Exec roster**: add brothers, share or revoke invite codes, change roles.
- Installable PWA (manifest + service worker), built mobile-first.

## Getting it running

Steps 1-7 are one-time. Nothing here can be done from code — they need your
Firebase console and your card on file.

1. **Create the Firebase project** (console) and enable:
   - **Firestore** (production mode)
   - **Authentication → Sign-in method → Google**
   - **Hosting**
   - **Cloud Messaging** — under Project settings → Cloud Messaging → Web
     configuration, click *Generate key pair*. That's the VAPID key.

2. **Upgrade to the Blaze plan.** Scheduled Cloud Functions do not run on the
   free Spark plan, so the reminder engine will not work without this. A
   chapter's usage sits inside the free monthly allowances — expect a bill
   near zero — but the card has to be on file. Set a budget alert while
   you're in there.

3. **Wire up config**:
   ```bash
   cp .env.example .env   # Project settings → Your apps → SDK setup
   npm install
   ```
   Fill in `VITE_FIREBASE_VAPID_KEY` from step 1 — without it the
   *Turn on reminders* button can't register a device. The Firebase project
   itself is already set in `.firebaserc`; change it there if you ever point
   this at a different project.

4. **Deploy rules, functions and the app**:
   ```bash
   npm run deploy:rules       # do this first: every read is gated on membership
   npm run deploy:functions   # the daily reminder job
   npm run deploy:hosting     # the app itself
   ```
   The first `deploy:functions` will ask to enable a few Google Cloud APIs
   (Cloud Scheduler, Cloud Build, Artifact Registry). Say yes.

5. **Create the first exec.** Nothing in the app can do this, because creating
   a brother is itself exec-gated. Download a service account key
   (Project settings → Service accounts) to `serviceAccountKey.json`, then:
   ```bash
   npm run seed:admin -- --name "Your Name" --url https://your-app.web.app
   ```
   It prints a claim link. Open it, sign in with Google, and you are exec.
   From then on all invites are generated in the app.

6. **Make yourself a reminder admin.** On the **Brothers** tab, tick
   *Reminder admin* next to your name. Exec alone does not unlock the
   reminder settings — see below.

7. **Configure reminders** on the **Settings** tab: set your timezone, the
   send hour, and the **App URL** (`https://your-project.web.app`) so a tapped
   notification opens the app. Then hit *Turn on reminders* to register your
   device, and *Send me a test* to prove the whole chain works end to end.

8. **Get the brothers on.** Add each one on the Brothers tab, hit *Share* to
   send their invite link, and tell them to install the app to their home
   screen and turn on reminders. On iPhone that install is not optional: iOS
   only delivers web push to a PWA opened from the home screen (Share → Add to
   Home Screen, iOS 16.4+). On Android and desktop Chrome the browser is
   enough.

Day to day: `npm run dev` for local work, `npm run deploy:hosting` to ship.

### Verifying the reminder job

The job runs hourly and acts once a day at your configured hour, so the
fastest way to see it work is *Send me a test* on the Settings tab. To watch
the real thing, set the send hour to the next hour and check the logs:

```bash
npx firebase functions:log --only dailyReminders
```

## Everyday use

Exec adds each brother on the **Brothers** tab and hits **Share** to send the
invite link over GroupMe or text. Each code works once and is tied to one
person's record, so an account can't be pointed at someone else's PNMs.

## Reminders and notification experiments

A scheduled Cloud Function (`functions/src/index.ts`) runs hourly and acts once
a day at the configured hour, pushing to brothers whose PNMs have gone quiet.

- **One digest per brother**, not one push per PNM — a lead with eight cold
  PNMs gets a single message. Eight notifications is how an app gets its
  permission revoked.
- **Escalation to exec** covers only PNMs whose lead is someone else, or who
  have no lead at all, so an exec who is also the lead isn't pinged twice and
  unowned PNMs still surface to somebody.
- **A never-contacted PNM counts from when they were added**, not from the
  epoch, so a PNM added this morning isn't instantly overdue.
- PNMs marked *pledged* or *dropped* are left alone.

**Who can change it.** Tuning thresholds and editing notification copy is
gated on a per-brother `reminderAdmin` flag that exec grants on the Brothers
tab — deliberately *not* the exec role. A whole exec board retuning thresholds
or swapping copy mid-experiment would make the results meaningless.

**Running an experiment.** Add variants on the Settings tab with `{count}`,
`{name}` and `{days}` placeholders, give each a weight, and switch *Running*
on. Each brother is assigned a variant by hashing their id with the experiment
id, so the same person always sees the same copy — otherwise you're measuring
noise, not the message. Bump the experiment ID to reshuffle everyone for a
clean run.

**Reading the results.** The Results table shows sends and act-rate per
variant. "Acted" means the brother logged a contact for one of the PNMs in
that reminder within two weeks. It is computed server-side on a later run from
`lastContactedDate`, and every client write to `reminderSends` is refused, so
nobody can pad their own numbers.

## Data model

- `pnms/{id}` — name, phone, email, socials, major, year, gpa, notes,
  sourceEvent, sports[], hobbies[], interests[], assignedLead, status,
  contactLog[], lastContactedDate. `gpa` is free text on purpose: a chapter
  sheet mixes real GPAs, hearsay ("2.7 HS") and a yes/no against a threshold,
  and forcing a number throws away which of those it is.
  A `contactLog` entry requires only `date` and `brotherId`; `method`, `notes`
  and `event` are stored only when actually filled in, never as a default or a
  guess. `sourceEvent` ("met at") is carried for later event tie-in work — no
  event-specific screens are built yet.
  `contactLog` is an array appended with `arrayUnion`, so two brothers logging
  the same PNM at once cannot clobber each other. `lastContactedDate` is
  derived from it and denormalised onto the document so the reminder job and
  the "going cold" views can query it directly. It only moves forward, so
  back-dating an old conversation never makes a PNM look freshly contacted.
- `brothers/{id}` — name, phone, role (`exec` | `general`), assignedPnmIds[],
  and `uid` once their account is linked. Kept in step with `pnms.assignedLead`
  by batched writes.
- `invites/{code}` — the code *is* the document id. Carries brotherId, name and
  role, because a person claiming a code is not a member yet and cannot read
  the brothers collection.
- `settings/reminders` — thresholds, send time, and the experiment. Readable
  by every member (the UI colours "going cold" from the same numbers the job
  uses, so they can't drift), writable only by reminder admins.
- `reminderSends/{id}` — one row per notification: variant, PNMs, and whether
  the brother acted. Written only by the Cloud Function.
- `userLinks/{uid}` — the membership record. Its existence is what every
  security rule keys off. Role is always read from the brother record, so an
  exec promotion applies immediately.

`status` is one of: identified, contacted, building relationship, bid extended,
pledged, dropped.

## Tests

```bash
npm test             # everything
npm run test:unit    # reminder logic (no emulator needed)
npm run test:rules   # security rules against the Firestore emulator
```

42 tests. The rules suite covers the access gates (signed-out,
signed-in-but-unlinked, member, exec, reminder admin), the invite claim
transaction, code reuse and forgery, role changes, and device registration.
The unit suite covers who gets nudged and when, escalation and its edge cases,
sticky variant assignment, and the timezone helpers.

## Not built yet

In build order:

1. **Leaderboard** — brothers ranked by contacts logged this week, response
   time, and PNMs moved to bid extended, aggregated from `contactLog`.
2. **Exec dashboard** — chapter-wide contact coverage, PNMs going cold, status
   breakdown.

Deferred further out: event-specific tracking screens, in-app CSV upload for
rush sign-in sheets, and lead reassignment history.

## Importing an existing PNM spreadsheet

`scripts/importPnms.mjs` reads the chapter's "Potential New Member List"
export — title block, header partway down, multi-name lead cells and all.

Your sheet is already in the repo as `pnm-list.csv`, so the short form is:

```bash
npm run import:pnms                      # preview, writes nothing
npm run import:pnms -- --commit          # apply
npm run import:pnms -- --commit --create-leads
```

To import a fresh export instead, point `--file` at it. Keep a name with
spaces in quotes, and write the path out in full — `~` does not expand inside
quotes:

```bash
npm run import:pnms -- --file "/Users/you/Downloads/Potential New Member List - Master Sheet.csv"
```

If it cannot find the file it says where it looked and prints the command for
each CSV it can see in the repo, Downloads, Desktop and Documents, so you can
copy the right one back. Nothing needs credentials until the sheet has been
read, so a wrong path costs a second.

It needs `serviceAccountKey.json` in the repo root, same as the seed script.

- **Dry run by default.** It prints every row it would create, against your
  live data, before touching anything.
- **Safe to re-run.** A PNM whose name already exists is skipped, so you can
  import, fix a few leads in the app, and run it again for the stragglers.
- **Leads are matched by name** against existing brothers, on either part of
  the name, so "Koen" or "Lutz" both resolve. Unmatched leads are listed and
  those PNMs import unassigned; `--create-leads` creates the missing brother
  records (no invite codes — issue those from the Brothers tab).
- The sheet's stage numbers map onto app statuses: (0) Notice to Remove →
  dropped, (1) New Name → identified, (2) Introduce to Others → contacted,
  (3) Sell SigEp → building relationship, (5) To Receive Bid → bid extended.
- `Date Added` becomes the PNM's created date, so the reminder job counts a
  PNM as cold from when the chapter actually met him.
- It wants a **CSV**, not the `.xlsx`: in Google Sheets that is
  File → Download → Comma-separated values.
