import { useState } from 'react';
import { logContact } from '../data/pnms';
import { CONTACT_METHODS, type ContactMethod, type Pnm } from '../types/models';

function todayInput(): string {
  // <input type="date"> wants local YYYY-MM-DD, not a UTC ISO string.
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function LogContactDialog({
  pnm,
  brotherId,
  onClose,
}: {
  pnm: Pnm;
  brotherId: string;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<ContactMethod>('in person');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(todayInput());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      // Parse as local midnight so the date shown is the date picked.
      const [y, m, d] = date.split('-').map(Number);
      await logContact(pnm, { brotherId, method, notes, date: new Date(y, m - 1, d, 12) });
      onClose();
    } catch {
      setError('Could not save that. Check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <h2 className="text-lg font-semibold">Log a contact</h2>
        <p className="text-sm text-gray-500">with {pnm.name}</p>

        <label className="label mt-4" htmlFor="method">
          How
        </label>
        <select
          id="method"
          className="field"
          value={method}
          onChange={(e) => setMethod(e.target.value as ContactMethod)}
        >
          {CONTACT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <label className="label mt-3" htmlFor="date">
          When
        </label>
        <input
          id="date"
          type="date"
          className="field"
          value={date}
          max={todayInput()}
          onChange={(e) => setDate(e.target.value)}
        />

        <label className="label mt-3" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          className="field"
          rows={3}
          placeholder="What did you talk about? Anything to follow up on?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={() => void save()} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
