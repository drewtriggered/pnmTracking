import { useEffect, useState } from 'react';
import { onForegroundMessage } from '../lib/push';

/**
 * Shows a reminder that lands while the app is open.
 *
 * FCM hands a push straight to the page whenever any window is visible and
 * draws nothing itself, so without this the reminders that are easiest to
 * check — the ones you send yourself from Settings with the app in front of
 * you — arrive completely silently and read as push being broken.
 *
 * A banner rather than a system notification: the app is already on screen,
 * and browsers suppress or duplicate a notification raised from a focused tab.
 */
export function ForegroundNotice() {
  const [message, setMessage] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void onForegroundMessage((title, body) => setMessage({ title, body })).then((off) => {
      if (cancelled) off();
      else unsubscribe = off;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="card mb-4 flex items-start gap-3 border-ink/20 bg-white p-4"
    >
      <div className="flex-1">
        <p className="font-medium">{message.title}</p>
        {message.body && <p className="mt-0.5 text-sm text-gray-600">{message.body}</p>}
      </div>
      <button
        className="text-sm text-gray-500 hover:text-gray-700"
        onClick={() => setMessage(null)}
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
