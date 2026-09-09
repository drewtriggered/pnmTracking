#!/usr/bin/env node
/**
 * Bootstraps the first exec brother and prints a claim link.
 *
 * Nothing in the app can create the first exec, because creating a brother
 * record is itself exec-gated — so this runs once, from your machine, with
 * Admin SDK credentials that bypass the security rules.
 *
 *   1. Firebase console > Project settings > Service accounts > Generate key
 *   2. Save it as serviceAccountKey.json in the repo root (it is gitignored)
 *   3. npm run seed:admin -- --name "Your Name" --phone "5551234567"
 *
 * Or point GOOGLE_APPLICATION_CREDENTIALS at the key file instead.
 */
import { readFileSync, existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    phone: { type: 'string', default: '' },
    url: { type: 'string', default: 'http://localhost:5173' },
  },
});

if (!values.name) {
  console.error('Usage: npm run seed:admin -- --name "Your Name" [--phone 5551234567] [--url https://your-app.web.app]');
  process.exit(1);
}

const KEY_PATH = 'serviceAccountKey.json';

// Without this check the Admin SDK falls back to ambient Google credentials,
// which on a laptop don't exist, and the failure surfaces 40 lines later as
// "Unable to detect a Project Id" — which tells you nothing about the real
// problem, a missing key file.
if (!existsSync(KEY_PATH) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(`Could not find ${KEY_PATH} in ${process.cwd()}

Firebase console -> Project settings -> Service accounts -> Generate new
private key, then save the downloaded file into that folder with exactly
that name. It is gitignored, and you can delete it once you have claimed
your invite code.`);
  process.exit(1);
}

// Pulled from .firebaserc so the ambient-credentials path knows which project
// it is talking to.
const projectId = existsSync('.firebaserc')
  ? JSON.parse(readFileSync('.firebaserc', 'utf8')).projects?.default
  : undefined;

/**
 * The Firebase console hands out several different JSON files, and only one of
 * them is a service account key. Passing the wrong one fails deep inside the
 * Admin SDK with "must contain a string project_id property", which doesn't
 * hint that you grabbed the web config by mistake. So check the shape here and
 * say what the file actually looks like.
 */
function loadServiceAccount() {
  const parsed = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
  if (parsed.project_id && parsed.client_email && parsed.private_key) return parsed;

  const found = Object.keys(parsed).join(', ') || '(nothing)';
  const looksLikeWebConfig = 'apiKey' in parsed || 'appId' in parsed;

  console.error(`${KEY_PATH} is not a service account key.

It contains: ${found}
${
  looksLikeWebConfig
    ? `
That is the web app config — the apiKey/appId block that belongs in .env, not
here.`
    : ''
}
A service account key has "type": "service_account" plus "project_id",
"client_email" and "private_key". Get one from:

  Firebase console -> Project settings -> Service accounts
  -> Generate new private key

(That is a different page from Project settings -> General, where the web
config lives.)`);
  process.exit(1);
}

initializeApp(
  existsSync(KEY_PATH)
    ? { credential: cert(loadServiceAccount()) }
    : { credential: applicationDefault(), projectId },
);

const db = getFirestore();

// Same alphabet as the client so a seeded code looks like any other.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTWXYZ';
function generateCode() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}

const existingExec = await db.collection('brothers').where('role', '==', 'exec').limit(1).get();
if (!existingExec.empty) {
  console.warn(
    `Heads up: an exec already exists (${existingExec.docs[0].data().name}). ` +
      'Adding another. Use the Brothers screen in the app for routine invites.',
  );
}

const brotherRef = await db.collection('brothers').add({
  name: values.name.trim(),
  phone: values.phone.trim(),
  role: 'exec',
  assignedPnmIds: [],
  uid: null,
  createdAt: FieldValue.serverTimestamp(),
});

const code = generateCode();
await db.collection('invites').doc(code).set({
  brotherId: brotherRef.id,
  brotherName: values.name.trim(),
  role: 'exec',
  createdBy: 'seed-script',
  createdAt: FieldValue.serverTimestamp(),
  claimedByUid: null,
  claimedAt: null,
});

console.log(`\nExec brother created: ${values.name} (${brotherRef.id})`);
console.log(`Invite code:  ${code}`);
console.log(`Claim link:   ${values.url.replace(/\/$/, '')}/join?code=${code}\n`);
console.log('Sign in with Google at that link to link your account. The code is single-use.');
