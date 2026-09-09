import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import {
  computeDigests,
  DEFAULT_REMINDER_SETTINGS,
  dayKey,
  hourInZone,
  pickVariant,
  pushMessageFor,
  renderMessage,
  tapTarget,
  type Digest,
  type PnmSnapshot,
  type ReminderSettings,
} from './logic';

initializeApp();
const db = getFirestore();

const SETTINGS_DOC = db.doc('settings/reminders');
const STATE_DOC = db.doc('settings/reminderState');

async function readSettings(): Promise<ReminderSettings> {
  const snap = await SETTINGS_DOC.get();
  const stored = snap.exists ? (snap.data() as Partial<ReminderSettings>) : {};
  // Merged rather than replaced, so a settings doc written by an older version
  // of the app still runs with sane values for anything it doesn't mention.
  return {
    ...DEFAULT_REMINDER_SETTINGS,
    ...stored,
    experiment: { ...DEFAULT_REMINDER_SETTINGS.experiment, ...(stored.experiment ?? {}) },
  };
}

interface BrotherRow {
  id: string;
  name: string;
  role: string;
  fcmTokens: string[];
}

async function loadChapter() {
  const [pnmSnap, brotherSnap] = await Promise.all([
    db.collection('pnms').get(),
    db.collection('brothers').get(),
  ]);

  const pnms: PnmSnapshot[] = pnmSnap.docs.map((doc) => {
    const data = doc.data();
    const last = (data.lastContactedDate ?? data.createdAt) as Timestamp | null;
    return {
      id: doc.id,
      name: data.name ?? 'Unnamed',
      status: data.status ?? 'identified',
      assignedLead: data.assignedLead ?? null,
      // A PNM with neither date is treated as touched now rather than as
      // infinitely overdue — better to miss one nudge than to spam on bad data.
      lastTouchedMs: last ? last.toMillis() : Date.now(),
    };
  });

  const brothers: BrotherRow[] = brotherSnap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name ?? '',
    role: doc.data().role ?? 'general',
    fcmTokens: (doc.data().fcmTokens ?? []) as string[],
  }));

  return { pnms, brothers };
}

/**
 * Pushes a digest and records the send.
 *
 * The reminderSends row is what makes the experiment measurable: variant,
 * who, which PNMs, and (filled in on a later run) whether they acted.
 */
async function deliver(
  digest: Digest,
  brother: BrotherRow,
  settings: ReminderSettings,
  day: string,
) {
  const variant = pickVariant(settings.experiment, brother.id);
  const { title, body } = renderMessage(variant, digest);

  let delivered = 0;
  if (brother.fcmTokens.length > 0) {
    const response = await getMessaging().sendEachForMulticast({
      tokens: brother.fcmTokens,
      ...pushMessageFor({
        title,
        body,
        kind: digest.kind,
        variantId: variant.id,
        appUrl: settings.appUrl,
      }),
    });
    delivered = response.successCount;

    // A brother with tokens and nothing delivered is the shape of a broken
    // setup rather than a quiet day, and it is invisible without this line.
    if (delivered === 0) {
      logger.warn(`No device reached for ${brother.name || brother.id}`, {
        brotherId: brother.id,
        errors: response.responses
          .filter((result) => !result.success)
          .map((result) => result.error?.code ?? 'unknown'),
      });
    }

    // Drop tokens the device has thrown away, or they accumulate forever.
    const dead: string[] = [];
    response.responses.forEach((result, i) => {
      if (result.success) return;
      const code = result.error?.code ?? '';
      if (
        code.includes('registration-token-not-registered') ||
        code.includes('invalid-argument')
      ) {
        dead.push(brother.fcmTokens[i]);
      }
    });

    if (dead.length > 0) {
      await db.doc(`brothers/${brother.id}`).update({
        fcmTokens: FieldValue.arrayRemove(...dead),
      });
    }
  }

  await db.collection('reminderSends').add({
    brotherId: brother.id,
    kind: digest.kind,
    pnmIds: digest.pnmIds,
    variantId: variant.id,
    experimentId: settings.experiment.id,
    title,
    body,
    day,
    devicesReached: delivered,
    sentAt: FieldValue.serverTimestamp(),
    actedAt: null,
  });

  return delivered;
}

/**
 * Closes the loop on earlier sends: did the brother actually log a contact for
 * one of the PNMs they were nudged about? That ratio is the number an A/B test
 * is comparing, so it is computed server-side rather than trusted to a client.
 */
