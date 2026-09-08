import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, runTransaction, setDoc, updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

let env: RulesTestEnvironment;

const CODE = 'ABCDEFGHJK';
const OTHER_CODE = 'MNPQRSTWXY';

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'pnm-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => env?.cleanup());

/** Seed a chapter: one exec (linked), one unclaimed brother with an invite. */
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'brothers/exec1'), {
      name: 'Exec Ellis', phone: '', role: 'exec', assignedPnmIds: [], uid: 'exec-uid',
    });
    await setDoc(doc(db, 'userLinks/exec-uid'), {
      brotherId: 'exec1', role: 'exec', inviteCode: 'SEEDSEEDSE',
    });
    await setDoc(doc(db, 'brothers/gen1'), {
      name: 'General Gray', phone: '', role: 'general', assignedPnmIds: [], uid: 'gen-uid',
    });
    await setDoc(doc(db, 'userLinks/gen-uid'), {
      brotherId: 'gen1', role: 'general', inviteCode: 'SEEDSEEDSF',
    });
    // The record a newcomer will claim.
    await setDoc(doc(db, 'brothers/new1'), {
      name: 'New Nolan', phone: '', role: 'general', assignedPnmIds: [], uid: null,
    });
    await setDoc(doc(db, 'invites/' + CODE), {
      brotherId: 'new1', brotherName: 'New Nolan', role: 'general',
      createdBy: 'exec-uid', claimedByUid: null, claimedAt: null,
    });
    // An invite pointing at an already-linked brother.
    await setDoc(doc(db, 'invites/' + OTHER_CODE), {
      brotherId: 'gen1', brotherName: 'General Gray', role: 'general',
      createdBy: 'exec-uid', claimedByUid: null, claimedAt: null,
    });
    await setDoc(doc(db, 'pnms/pnm1'), {
      name: 'Rush Rick', nameLower: 'rush rick', phone: '5550001111', email: '',
      socials: {}, major: 'CS', sports: [], hobbies: [], interests: [],
      assignedLead: 'gen1', status: 'identified', contactLog: [],
      lastContactedDate: null, createdBy: 'gen-uid',
    });
  });
});

const exec = () => env.authenticatedContext('exec-uid').firestore();
const member = () => env.authenticatedContext('gen-uid').firestore();
const stranger = () => env.authenticatedContext('stranger-uid').firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe('membership gate', () => {
  it('blocks signed-out users from PNMs', async () => {
    await assertFails(getDoc(doc(anon(), 'pnms/pnm1')));
  });

  it('blocks a signed-in account that has not claimed an invite', async () => {
    await assertFails(getDoc(doc(stranger(), 'pnms/pnm1')));
    await assertFails(getDocs(collection(stranger(), 'pnms')));
  });

  it('lets a linked member read and update PNMs', async () => {
    await assertSucceeds(getDoc(doc(member(), 'pnms/pnm1')));
    await assertSucceeds(updateDoc(doc(member(), 'pnms/pnm1'), { status: 'contacted' }));
  });

  it('lets a member create a PNM only as themselves', async () => {
    const base = {
      name: 'X', nameLower: 'x', phone: '', email: '', socials: {}, major: '',
      sports: [], hobbies: [], interests: [], assignedLead: null,
      status: 'identified', contactLog: [], lastContactedDate: null,
    };
    await assertSucceeds(setDoc(doc(member(), 'pnms/newpnm'), { ...base, createdBy: 'gen-uid' }));
    await assertFails(setDoc(doc(member(), 'pnms/spoofed'), { ...base, createdBy: 'exec-uid' }));
  });

  it('reserves PNM deletion for exec', async () => {
    await assertFails(deleteDoc(doc(member(), 'pnms/pnm1')));
    await assertSucceeds(deleteDoc(doc(exec(), 'pnms/pnm1')));
  });
});

