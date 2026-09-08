import {
  arrayRemove,
  arrayUnion,
  runTransaction,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { normalizePhone } from '../lib/format';
import type { ContactDetails, ContactLogEntry, Pnm, PnmDraft } from '../types/models';

const pnmsRef = collection(db, 'pnms');

export function watchPnms(onChange: (pnms: Pnm[]) => void, onError?: (e: Error) => void) {
  const q = query(pnmsRef, orderBy('nameLower'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Pnm)),
    (err) => onError?.(err),
  );
}

export function watchPnm(pnmId: string, onChange: (pnm: Pnm | null) => void) {
  return onSnapshot(doc(db, 'pnms', pnmId), (snap) => {
    onChange(snap.exists() ? ({ id: snap.id, ...snap.data() } as Pnm) : null);
  });
}

/**
 * Creates a PNM and, when a lead is assigned, mirrors the id onto the
 * brother's assignedPnmIds in the same batch so the two never drift.
 */
export async function createPnm(draft: PnmDraft, createdByUid: string): Promise<string> {
  const ref = doc(pnmsRef);
  const batch = writeBatch(db);
  batch.set(ref, {
    ...draft,
    name: draft.name.trim(),
    nameLower: draft.name.trim().toLowerCase(),
    phone: draft.phone.trim(),
    contactLog: [],
    lastContactedDate: null,
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  if (draft.assignedLead) {
    batch.update(doc(db, 'brothers', draft.assignedLead), { assignedPnmIds: arrayUnion(ref.id) });
  }
  await batch.commit();
  return ref.id;
}

export async function updatePnm(pnmId: string, draft: PnmDraft, previousLead: string | null) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'pnms', pnmId), {
    ...draft,
    name: draft.name.trim(),
    nameLower: draft.name.trim().toLowerCase(),
    phone: draft.phone.trim(),
    updatedAt: serverTimestamp(),
  });
  applyLeadSwap(batch, pnmId, previousLead, draft.assignedLead);
  await batch.commit();
}

export async function assignLead(pnmId: string, previousLead: string | null, nextLead: string | null) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'pnms', pnmId), { assignedLead: nextLead, updatedAt: serverTimestamp() });
  applyLeadSwap(batch, pnmId, previousLead, nextLead);
  await batch.commit();
}

function applyLeadSwap(
  batch: ReturnType<typeof writeBatch>,
  pnmId: string,
  previousLead: string | null,
  nextLead: string | null,
) {
  if (previousLead === nextLead) return;
  if (previousLead) {
    batch.update(doc(db, 'brothers', previousLead), {
      assignedPnmIds: arrayRemove(pnmId),
    });
  }
  if (nextLead) {
    batch.update(doc(db, 'brothers', nextLead), { assignedPnmIds: arrayUnion(pnmId) });
  }
}

export async function setStatus(pnmId: string, status: Pnm['status']) {
  await updateDoc(doc(db, 'pnms', pnmId), { status, updatedAt: serverTimestamp() });
}

export async function deletePnm(pnm: Pnm): Promise<void> {
  if (pnm.assignedLead) {
    await updateDoc(doc(db, 'brothers', pnm.assignedLead), {
      assignedPnmIds: arrayRemove(pnm.id),
    });
  }
  await deleteDoc(doc(db, 'pnms', pnm.id));
}

/**
 * Strips blank optional fields so an entry never carries an empty string or a
 * guessed method. Firestore also rejects undefined values outright.
 */
function cleanDetails(details: ContactDetails): ContactDetails {
  const cleaned: ContactDetails = {};
  if (details.method) cleaned.method = details.method;
  if (details.notes?.trim()) cleaned.notes = details.notes.trim();
  if (details.event?.trim()) cleaned.event = details.event.trim();
  return cleaned;
}

/** lastContactedDate only ever moves forward, so back-dating an older
 *  conversation can't make a PNM look freshly contacted. */
function advanceContactDate(current: Pnm['lastContactedDate'], date: Timestamp) {
  return !current || date.toMillis() > current.toMillis() ? { lastContactedDate: date } : {};
}

/**
 * Appends a contact entry. Only the date and the brother are required — a
 * one-tap log with no details at all is a complete, valid entry.
 *
 * arrayUnion makes the append atomic, so two brothers logging the same PNM at
 * once can't clobber each other. Returns the new entry's id so the caller can
 * offer to attach details to it afterwards.
 */
export async function logContact(
  pnm: Pnm,
  entry: { brotherId: string; date: Date; details?: ContactDetails },
): Promise<string> {
  const date = Timestamp.fromDate(entry.date);
  const id = crypto.randomUUID();

  await updateDoc(doc(db, 'pnms', pnm.id), {
    contactLog: arrayUnion({
      id,
      date,
      brotherId: entry.brotherId,
      ...cleanDetails(entry.details ?? {}),
    }),
    ...advanceContactDate(pnm.lastContactedDate, date),
    updatedAt: serverTimestamp(),
  });
  return id;
}

/**
 * Attaches (or edits) the optional half of an existing entry — the path for a
 * brother who taps first and remembers the details a moment later.
 *
 * arrayUnion can't rewrite an element in place, so this reads and rewrites the
 * array in a transaction. The transaction retries on conflict, so a concurrent
 * append from another brother is preserved rather than overwritten.
 */
export async function updateContactDetails(
  pnmId: string,
  entryId: string,
  details: ContactDetails,
): Promise<void> {
  const ref = doc(db, 'pnms', pnmId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;

    const log = (snap.data().contactLog ?? []) as ContactLogEntry[];
    const next = log.map((entry) =>
      entry.id === entryId
        ? { id: entry.id, date: entry.date, brotherId: entry.brotherId, ...cleanDetails(details) }
        : entry,
    );
    tx.update(ref, { contactLog: next, updatedAt: serverTimestamp() });
  });
}

/**
 * Duplicate detection on name + phone, used by the create form now and by the
 * CSV import in Phase 5. Phone is compared digits-only so "(555) 123-4567"
 * and "5551234567" collide; when no phone is on file, the name alone counts.
 */
export async function findDuplicates(name: string, phone: string): Promise<Pnm[]> {
  const nameLower = name.trim().toLowerCase();
  if (!nameLower) return [];

  const digits = normalizePhone(phone);
  const byName = await getDocs(query(pnmsRef, where('nameLower', '==', nameLower)));
  return byName.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Pnm)
    .filter((existing) => !digits || !existing.phone || normalizePhone(existing.phone) === digits);
}
