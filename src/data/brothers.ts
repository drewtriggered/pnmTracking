import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Brother, BrotherRole } from '../types/models';

export function watchBrothers(onChange: (brothers: Brother[]) => void) {
  const q = query(collection(db, 'brothers'), orderBy('name'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Brother));
  });
}

/** Exec-only. The record exists before the person signs in; uid fills in at claim. */
export async function createBrother(input: {
  name: string;
  phone: string;
  role: BrotherRole;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'brothers'), {
    name: input.name.trim(),
    phone: input.phone.trim(),
    role: input.role,
    assignedPnmIds: [],
    uid: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setBrotherRole(brotherId: string, role: BrotherRole): Promise<void> {
  await updateDoc(doc(db, 'brothers', brotherId), { role });
}

/**
 * Grants the capability to tune reminder thresholds and run notification
 * experiments. Exec-only to set, and separate from the exec role itself.
 */
export async function setReminderAdmin(brotherId: string, canManage: boolean): Promise<void> {
  await updateDoc(doc(db, 'brothers', brotherId), { reminderAdmin: canManage });
}

/** Keeps Brother.assignedPnmIds in step with Pnm.assignedLead. */
export async function addPnmToBrother(brotherId: string, pnmId: string): Promise<void> {
  await updateDoc(doc(db, 'brothers', brotherId), { assignedPnmIds: arrayUnion(pnmId) });
}

export async function removePnmFromBrother(brotherId: string, pnmId: string): Promise<void> {
  await updateDoc(doc(db, 'brothers', brotherId), { assignedPnmIds: arrayRemove(pnmId) });
}

export function brotherName(brothers: Brother[], id: string | null | undefined): string {
  if (!id) return 'Unassigned';
  return brothers.find((b) => b.id === id)?.name ?? 'Unknown brother';
}
