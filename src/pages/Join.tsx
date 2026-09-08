import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { claimInvite, InviteError, peekInvite } from '../data/invites';
import { normalizeInviteCode } from '../lib/codes';
import type { Invite } from '../types/models';

/**
 * Where a signed-in account that isn't linked to a brother record lands. The
 * code can arrive in the URL (?code=) from the link exec shares, or be typed.
 */
export function Join() {
  const { user, refreshLink, signOut } = useAuth();
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => normalizeInviteCode(params.get('code') ?? ''));
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Show whose record a code is for before the account is committed to it.
  useEffect(() => {
    if (code.length < 10) {
      setInvite(null);
      return;
    }
    let cancelled = false;
    void peekInvite(code)
      .then((found) => {
        if (cancelled) return;
        setInvite(found);
        setError(found ? null : 'No invite matches that code.');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleClaim() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await claimInvite(code, user.uid);
      await refreshLink();
    } catch (e) {
      setError(
        e instanceof InviteError
          ? e.message
          : 'Could not use that code. Ask exec to re-issue it.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold">Enter your invite code</h1>
        <p className="mt-2 text-sm text-gray-600">
          Signed in as {user?.email}. This code links your account to your brother record — it
          only works once.
        </p>

        <label className="label mt-5" htmlFor="code">
          Invite code
        </label>
        <input
          id="code"
          className="field text-center font-mono text-lg tracking-widest"
          value={code}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="XXXXXXXXXX"
          onChange={(e) => setCode(normalizeInviteCode(e.target.value))}
        />

        {invite && !invite.claimedByUid && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            This code is for <strong>{invite.brotherName}</strong>.
          </p>
        )}
        {invite?.claimedByUid && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This code has already been used.
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          className="btn-primary mt-5 w-full"
          disabled={busy || code.length < 10 || !invite || Boolean(invite?.claimedByUid)}
          onClick={() => void handleClaim()}
        >
          {busy ? 'Linking…' : 'Link my account'}
        </button>
        <button className="btn-secondary mt-2 w-full" onClick={() => void signOut()}>
          Sign in with a different account
        </button>
      </div>
    </div>
  );
}