async function markActedSends(pnmLastContact: Map<string, number>) {
  const pending = await db
    .collection('reminderSends')
    .where('actedAt', '==', null)
    .limit(500)
    .get();

  const cutoff = Date.now() - 14 * 86_400_000;
  const writes = pending.docs.map(async (doc) => {
    const data = doc.data();
    const sentAt = (data.sentAt as Timestamp | null)?.toMillis();
    if (!sentAt) return;

    // Stop watching a send after two weeks; anything later isn't a response.
    if (sentAt < cutoff) {
      await doc.ref.update({ actedAt: null, expired: true });
      return;
    }

    const acted = (data.pnmIds as string[]).some(
      (pnmId) => (pnmLastContact.get(pnmId) ?? 0) > sentAt,
    );
    if (acted) await doc.ref.update({ actedAt: FieldValue.serverTimestamp() });
  });

  await Promise.all(writes);
}

/**
 * Runs hourly but acts once a day, at the hour the chapter configured.
 *
 * Hourly + a zoned day marker keeps the send time editable from the settings
 * screen; a fixed cron would need a redeploy to move it, and moving it is
 * exactly the sort of thing an engagement experiment wants to try. The marker
 * is claimed in a transaction so a retry can't double-send.
 */
export const dailyReminders = onSchedule(
  { schedule: '0 * * * *', timeZone: 'UTC', retryCount: 1 },
  async () => {
    const settings = await readSettings();
    if (!settings.enabled) {
      logger.info('Reminders are switched off; nothing to do.');
      return;
    }

    const nowMs = Date.now();
    if (hourInZone(nowMs, settings.timeZone) !== settings.sendHour) return;

    const day = dayKey(nowMs, settings.timeZone);
    const claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(STATE_DOC);
      if (snap.exists && snap.data()?.lastRunDay === day) return false;
      tx.set(STATE_DOC, { lastRunDay: day, lastRunAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) {
      logger.info(`Already ran for ${day}.`);
      return;
    }

    const { pnms, brothers } = await loadChapter();

    await markActedSends(new Map(pnms.map((pnm) => [pnm.id, pnm.lastTouchedMs])));

    const digests = computeDigests({
      pnms,
      execBrotherIds: brothers.filter((b) => b.role === 'exec').map((b) => b.id),
      settings,
      nowMs,
    });

    const byId = new Map(brothers.map((b) => [b.id, b]));
    let sent = 0;
    for (const digest of digests) {
      const brother = byId.get(digest.brotherId);
      if (!brother) continue;
      sent += await deliver(digest, brother, settings, day);
    }

    logger.info(`Reminders for ${day}: ${digests.length} digests, ${sent} devices reached.`);
  },
);

/**
 * Sends the caller their own reminder message on demand.
 *
 * Without this, verifying push setup or eyeballing new copy means waiting for
 * tomorrow's run. Restricted to reminder admins.
 */
export const sendTestReminder = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const link = await db.doc(`userLinks/${uid}`).get();
  if (!link.exists) throw new HttpsError('permission-denied', 'Not a chapter member.');

  const brotherId = link.data()!.brotherId as string;
  const brotherDoc = await db.doc(`brothers/${brotherId}`).get();
  const brother = brotherDoc.data();
  if (!brother?.reminderAdmin) {
    throw new HttpsError('permission-denied', 'Reminder admins only.');
  }

  const tokens = (brother.fcmTokens ?? []) as string[];
  if (tokens.length === 0) {
    throw new HttpsError('failed-precondition', 'Turn on notifications for this device first.');
  }

  const settings = await readSettings();
  const variant = pickVariant(settings.experiment, brotherId);
  const { title, body } = renderMessage(variant, {
    brotherId,
    kind: 'lead',
    pnmIds: ['sample-1', 'sample-2', 'sample-3'],
    oldestName: 'Sample PNM',
    oldestDays: settings.coldAfterDays + 2,
  });

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    ...pushMessageFor({
      title,
      body,
      kind: 'test',
      variantId: variant.id,
      appUrl: settings.appUrl,
    }),
  });

  // The test exists to prove the chain, so it reports what actually happened
  // to each device instead of a count the caller has to interpret.
  const failures = response.responses
    .filter((result) => !result.success)
    .map((result) => result.error?.message ?? 'unknown error');

  if (response.successCount === 0) {
    throw new HttpsError(
      'unavailable',
      `FCM accepted no device: ${failures.join('; ') || 'no reason given'}. ` +
        'Re-register this device with "Turn on reminders".',
    );
  }

  return {
    variantId: variant.id,
    title,
    body,
    devicesReached: response.successCount,
    devicesFailed: failures.length,
    appUrlUsable: tapTarget(settings.appUrl) !== null,
  };
});
