import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { createBrother, setBrotherRole, watchBrothers } from '../data/brothers';
import { createInvite, revokeInvite, watchInvites } from '../data/invites';
import { inviteLink } from '../lib/codes';
import { Spinner } from '../components/Spinner';
import type { Brother, BrotherRole, Invite } from '../types/models';

/**
 * Exec-only roster and invite desk.
 *
 * The flow: exec adds the brother's record here, which mints a one-time code
 * and a /join link. Exec sends that link however the chapter already talks
 * (GroupMe, text). The first Google account to use it is locked to that
 * record, and the code is spent.
 */
export function Brothers() {
  const { user } = useAuth();
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<BrotherRole>('general');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const unsubBrothers = watchBrothers((next) => {
      setBrothers(next);
      setLoading(false);
    });
    const unsubInvites = watchInvites(setInvites);
    return () => {
      unsubBrothers();
      unsubInvites();
    };
  }, []);

  async function addBrother(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const brotherId = await createBrother({ name, phone, role });
      await createInvite(brotherId, name.trim(), role, user.uid);
      setName('');
      setPhone('');
      setRole('general');
    } catch {
      setError('Could not add that brother. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function reissue(brother: Brother) {
    if (!user) return;
    const code = await createInvite(brother.id, brother.name, brother.role, user.uid);
    await share(code);
  }

  /** Native share sheet on a phone, clipboard on a laptop. */
  async function share(code: string) {
    const url = inviteLink(code);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PNM Tracking invite', text: `Your invite code: ${code}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // The user dismissed the share sheet, or the clipboard was blocked —
      // the code is on screen either way.
    }
  }

  const openInvites = invites.filter((invite) => !invite.claimedByUid);

  if (loading) return <Spinner label="Loading roster…" />;

  return (
    <div className="space-y-4">
      <form className="card space-y-3 p-4" onSubmit={(e) => void addBrother(e)}>
        <h2 className="text-lg font-semibold">Add a brother</h2>
        <p className="text-sm text-gray-500">
          Creates their record and a one-time invite code you can send them.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="field"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="field"
            type="tel"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select
            className="field"
            value={role}
            onChange={(e) => setRole(e.target.value as BrotherRole)}
          >
            <option value="general">general</option>
            <option value="exec">exec</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy || !name.trim()} type="submit">
          {busy ? 'Adding…' : 'Add brother + generate code'}
        </button>
      </form>

      {openInvites.length > 0 && (
        <div className="card">
          <h3 className="border-b border-gray-100 px-4 py-3 font-medium">
            Unclaimed invites ({openInvites.length})
          </h3>
          <ul className="divide-y divide-gray-100">
            {openInvites.map((invite) => (
              <li key={invite.code} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{invite.brotherName}</p>
                  <p className="font-mono text-xs tracking-widest text-gray-600">{invite.code}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-secondary" onClick={() => void share(invite.code)}>
                    {copied === invite.code ? 'Copied' : 'Share'}
                  </button>
                  <button className="btn-danger" onClick={() => void revokeInvite(invite.code)}>
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3 className="border-b border-gray-100 px-4 py-3 font-medium">
          Roster ({brothers.length})
        </h3>
        <ul className="divide-y divide-gray-100">
          {brothers.map((brother) => (
            <li key={brother.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{brother.name}</p>
                <p className="truncate whitespace-nowrap text-xs text-gray-500">
                  {brother.uid ? 'Account linked' : 'Not signed in yet'} ·{' '}
                  {brother.assignedPnmIds.length} PNMs
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  className="field w-auto py-1 text-sm"
                  value={brother.role}
                  onChange={(e) => void setBrotherRole(brother.id, e.target.value as BrotherRole)}
                >
                  <option value="general">general</option>
                  <option value="exec">exec</option>
                </select>
                {!brother.uid && (
                  <button className="btn-secondary" onClick={() => void reissue(brother)}>
                    New code
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
