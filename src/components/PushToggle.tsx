import { useEffect, useState } from 'react';
import { disablePush, enablePush, pushState, type PushState } from '../lib/push';

/**
 * Per-device notification opt-in.
 *
 * Permission has to be requested from a real tap, so this is a button rather
 * than something the app does on load — and a browser that has already denied
 * the site can't be re-prompted, which the copy has to explain instead.
 */
export function PushToggle({ brotherId, enabled }: { brotherId: string; enabled: boolean }) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void pushState().then(setState);
  }, []);

  async function turnOn() {
    setBusy(true);
    setError(null);
    try {
      await enablePush(brotherId);
      setState('granted');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not turn on notifications.');
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      await disablePush(brotherId);
    } finally {
      setBusy(false);
    }
  }

  if (state === null) return null;

  return (
    <div className="card p-4">
      <h3 className="font-medium">Reminders on this device</h3>

      {state === 'needs-install' && (
        <p className="mt-2 text-sm text-gray-600">
          On iPhone, add this app to your home screen first (Share → Add to Home Screen),
          then open it from there to turn on notifications.
        </p>
      )}

      {state === 'unsupported' && (
        <p className="mt-2 text-sm text-gray-600">
          This browser can't do push notifications. Try Chrome, or install the app to your
          home screen.
        </p>
      )}

      {state === 'denied' && (
        <p className="mt-2 text-sm text-gray-600">
          Notifications are blocked for this site. Turn them back on in your browser's site
          settings, then reload.
        </p>
      )}

      {(state === 'prompt' || state === 'granted') && (
        <>
          <p className="mt-2 text-sm text-gray-600">
            {enabled
              ? 'This device is set up for reminders.'
              : 'Get a nudge when one of your PNMs goes quiet.'}
          </p>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary" disabled={busy} onClick={() => void turnOn()}>
              {busy ? 'Working…' : enabled ? 'Re-register this device' : 'Turn on reminders'}
            </button>
            {enabled && (
              <button className="btn-secondary" disabled={busy} onClick={() => void turnOff()}>
                Turn off
              </button>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
