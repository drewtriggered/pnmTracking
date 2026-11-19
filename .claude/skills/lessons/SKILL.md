---
name: lessons
description: Review this session for mistakes and corrections, propose short rules to prevent them, and add only the rules the user approves to CLAUDE.md. Run when the user types /lessons or asks what Claude learned this session.
disable-model-invocation: true
---

# /lessons: turn this session's mistakes into rules

You are closing the self-improvement loop for this project. Nothing gets written until the user approves it.

## 1. Look back over this session

Find every moment where:

- the user corrected you, undid your change, or told you "no, do it this way"
- you retried a command or edit because the first try failed
- a test, build, lint or script failed because of something you did
- you had to ask a question that a written rule would have answered

Skip one-off typos and anything caused by outside tools being down.

## 2. Draft rules

For each moment, write one rule:

- one line, starting with a verb ("Run `npm run lint` before saying a change is done")
- specific to this project, true every time, and checkable
- not already covered by CLAUDE.md, CLAUDE.local.md or `.claude/rules/` (read them first)
- no secrets, names of real people, or personal data

Label each rule **Project** (goes in this repo's CLAUDE.md) or **Global** (true for all of the user's projects, goes in `~/.claude/CLAUDE.md`).

If nothing in the session deserves a rule, say "No new lessons this session." and stop.

## 3. Ask before writing

Show the numbered list of proposed rules with the moment that caused each one, in one short line each. Ask which to keep. Wait for the answer. Do not edit any file yet.

## 4. Write only what was approved

- Add each approved Project rule under `## Lessons` in this repo's CLAUDE.md, as `- YYYY-MM-DD: <rule>`. Create the section at the end of the file if it is missing. Never rewrite or delete the user's existing content.
- Add each approved Global rule the same way to `~/.claude/CLAUDE.md`, only if that file exists or the user says to create it.
- Show the diff of what you changed.

## 5. Keep it lean

If CLAUDE.md is now over 150 lines, or two lessons overlap or contradict, suggest which to merge, delete, or move into `.claude/rules/`. Suggest only; change nothing without approval.
