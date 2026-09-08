import { useState } from 'react';
import { logContact, updateContactDetails } from '../data/pnms';
import { CONTACT_METHODS, type ContactDetails, type ContactMethod, type Pnm } from '../types/models';

function todayInput(): string {
  // <input type="date"> wants local YYYY-MM-DD, not a UTC ISO string.
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

const EMPTY: ContactDetails = {};

/**
 * The one-tap logger.
 *
 * The chapter's last tracker died because logging was work. So the button
 * writes an entry the instant it is pressed — date and brother, nothing else
 * required. Method, notes and event sit on the same card as optional fields:
 * fill them in first and they ride along with the tap, or add them to the
 * entry afterwards from the confirmation. Nothing about them can block a log.
 */
export function QuickLogCard({ pnm, brotherId }: { pnm: Pnm; brotherId: string }) {
  const [details, setDetails] = useState<ContactDetails>(EMPTY);
  const [date, setDate] = useState(todayInput());
  const [showDetails, setShowDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Id of the entry just written, so details can still be attached to it. */
  const [loggedId, setLoggedId] = useState<string | null>(null);
  const [detailsSaved, setDetailsSaved] = useState(false);

  const backdated = date !== todayInput();

  async function handleLog() {
    setBusy(true);
    setError(null);
    try {
      // An untouched date means "just now", so the entry keeps the real time
      // of day. A picked date lands at midday, away from timezone edges.
      const when = backdated
        ? (([y, m, d]) => new Date(y, m - 1, d, 12))(date.split('-').map(Number))
        : new Date();

      const id = await logContact(pnm, { brotherId, date: when, details });
      setLoggedId(id);
      setDetails(EMPTY);
      setDate(todayInput());
      setShowDetails(false);
      setDetailsSaved(false);
    } catch {
      setError('Could not log that. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAttachDetails() {
    if (!loggedId) return;
    setBusy(true);
    setError(null);
    try {
      await updateContactDetails(pnm.id, loggedId, details);
      setDetailsSaved(true);
      setShowDetails(false);
      setDetails(EMPTY);
    } catch {
      setError('Could not save those details. Try again.');
    } finally {
      setBusy(false);
    }
  }

  // After a log, the same detail fields edit that entry instead of a new one.
  const attaching = loggedId !== null && showDetails;

  return (
    <div className="card p-4">
      <button
        className="btn-primary w-full py-3 text-base"
        disabled={busy}
        onClick={() => void handleLog()}
      >
        {busy && !attaching ? 'Logging…' : 'Log a contact'}
      </button>

      {loggedId && !showDetails && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2">
          <span className="text-sm text-green-800">
            {detailsSaved ? 'Details saved.' : 'Logged.'}
          </span>
          <button
            className="text-sm font-medium text-green-900 underline"
            onClick={() => setShowDetails(true)}
          >
            {detailsSaved ? 'Edit details' : 'Add details'}
          </button>
        </div>
      )}

      {!loggedId && !showDetails && (
        <button
          className="mt-3 w-full text-sm text-gray-600 underline"
          onClick={() => setShowDetails(true)}
        >
          Add details (optional)
        </button>
      )}

      {showDetails && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            {attaching
              ? 'Adding to the contact you just logged.'
              : 'All optional — the button works without any of it.'}
          </p>

          <div>
            <span className="label">How</span>
            <div className="flex flex-wrap gap-1.5">
              {CONTACT_METHODS.map((method) => {
                const selected = details.method === method;
                return (
                  <button
                    key={method}
                    type="button"
                    aria-pressed={selected}
                    className={`rounded-full px-3 py-1 text-sm ring-1 ring-inset ${
                      selected
                        ? 'bg-ink text-white ring-ink'
                        : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() =>
                      setDetails({
                        ...details,
                        // Tapping the selected chip clears it — no method is a
                        // legitimate answer, so it must be reachable.
                        method: selected ? undefined : (method as ContactMethod),
                      })
                    }
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="field"
              rows={3}
              placeholder="What did you talk about? Anything to follow up on?"
              value={details.notes ?? ''}
              onChange={(e) => setDetails({ ...details, notes: e.target.value })}
            />
          </div>

          <div>
            <label className="label" htmlFor="event">
              Event
            </label>
            <input
              id="event"
              className="field"
              placeholder="Rush BBQ, house tour…"
              value={details.event ?? ''}
              onChange={(e) => setDetails({ ...details, event: e.target.value })}
            />
          </div>

          {!attaching && (
            <div>
              <label className="label" htmlFor="date">
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
              {backdated && (
                <p className="mt-1 text-xs text-gray-500">
                  Logging this for an earlier day.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="btn-secondary flex-1"
              disabled={busy}
              onClick={() => {
                setShowDetails(false);
                setDetails(EMPTY);
              }}
            >
              {attaching ? 'Cancel' : 'Hide'}
            </button>
            {attaching && (
              <button
                className="btn-primary flex-1"
                disabled={busy}
                onClick={() => void handleAttachDetails()}
              >
                {busy ? 'Saving…' : 'Save details'}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
