import { describe, expect, it } from 'vitest';
import {
  computeDigests,
  DEFAULT_REMINDER_SETTINGS,
  dayKey,
  daysBetween,
  hourInZone,
  pickVariant,
  renderMessage,
  type PnmSnapshot,
  type ReminderSettings,
} from '../functions/src/logic';

const NOW = Date.parse('2026-09-20T22:00:00Z');
const days = (n: number) => NOW - n * 86_400_000;

const settings: ReminderSettings = { ...DEFAULT_REMINDER_SETTINGS };

function pnm(over: Partial<PnmSnapshot> & { id: string }): PnmSnapshot {
  return {
    name: over.id,
    status: 'contacted',
    assignedLead: 'b1',
    lastTouchedMs: days(0),
    ...over,
  };
}

describe('who gets nudged', () => {
  it('leaves a PNM alone until the threshold passes', () => {
    const fresh = computeDigests({
      pnms: [pnm({ id: 'p1', lastTouchedMs: days(4) })],
      execBrotherIds: [],
      settings,
      nowMs: NOW,
    });
    expect(fresh).toEqual([]);

    const cold = computeDigests({
      pnms: [pnm({ id: 'p1', lastTouchedMs: days(5) })],
      execBrotherIds: [],
      settings,
      nowMs: NOW,
    });
    expect(cold).toHaveLength(1);
    expect(cold[0]).toMatchObject({ brotherId: 'b1', kind: 'lead', pnmIds: ['p1'] });
  });

  it('sends one digest per brother, not one per PNM', () => {
    const digests = computeDigests({
      pnms: [
        pnm({ id: 'p1', name: 'Older', lastTouchedMs: days(9) }),
        pnm({ id: 'p2', name: 'Newer', lastTouchedMs: days(6) }),
        pnm({ id: 'p3', assignedLead: 'b2', lastTouchedMs: days(7) }),
      ],
      execBrotherIds: [],
      settings,
      nowMs: NOW,
    });
    expect(digests).toHaveLength(2);
    const first = digests.find((d) => d.brotherId === 'b1')!;
    expect(first.pnmIds).toHaveLength(2);
    // The message names the most overdue one.
    expect(first.oldestName).toBe('Older');
    expect(first.oldestDays).toBe(9);
  });

  it('ignores PNMs who have pledged or dropped', () => {
    const digests = computeDigests({
      pnms: [
        pnm({ id: 'p1', status: 'pledged', lastTouchedMs: days(30) }),
        pnm({ id: 'p2', status: 'dropped', lastTouchedMs: days(30) }),
      ],
      execBrotherIds: ['e1'],
      settings,
      nowMs: NOW,
    });
    expect(digests).toEqual([]);
  });

  it('counts a never-contacted PNM from when they were added', () => {
    // lastTouchedMs falls back to createdAt upstream; a PNM added today is
    // not overdue, which is the bug this guards against.
    const digests = computeDigests({
      pnms: [pnm({ id: 'p1', lastTouchedMs: days(0) })],
      execBrotherIds: [],
      settings,
      nowMs: NOW,
    });
    expect(digests).toEqual([]);
  });

  it('does not nudge anyone about an unassigned PNM', () => {
    const digests = computeDigests({
      pnms: [pnm({ id: 'p1', assignedLead: null, lastTouchedMs: days(6) })],
      execBrotherIds: [],
      settings,
      nowMs: NOW,
    });
    expect(digests).toEqual([]);
  });
});

