#!/usr/bin/env node
/**
 * Imports the chapter's PNM spreadsheet into Firestore.
 *
 *   npm run import:pnms                                     # preview pnm-list.csv
 *   npm run import:pnms -- --file "My Sheet.csv"            # preview
 *   npm run import:pnms -- --file "My Sheet.csv" --commit   # write
 *
 * Dry run by default: it prints exactly what it would create, against your
 * live data, before touching anything.
 *
 * Safe to run twice — a PNM whose name already exists is skipped, so you can
 * import, fix a few leads in the app, and re-run to pick up the stragglers.
 *
 * The whole sheet is read and parsed before any credential is asked for, so a
 * mistyped filename costs you a second rather than a service account key.
 */
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { parseArgs } from 'node:util';
import { parsePnmCsv } from './lib/parsePnmCsv.mjs';
import { CsvInputError, readCsvText, resolveCsvFile } from './lib/resolveCsvFile.mjs';

const USAGE =
  'Usage: npm run import:pnms -- --file "your-sheet.csv" [--commit] [--create-leads]';

/** Anything the user can fix by re-running gets the message, never a stack. */
function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

let values;
let positionals;
try {
  ({ values, positionals } = parseArgs({
    options: {
      file: { type: 'string' },
      commit: { type: 'boolean', default: false },
      'create-leads': { type: 'boolean', default: false },
    },
    // A filename with spaces that lost its quotes arrives as loose words;
    // resolveCsvFile puts them back together rather than crashing on them.
    allowPositionals: true,
  }));
} catch (error) {
  fail(`${error.message}\n\n${USAGE}`);
}

let file;
let text;
try {
  const input = resolveCsvFile({ file: values.file, positionals });
  file = input.path;
  input.notes.forEach((note) => console.log(note));
  text = readCsvText(file);
} catch (error) {
  if (error instanceof CsvInputError) fail(error.message);
  throw error;
}

const shownPath = relative(process.cwd(), file) || file;

let pnms;
let warnings;
try {
  ({ pnms, warnings } = parsePnmCsv(text));
} catch (error) {
  fail(
    `${shownPath} does not look like the PNM sheet: ${error.message}\n\n` +
      'The importer needs the "Potential New Member List" tab, exported whole —\n' +
      'title rows and all — with its First Name / Last Name / Lead columns.',
  );
}

if (pnms.length === 0) {
  fail(
    `${shownPath} has the right columns but no PNM rows under them.\n\n` +
      'Check you exported the tab with the names on it.',
  );
}

const KEY_PATH = 'serviceAccountKey.json';
if (!existsSync(KEY_PATH)) {
  fail(`Could not find ${KEY_PATH} in ${process.cwd()}

Firebase console -> Project settings -> Service accounts -> Generate new
private key, save it here with that name, and delete it when you are done.`);
}

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = await import('firebase-admin/firestore');

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

const [brotherSnap, existingSnap] = await Promise.all([
  db.collection('brothers').get(),
  db.collection('pnms').get(),
]);

const brothers = brotherSnap.docs.map((doc) => ({ id: doc.id, name: doc.data().name ?? '' }));
const existingNames = new Set(
  existingSnap.docs.map((doc) => String(doc.data().name ?? '').trim().toLowerCase()),
);

/**
 * The sheet identifies leads however the chapter talks — first names, last
 * names, nicknames. Match on either part of a brother's name; the first cell
 * name that resolves wins, since a PNM has one lead of record.
 */
function matchLead(leadNames) {
  for (const candidate of leadNames) {
    const needle = candidate.toLowerCase();
    const hit = brothers.find((brother) => {
      const full = brother.name.toLowerCase();
      return full === needle || full.split(/\s+/).includes(needle);
    });
    if (hit) return { id: hit.id, matched: candidate };
  }
  return null;
}

const plan = [];
const unmatchedLeads = new Map();

for (const pnm of pnms) {
  if (existingNames.has(pnm.name.toLowerCase())) {
    plan.push({ pnm, action: 'skip', reason: 'already in the app' });
    continue;
  }
  const lead = matchLead(pnm.leadNames);
  if (!lead && pnm.leadNames.length > 0) {
    for (const name of pnm.leadNames) {
      unmatchedLeads.set(name, (unmatchedLeads.get(name) ?? 0) + 1);
    }
  }
  plan.push({ pnm, action: 'create', lead });
}

const creating = plan.filter((entry) => entry.action === 'create');
const skipping = plan.filter((entry) => entry.action === 'skip');

console.log(`\nParsed ${pnms.length} rows from ${shownPath}\n`);
for (const entry of plan) {
  const { pnm, lead, action } = entry;
  const leadLabel =
    action === 'skip'
      ? 'skipped'
      : lead
        ? `lead: ${lead.matched}`
        : pnm.leadNames.length
          ? `lead: UNMATCHED (${pnm.leadNames.join(', ')})`
          : 'lead: none';
  console.log(
    `  ${action === 'skip' ? '-' : '+'} ${pnm.name.padEnd(18)} ${pnm.status.padEnd(22)} ${leadLabel}`,
  );
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach((warning) => console.log(`  ${warning}`));
}

if (unmatchedLeads.size > 0) {
  console.log('\nLead names with no matching brother record:');
  for (const [name, count] of unmatchedLeads) {
    console.log(`  ${name} (${count} PNM${count === 1 ? '' : 's'})`);
  }
  console.log(
    values['create-leads']
      ? '  -> will be created as general brothers (no invite codes issued)'
      : '  -> those PNMs import unassigned. Add the brothers in the app and re-run,\n     or pass --create-leads to create them now.',
  );
}

if (!values.commit) {
  console.log(
    `\nDry run. ${creating.length} to create, ${skipping.length} to skip.` +
      '\nRe-run with --commit to write.\n',
  );
  process.exit(0);
}

// Create any missing lead records first, so the PNMs can point at them.
if (values['create-leads']) {
  for (const name of unmatchedLeads.keys()) {
    const ref = await db.collection('brothers').add({
      name,
      phone: '',
      role: 'general',
      assignedPnmIds: [],
      uid: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    brothers.push({ id: ref.id, name });
    console.log(`Created brother ${name}`);
  }
}

let created = 0;
for (const entry of creating) {
  const { pnm } = entry;
  const lead = entry.lead ?? matchLead(pnm.leadNames);
  const ref = db.collection('pnms').doc();

  const batch = db.batch();
  batch.set(ref, {
    name: pnm.name,
    nameLower: pnm.name.toLowerCase(),
    phone: pnm.phone,
    email: pnm.email,
    socials: pnm.socials,
    major: pnm.major,
    year: pnm.year,
    gpa: pnm.gpa,
    notes: pnm.notes,
    sourceEvent: pnm.sourceEvent,
    sports: pnm.sports,
    hobbies: pnm.hobbies,
    interests: pnm.interests,
    assignedLead: lead?.id ?? null,
    status: pnm.status,
    contactLog: [],
    // Nobody has logged a contact in the app yet, so this stays null. The
    // reminder job falls back to createdAt, which carries the sheet's real
    // "Date Added" — so an imported PNM counts as cold from when the chapter
    // actually met him rather than from import day.
    lastContactedDate: null,
    createdBy: 'import-script',
    createdAt: pnm.addedOn ? Timestamp.fromDate(pnm.addedOn) : FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  if (lead) {
    batch.update(db.doc(`brothers/${lead.id}`), {
      assignedPnmIds: FieldValue.arrayUnion(ref.id),
    });
  }
  await batch.commit();
  created++;
}

console.log(`\nCreated ${created} PNMs, skipped ${skipping.length}.\n`);
