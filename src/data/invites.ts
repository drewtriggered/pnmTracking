import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generateInviteCode } from '../lib/codes';
import type { BrotherRole, Invite } from '../types/models';

export class InviteError extends Error {}

/**
 * Exec-only: mint a one-time code bound to one brother record.
 *
 * The brother's name and role are copied onto the invite because a person
 * claiming a code is not a member yet and so cannot read the brothers
 * collection — the invite has to carry everything the join screen and the
 * claim need. Rules still check the role against the brother record before
 * accepting the link, so a tampered invite buys nothing.
 */
export async function createInvite(
  brotherId: string,
  brotherName: string,
  role: BrotherRole,
  createdByUid: string,
): Promise<string> {
  const code = generateInviteCode();
  await setDoc(doc(db, 'invites', code), {
    brotherId,
    brotherName,
    role,
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
    claimedByUid: null,
    claimedAt: null,
  });
  return code;
}

export async function revokeInvite(code: string): Promise<void> {
  await deleteDoc(doc(db, 'invites', code));
}

export function watchInvites(onChange: (invites: Invite[]) => void) {
  const q = query(collection(db, 'invites'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ code: d.id, ...d.data() }) as Invite));
  });
}

/**
 * Binds the signed-in account to the brother record the code was issued for.
 *
 * All three writes go in one transaction so a half-claimed state can't exist:
 * the invite is burned, the brother record gets the uid, and the userLink that
 * every security rule keys off is created.
 *
 * Only the invite is read. The claimer is not a member yet, so reading the
 * brother record would itself be denied — the rules do that check instead,
 * refusing the bind unless the invite is unclaimed and the record is unowned.
 */
export async function claimInvite(code: string, uid: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const inviteRef = doc(db, 'invites', code);
    const inviteSnap = await tx.get(inviteRef);
    if (!inviteSnap.exists()) {
      throw new InviteError('That code is not valid. Ask exec for a new one.');
    }

    const invite = inviteSnap.data() as Omit<Invite, 'code'>;
    if (invite.claimedByUid) {
      throw new InviteError(
        invite.claimedByUid === uid
          ? 'You have already used this code.'
          : 'That code has already been used by someone else.',
      );
    }

    tx.update(inviteRef, { claimedByUid: uid, claimedAt: serverTimestamp() });
    tx.update(doc(db, 'brothers', invite.brotherId), {
      uid,
      inviteCode: code,
      claimedAt: serverTimestamp(),
    });
    tx.set(doc(db, 'userLinks', uid), {
      brotherId: invite.brotherId,
      role: invite.role,
      inviteCode: code,
    });
  });
}

/** Look up who a code is for, so the join screen can confirm before claiming. */
export async function peekInvite(code: string): Promise<Invite | null> {
  const snap = await getDoc(doc(db, 'invites', code));
  return snap.exists() ? ({ code: snap.id, ...snap.data() } as Invite) : null;
}