describe('exec escalation', () => {
  it('tells exec about PNMs past the escalation threshold', () => {
    const digests = computeDigests({
      pnms: [pnm({ id: 'p1', lastTouchedMs: days(11) })],
      execBrotherIds: ['e1'],
      settings,
      nowMs: NOW,
    });
    expect(digests.filter((d) => d.kind === 'escalation')).toMatchObject([
      { brotherId: 'e1', pnmIds: ['p1'] },
    ]);
  });

  it('surfaces an unassigned cold PNM to exec even though no lead was nudged', () => {
    const digests = computeDigests({
      pnms: [pnm({ id: 'p1', assignedLead: null, lastTouchedMs: days(12) })],
      execBrotherIds: ['e1'],
      settings,
      nowMs: NOW,
    });
    expect(digests).toHaveLength(1);
    expect(digests[0]).toMatchObject({ brotherId: 'e1', kind: 'escalation' });
  });

  it('does not double-ping an exec who is the lead', () => {
    const digests = computeDigests({
      pnms: [pnm({ id: 'p1', assignedLead: 'e1', lastTouchedMs: days(12) })],
      execBrotherIds: ['e1'],
      settings,
      nowMs: NOW,
    });
    expect(digests).toHaveLength(1);
    expect(digests[0].kind).toBe('lead');
  });

  it('stays quiet when escalation is switched off', () => {
    const digests = computeDigests({
      pnms: [pnm({ id: 'p1', assignedLead: null, lastTouchedMs: days(40) })],
      execBrotherIds: ['e1'],
      settings: { ...settings, escalationEnabled: false },
      nowMs: NOW,
    });
    expect(digests).toEqual([]);
  });

  it('honours custom thresholds', () => {
    const tight = { ...settings, coldAfterDays: 2, escalateAfterDays: 3 };
    const digests = computeDigests({
      pnms: [pnm({ id: 'p1', assignedLead: 'b1', lastTouchedMs: days(3) })],
      execBrotherIds: ['e1'],
      settings: tight,
      nowMs: NOW,
    });
    expect(digests.map((d) => d.kind).sort()).toEqual(['escalation', 'lead']);
  });
});

describe('experiment assignment', () => {
  const variants = [
    { id: 'a', label: 'A', title: 'A', body: 'a', weight: 1 },
    { id: 'b', label: 'B', title: 'B', body: 'b', weight: 1 },
  ];
  const experiment = { id: 'exp1', enabled: true, variants };

  it('gives a brother the same variant every run', () => {
    const first = pickVariant(experiment, 'brother-7');
    for (let i = 0; i < 20; i++) {
      expect(pickVariant(experiment, 'brother-7').id).toBe(first.id);
    }
  });

  it('splits a chapter across both variants', () => {
    const seen = new Set(
      Array.from({ length: 200 }, (_, i) => pickVariant(experiment, `brother-${i}`).id),
    );
    expect(seen).toEqual(new Set(['a', 'b']));
  });

  it('reshuffles when the experiment id changes', () => {
    const before = Array.from({ length: 200 }, (_, i) => pickVariant(experiment, `b${i}`).id);
    const after = Array.from({ length: 200 }, (_, i) =>
      pickVariant({ ...experiment, id: 'exp2' }, `b${i}`).id,
    );
    expect(after).not.toEqual(before);
  });

  it('respects weights, including a variant held at zero', () => {
    const weighted = {
      ...experiment,
      variants: [
        { ...variants[0], weight: 1 },
        { ...variants[1], weight: 0 },
      ],
    };
    const ids = new Set(
      Array.from({ length: 100 }, (_, i) => pickVariant(weighted, `b${i}`).id),
    );
    expect(ids).toEqual(new Set(['a']));
  });

  it('falls back to the first variant when the experiment is off', () => {
    expect(pickVariant({ ...experiment, enabled: false }, 'anyone').id).toBe('a');
  });

  it('never throws on an empty variant list', () => {
    expect(pickVariant({ id: 'x', enabled: true, variants: [] }, 'b1').id).toBe('default');
  });
});

describe('message rendering and scheduling helpers', () => {
  it('fills placeholders from the digest', () => {
    const message = renderMessage(
      { id: 'v', label: 'v', title: '{count} going cold', body: '{name} is {days} days out', weight: 1 },
      { brotherId: 'b1', kind: 'lead', pnmIds: ['p1', 'p2'], oldestName: 'Rick', oldestDays: 9 },
    );
    expect(message).toEqual({ title: '2 going cold', body: 'Rick is 9 days out' });
  });

  it('reads the local hour and day in the chapter timezone', () => {
    // 22:00 UTC is 18:00 in New York on this date.
    expect(hourInZone(NOW, 'America/New_York')).toBe(18);
    expect(dayKey(NOW, 'America/New_York')).toBe('2026-09-20');
    // ...and already the next day in Sydney, which is why the marker is zoned.
    expect(dayKey(NOW, 'Australia/Sydney')).toBe('2026-09-21');
  });

  it('counts whole days only', () => {
    expect(daysBetween(days(1) - 1000, NOW)).toBe(1);
    expect(daysBetween(NOW - 1000, NOW)).toBe(0);
  });
});
