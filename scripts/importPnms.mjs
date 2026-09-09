#!/usr/bin/env node
/**
 * Imports the chapter's PNM spreadsheet into Firestore.
 *
 *   node scripts/importPnms.mjs --file "PNM List.csv"            # preview
 *   node scripts/importPnms.mjs --file "PNM List.csv" --commit   # write
 *
 * Dry run by default: it prints exactly what it would create, against your
 * live data, before touching anything.
 *
 * Safe to run twice — a PNM whose name already exists is skipped, so you can
 * import, fix a few leads in the app, and re-run to pick up the stragglers.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { parsePnmCsv } from './lib/parsePnmCsv.mjs';

const { values } = parseArgs({
  options: {
    file: { type: 'string' },
    commit: { type: 'boolean', default: false },
    'create-leads': { type: 'boolean', default: false },
  },
});

if (!values.file) {
  console.error('Usage: node scripts/importPnms.mjs --file "your.csv" [--commit] [--create-leads]');
  process.exit(1);
}

const KEY_PATH = 'serviceAccountKey.json';
if (!existsSync(KEY_PATH)) {
  console.error(`Could not find ${KEY_PATH} in ${process.cwd()}

Firebase console -> Project settings -> Service accounts -> Generate new
private key, save it here with that name, and delete it when you are done.`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

const { pnms, warnings } = parsePnmCsv(readFileSync(values.file, 'utf8'));

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

console.log(`\nParsed ${pnms.length} rows from ${values.file}\n`);
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
