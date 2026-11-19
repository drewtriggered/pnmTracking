# PNM Tracking

A phone-first React + TypeScript + Vite PWA on Firebase (Firestore, Auth with Google sign-in, Cloud Messaging, scheduled Cloud Functions) that a SigEp chapter uses to track potential new members (PNMs) through recruitment. Read PRODUCT.md for who uses it and why, and DESIGN.md before any UI change.

## Commands

- `npm run dev` starts the local app.
- `npm run lint` type-checks (`tsc -b --noEmit`). Run it before saying a change is done.
- `npm run test:unit` runs the reminder and import unit tests.
- `npm run test:rules` runs Firestore rules tests in the emulator; run it after any change to `firestore.rules`.
- `functions/` is its own package (Node 22): `cd functions && npm run build`.

## Rules

- Never run any `deploy` script, `firebase deploy`, or `seed:admin` without Drew saying so in this session. They change the live chapter app.
- Never commit `.env`, service account keys, or real PNM or brother data. Use made-up data in tests and examples.
- Logging a contact must stay one tap; optional fields can never block a log (see PRODUCT.md).
- Every Firestore read is gated on chapter membership; keep `firestore.rules` and `tests/rules.test.ts` in step.

## How this file improves itself

Run `/lessons` at the end of a session. It reviews the session for corrections and mistakes, proposes short rules, and adds only the ones Drew approves to the Lessons section below. Keep this file under about 150 lines; move topic-specific rules into `.claude/rules/`.

## Lessons

<!-- Approved by /lessons. One line each: - YYYY-MM-DD: rule -->
