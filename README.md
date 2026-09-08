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
- **PNM detail** with the full contact log, a one-tap *Log a contact*, and
  inline status and lead changes.
- **Duplicate detection** on name + phone before a new PNM is inserted.
- **Exec roster**: add brothers, share or revoke invite codes, change roles.
- Installable PWA (manifest + service worker), built mobile-first.

## Setup

1. **Create the Firebase project** (console): enable **Firestore**,
   **Authentication → Google**, and **Hosting**.
2. **Wire up config**:
   ```bash
   cp .env.example .env      # fill in from Project settings → Your apps
   cp .firebaserc.example .firebaserc   # set your project id
   npm install
   ```
3. **Deploy the security rules** — the app is unusable without them, since
   every read is gated on membership:
   ```bash
   npm run deploy:rules
   ```
4. **Create the first exec.** Nothing in the app can do this, because creating
   a brother is itself exec-gated. Download a service account key
   (Project settings → Service accounts) to `serviceAccountKey.json`, then:
   ```bash
   npm run seed:admin -- --name "Your Name" --url https://your-app.web.app
   ```
   It prints a claim link. Open it, sign in with Google, and you are exec.
   From then on all invites are generated in the app.
5. **Run it**: `npm run dev`, or `npm run deploy:hosting` to publish.

## Everyday use

Exec adds each brother on the **Brothers** tab and hits **Share** to send the
invite link over GroupMe or text. Each code works once and is tied to one
person's record, so an account can't be pointed at someone else's PNMs.

## Data model

- `pnms/{id}` — name, phone, email, socials, major, sports[], hobbies[],
  interests[], assignedLead, status, contactLog[], lastContactedDate.
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
- `userLinks/{uid}` — the membership record. Its existence is what every
  security rule keys off. Role is always read from the brother record, so an
  exec promotion applies immediately.

`status` is one of: identified, contacted, building relationship, bid extended,
pledged, dropped.

## Tests

```bash
npm run test:rules   # security rules against the Firestore emulator
```

17 tests cover the access gates (signed-out, signed-in-but-unlinked, member,
exec), the invite claim transaction, code reuse and forgery, and role changes.

## Not built yet

- Phase 3 — daily reminder Cloud Function (5-day nudge to the lead, snooze,
  10-day escalation to exec) and Cloud Messaging registration.
- Exec dashboard — contact coverage, PNMs going cold, status breakdown.
- Lead reassignment history.
- CSV bulk import for rush sign-in sheets (`findDuplicates` in
  `src/data/pnms.ts` is already the shared entry point for it).
