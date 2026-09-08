import { useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { useAuth } from '../auth/AuthProvider';
import { useReminderSettings } from '../settings/SettingsProvider';
import { saveReminderSettings, watchReminderSends } from '../data/settings';
import { PushToggle } from '../components/PushToggle';
import { firebaseApp } from '../lib/firebase';
import type { NotificationVariant, ReminderSettings } from '../../functions/src/logic';
import type { ReminderSend } from '../types/models';

function VariantEditor({
  variant,
  onChange,
  onRemove,
  canRemove,
}: {
  variant: NotificationVariant;
  onChange: (next: NotificationVariant) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2">
        <input
          className="field flex-1"
          value={variant.label}
          placeholder="Variant name"
          onChange={(e) => onChange({ ...variant, label: e.target.value })}
        />
        {canRemove && (
          <button className="btn-danger" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
      <input
        className="field mt-2"
        value={variant.title}
        placeholder="Notification title"
        onChange={(e) => onChange({ ...variant, title: e.target.value })}
      />
      <textarea
        className="field mt-2"
        rows={2}
        value={variant.body}
        placeholder="Body — {count}, {name} and {days} get filled in"
        onChange={(e) => onChange({ ...variant, body: e.target.value })}
      />
      <label className="label mt-2">Share of brothers (weight)</label>
      <input
        type="number"
        min={0}
        className="field"
        value={variant.weight}
        onChange={(e) => onChange({ ...variant, weight: Number(e.target.value) })}
      />
    </div>
  );
}

/** Sends and act-rate per variant — the readout an experiment is run for. */
function Results({ sends }: { sends: ReminderSend[] }) {
  const rows = useMemo(() => {
    const byVariant = new Map<string, { sent: number; acted: number }>();
    for (const send of sends) {
      const row = byVariant.get(send.variantId) ?? { sent: 0, acted: 0 };
      row.sent += 1;
      if (send.actedAt) row.acted += 1;
      byVariant.set(send.variantId, row);
    }
    return [...byVariant.entries()].sort((a, b) => b[1].sent - a[1].sent);
  }, [sends]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No reminders sent yet. Results appear here once the daily job has run.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-1">Variant</th>
            <th className="py-1">Sent</th>
            <th className="py-1">Acted</th>
            <th className="py-1">Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([variantId, row]) => (
            <tr key={variantId} className="border-t border-gray-100">
              <td className="py-1.5 font-medium">{variantId}</td>
              <td className="py-1.5">{row.sent}</td>
              <td className="py-1.5">{row.acted}</td>
              <td className="py-1.5">
                {row.sent === 0 ? '—' : `${Math.round((row.acted / row.sent) * 100)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-gray-500">
        "Acted" means the brother logged a contact for one of the PNMs in that reminder,
        within two weeks of it being sent.
      </p>
    </div>
  );
}

export function Settings() {
  const { brother } = useAuth();
  const live = useReminderSettings();
  const isReminderAdmin = brother?.reminderAdmin === true;

  const [draft, setDraft] = useState<ReminderSettings>(live);
  const [dirty, setDirty] = useState(false);
  const [sends, setSends] = useState<ReminderSend[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track the live doc until the admin starts editing, so someone else's save
  // doesn't get silently reverted by a stale form.
  useEffect(() => {
    if (!dirty) setDraft(live);
  }, [live, dirty]);

  useEffect(() => {
    if (!isReminderAdmin) return;
    return watchReminderSends(setSends);
  }, [isReminderAdmin]);

  function edit(patch: Partial<ReminderSettings>) {
    setDraft({ ...draft, ...patch });
    setDirty(true);
  }

  function editVariants(variants: NotificationVariant[]) {
    edit({ experiment: { ...draft.experiment, variants } });
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveReminderSettings(draft);
      setDirty(false);
      setNotice('Saved.');
      setTimeout(() => setNotice(null), 2500);
    } catch {
      setError('Could not save. Reminder admins only.');
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setError(null);
    try {
      const call = httpsCallable<unknown, { variantId: string; title: string }>(
        getFunctions(firebaseApp),
        'sendTestReminder',
      );
      const result = await call({});
      setNotice(`Sent you the "${result.data.variantId}" variant.`);
    } catch (e) {
      setError(
        (e as { message?: string }).message ??
          'Could not send a test. Turn on notifications for this device first.',
      );
    } finally {
      setBusy(false);
    }
  }

  const deviceEnabled = (brother?.fcmTokens?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      {brother && <PushToggle brotherId={brother.id} enabled={deviceEnabled} />}

      {!isReminderAdmin ? (
        <div className="card p-4">
          <h3 className="font-medium">Reminder schedule</h3>
          <p className="mt-2 text-sm text-gray-600">
            You'll hear about a PNM after {live.coldAfterDays} days without contact.
            Exec is told after {live.escalateAfterDays}.
          </p>
        </div>
      ) : (
        <>
          <div className="card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Reminder rules</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={draft.enabled}
                  onChange={(e) => edit({ enabled: e.target.checked })}
                />
                Enabled
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="cold">Nudge lead after (days)</label>
                <input
                  id="cold"
                  type="number"
                  min={1}
                  className="field"
                  value={draft.coldAfterDays}
                  onChange={(e) => edit({ coldAfterDays: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label" htmlFor="escalate">Tell exec after (days)</label>
                <input
                  id="escalate"
                  type="number"
                  min={1}
                  className="field"
                  value={draft.escalateAfterDays}
                  onChange={(e) => edit({ escalateAfterDays: Number(e.target.value) })}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={draft.escalationEnabled}
                onChange={(e) => edit({ escalationEnabled: e.target.checked })}
              />
              Escalate to exec
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="hour">Send at (hour, 0-23)</label>
                <input
                  id="hour"
                  type="number"
                  min={0}
                  max={23}
                  className="field"
                  value={draft.sendHour}
                  onChange={(e) => edit({ sendHour: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label" htmlFor="tz">Timezone</label>
                <input
                  id="tz"
                  className="field"
                  value={draft.timeZone}
                  onChange={(e) => edit({ timeZone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="appUrl">App URL (where a tap opens)</label>
              <input
                id="appUrl"
                className="field"
                placeholder="https://your-app.web.app"
                value={draft.appUrl}
                onChange={(e) => edit({ appUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notification experiment</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={draft.experiment.enabled}
                  onChange={(e) =>
                    edit({ experiment: { ...draft.experiment, enabled: e.target.checked } })
                  }
                />
                Running
              </label>
            </div>
            <p className="text-sm text-gray-600">
              Each brother is assigned one variant and keeps it, so you're measuring the copy
              rather than noise. Change the experiment ID to reshuffle everyone and start a
              clean run.
            </p>

            <div>
              <label className="label" htmlFor="expId">Experiment ID</label>
              <input
                id="expId"
                className="field"
                value={draft.experiment.id}
                onChange={(e) =>
                  edit({ experiment: { ...draft.experiment, id: e.target.value } })
                }
              />
            </div>

            {draft.experiment.variants.map((variant, i) => (
              <VariantEditor
                key={i}
                variant={variant}
                canRemove={draft.experiment.variants.length > 1}
                onChange={(next) =>
                  editVariants(draft.experiment.variants.map((v, j) => (j === i ? next : v)))
                }
                onRemove={() =>
                  editVariants(draft.experiment.variants.filter((_, j) => j !== i))
                }
              />
            ))}

            <button
              className="btn-secondary w-full"
              onClick={() =>
                editVariants([
                  ...draft.experiment.variants,
                  {
                    id: `v${draft.experiment.variants.length + 1}`,
                    label: `Variant ${draft.experiment.variants.length + 1}`,
                    title: 'PNMs going cold',
                    body: '{count} of your PNMs need a check-in.',
                    weight: 1,
                  },
                ])
              }
            >
              Add a variant
            </button>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 font-medium">Results</h3>
            <Results sends={sends} />
          </div>

          {notice && <p className="text-sm text-green-700">{notice}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button className="btn-secondary flex-1" disabled={busy} onClick={() => void sendTest()}>
              Send me a test
            </button>
            <button className="btn-primary flex-1" disabled={busy || !dirty} onClick={() => void save()}>
              {busy ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