describe('invite claiming', () => {
  /**
   * Mirrors claimInvite(): all three writes in one transaction, which is what
   * makes them legal. Rules evaluate a transaction against the pre-transaction
   * state, so the brother-bind rule still sees the invite as unclaimed even
   * though the same transaction is burning it. Firing these as three
   * independent writes would (correctly) be denied.
   */
  async function claim(uid: string, code: string, brotherId: string, role = 'general') {
    const db = env.authenticatedContext(uid).firestore();
    return runTransaction(db, async (tx) => {
      // The real claim reads the invite and nothing else; reading the brother
      // record here would be denied, which is why the role rides on the invite.
      await tx.get(doc(db, 'invites/' + code));
      tx.update(doc(db, 'invites/' + code), { claimedByUid: uid, claimedAt: new Date() });
      tx.update(doc(db, 'brothers/' + brotherId), { uid, inviteCode: code, claimedAt: new Date() });
      tx.set(doc(db, 'userLinks/' + uid), { brotherId, role, inviteCode: code });
    });
  }

  it('lets a stranger with a valid code claim the record it names', async () => {
    await assertSucceeds(claim('stranger-uid', CODE, 'new1'));
    // ...and the account is a member afterwards.
    await assertSucceeds(getDoc(doc(stranger(), 'pnms/pnm1')));
  });

  it('can read its own invite but not the brother record it names', async () => {
    // The constraint that shapes the claim: a not-yet-member is allowed to
    // read the code they were handed, and nothing else.
    await assertSucceeds(getDoc(doc(stranger(), 'invites/' + CODE)));
    await assertFails(getDoc(doc(stranger(), 'brothers/new1')));
  });

  it('refuses a claim once the code has been burned outside the transaction', async () => {
    // Order matters: burning the invite first invalidates the brother bind,
    // so a partial or replayed claim cannot complete.
    const db = env.authenticatedContext('stranger-uid').firestore();
    await updateDoc(doc(db, 'invites/' + CODE), {
      claimedByUid: 'stranger-uid', claimedAt: new Date(),
    });
    await assertFails(
      updateDoc(doc(db, 'brothers/new1'), {
        uid: 'stranger-uid', inviteCode: CODE, claimedAt: new Date(),
      }),
    );
  });

  it('refuses a claim against a brother record that is already linked', async () => {
    await assertFails(
      updateDoc(doc(stranger(), 'brothers/gen1'), {
        uid: 'stranger-uid', inviteCode: OTHER_CODE, claimedAt: new Date(),
      }),
    );
  });

  it('refuses a second claim of the same code', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'invites/' + CODE), { claimedByUid: 'stranger-uid' });
    });
    const db = env.authenticatedContext('thief-uid').firestore();
    await assertFails(updateDoc(doc(db, 'invites/' + CODE), { claimedByUid: 'thief-uid' }));
    await assertFails(
      setDoc(doc(db, 'userLinks/thief-uid'), {
        brotherId: 'new1', role: 'general', inviteCode: CODE,
      }),
    );
  });

  it('refuses a link that claims a role the brother record does not have', async () => {
    await assertFails(
      setDoc(doc(env.authenticatedContext('stranger-uid').firestore(), 'userLinks/stranger-uid'), {
        brotherId: 'new1', role: 'exec', inviteCode: CODE,
      }),
    );
  });

  it('refuses a link for someone else s uid', async () => {
    await assertFails(
      setDoc(doc(env.authenticatedContext('stranger-uid').firestore(), 'userLinks/other-uid'), {
        brotherId: 'new1', role: 'general', inviteCode: CODE,
      }),
    );
  });

  it('refuses a fabricated code', async () => {
    await assertFails(
      setDoc(doc(env.authenticatedContext('stranger-uid').firestore(), 'userLinks/stranger-uid'), {
        brotherId: 'new1', role: 'general', inviteCode: 'MADEUPCODE',
      }),
    );
  });

  it('hides the list of outstanding codes from non-exec', async () => {
    await assertFails(getDocs(collection(member(), 'invites')));
    await assertSucceeds(getDocs(collection(exec(), 'invites')));
  });
});

describe('roles and self-service', () => {
  it('reserves brother creation and role changes for exec', async () => {
    await assertFails(
      setDoc(doc(member(), 'brothers/sneak'), {
        name: 'Sneak', phone: '', role: 'exec', assignedPnmIds: [], uid: null,
      }),
    );
    await assertFails(updateDoc(doc(member(), 'brothers/gen1'), { role: 'exec' }));
    await assertSucceeds(updateDoc(doc(exec(), 'brothers/gen1'), { role: 'exec' }));
  });

  it('lets a brother edit their own name and phone but not their role', async () => {
    await assertSucceeds(updateDoc(doc(member(), 'brothers/gen1'), { phone: '5559998888' }));
    await assertFails(updateDoc(doc(member(), 'brothers/gen1'), { name: 'G', role: 'exec' }));
    await assertFails(updateDoc(doc(member(), 'brothers/exec1'), { phone: '5550000000' }));
  });

  it('applies an exec promotion immediately, without re-claiming', async () => {
    // gen-uid's userLink still says "general"; the brother record is the truth.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'brothers/gen1'), { role: 'exec' });
    });
    await assertSucceeds(getDocs(collection(member(), 'invites')));
  });
});
