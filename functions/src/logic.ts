/**
 * Pure reminder logic — no Firebase imports, so it can be unit tested and
 * shared with the client (which reads the same thresholds so the UI and the
 * notifications never disagree about who is cold).
 */

export interface NotificationVariant {
  id: string;
  /** Shown to reminder admins when comparing results. */
  label: string;
  title: string;
  /** Supports {count} and {name} placeholders. */
  body: string;
  /** Relative share of brothers assigned to this variant. */
  weight: number;
}

export interface ReminderExperiment {
  /** Bump this to reshuffle assignments and start a clean experiment. */
  id: string;
  enabled: boolean;
  variants: NotificationVariant[];
}

export interface ReminderSettings {
  /** Master switch — off means the daily job does nothing. */
  enabled: boolean;
  /** Days without contact before the assigned lead is nudged. */
  coldAfterDays: number;
  /** Days without contact before exec is told. */
  escalateAfterDays: number;
  escalationEnabled: boolean;
  /** Local hour (0-23) to send at, in timeZone. */
  sendHour: number;
  timeZone: string;
  /** Where a tapped notification opens. */
  appUrl: string;
  experiment: ReminderExperiment;
}

export const DEFAULT_VARIANT: NotificationVariant = {
  id: 'default',
  label: 'Plain',
  title: 'PNMs going cold',
  body: '{count} of your PNMs need a check-in. {name} is the coldest.',
  weight: 1,
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: true,
  coldAfterDays: 5,
  escalateAfterDays: 10,
  escalationEnabled: true,
  sendHour: 18,
  timeZone: 'America/New_York',
  appUrl: '',
  experiment: { id: 'v1', enabled: false, variants: [DEFAULT_VARIANT] },
};

/** Statuses that take a PNM out of the pipeline — no point nudging about them. */
export const CLOSED_STATUSES = ['pledged', 'dropped'];

export interface PnmSnapshot {
  id: string;
  name: string;
  status: string;
  assignedLead: string | null;
  /**
   * Milliseconds of the last contact, or of when the PNM was added if there
   * has never been one. A brand-new PNM must not read as infinitely cold.
   */
  lastTouchedMs: number;
}

export interface Digest {
  brotherId: string;
  kind: 'lead' | 'escalation';
  pnmIds: string[];
  /** The most overdue PNM, used in the message body. */
  oldestName: string;
  oldestDays: number;
}

/** Whole days between two instants, floored. */
export function daysBetween(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / 86_400_000);
}

/** The YYYY-MM-DD date in a given zone, used as the once-a-day run marker. */
export function dayKey(nowMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(nowMs));
}

/** Local hour (0-23) in a given zone. */
export function hourInZone(nowMs: number, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).format(
      new Date(nowMs),
    ),
  );
}

/**
 * Works out who hears about what.
 *
 * One digest per brother rather than one push per PNM: a lead with eight cold
 * PNMs gets a single message, because eight notifications is how an app gets
 * its permission revoked.
 *
 * Exec escalation deliberately covers only PNMs whose lead is someone else (or
 * nobody), so an exec who is also the lead isn't pinged twice about the same
 * person, and unowned PNMs still surface to somebody.
 */
export function computeDigests(input: {
  pnms: PnmSnapshot[];
  execBrotherIds: string[];
  settings: ReminderSettings;
  nowMs: number;
}): Digest[] {
  const { pnms, execBrotherIds, settings, nowMs } = input;

  const live = pnms.filter((pnm) => !CLOSED_STATUSES.includes(pnm.status));
  const aged = live
    .map((pnm) => ({ pnm, days: daysBetween(pnm.lastTouchedMs, nowMs) }))
    .sort((a, b) => b.days - a.days);

  const digests: Digest[] = [];

  // Per-lead digests.
  const byLead = new Map<string, { pnm: PnmSnapshot; days: number }[]>();
  for (const item of aged) {
    if (!item.pnm.assignedLead) continue;
    if (item.days < settings.coldAfterDays) continue;
    const list = byLead.get(item.pnm.assignedLead) ?? [];
    list.push(item);
    byLead.set(item.pnm.assignedLead, list);
  }
  for (const [brotherId, items] of byLead) {
    digests.push({
      brotherId,
      kind: 'lead',
      pnmIds: items.map((i) => i.pnm.id),
      oldestName: items[0].pnm.name,
      oldestDays: items[0].days,
    });
  }

  // Exec escalation.
  if (settings.escalationEnabled) {
    const escalated = aged.filter(
      (item) => item.days >= settings.escalateAfterDays,
    );
    for (const execId of execBrotherIds) {
      const theirs = escalated.filter((item) => item.pnm.assignedLead !== execId);
      if (theirs.length === 0) continue;
      digests.push({
        brotherId: execId,
        kind: 'escalation',
        pnmIds: theirs.map((i) => i.pnm.id),
        oldestName: theirs[0].pnm.name,
        oldestDays: theirs[0].days,
      });
    }
  }

  return digests;
}

/** FNV-1a, so variant assignment is deterministic without storing anything. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Assigns a brother to a variant, stickily.
 *
 * Hashing brother + experiment id means the same person always sees the same
 * copy for the life of an experiment — without which you'd be measuring noise
 * — and bumping the experiment id reshuffles everyone for a clean run.
 */
export function pickVariant(
  experiment: ReminderExperiment,
  brotherId: string,
): NotificationVariant {
  const usable = experiment.variants.filter((v) => v.weight > 0);
  if (!experiment.enabled || usable.length === 0) {
    return experiment.variants[0] ?? DEFAULT_VARIANT;
  }
  if (usable.length === 1) return usable[0];

  const total = usable.reduce((sum, v) => sum + v.weight, 0);
  let point = hash(`${experiment.id}:${brotherId}`) % total;
  for (const variant of usable) {
    point -= variant.weight;
    if (point < 0) return variant;
  }
  return usable[usable.length - 1];
}

/** Fills {count} and {name} in a variant's copy. */
export function renderMessage(
  variant: NotificationVariant,
  digest: Digest,
): { title: string; body: string } {
  const fill = (text: string) =>
    text
      .replaceAll('{count}', String(digest.pnmIds.length))
      .replaceAll('{name}', digest.oldestName)
      .replaceAll('{days}', String(digest.oldestDays));
  return { title: fill(variant.title), body: fill(variant.body) };
}
