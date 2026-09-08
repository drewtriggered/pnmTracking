import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { watchBrothers } from '../data/brothers';
import { createPnm, findDuplicates, updatePnm, watchPnm } from '../data/pnms';
import { Spinner } from '../components/Spinner';
import { parseList } from '../lib/format';
import {
  PNM_STATUSES,
  type Brother,
  type Pnm,
  type PnmDraft,
  type PnmStatus,
} from '../types/models';

const BLANK: PnmDraft = {
  name: '',
  phone: '',
  email: '',
  socials: {},
  major: '',
  sports: [],
  hobbies: [],
  interests: [],
  assignedLead: null,
  status: 'identified',
};

export function PnmForm() {
  const { pnmId } = useParams();
  const isEdit = Boolean(pnmId);
  const navigate = useNavigate();
  const { user, link } = useAuth();

  const [draft, setDraft] = useState<PnmDraft>(BLANK);
  const [previousLead, setPreviousLead] = useState<string | null>(null);
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Pnm[]>([]);
  // Set once the user has seen a duplicate warning and chosen to continue.
  const [dupeAcknowledged, setDupeAcknowledged] = useState(false);
  const dupeRef = useRef<HTMLDivElement>(null);

  useEffect(() => watchBrothers(setBrothers), []);

  // The warning renders below a long form, so bring it into view — otherwise
  // submitting again looks like nothing happened.
  useEffect(() => {
    if (duplicates.length > 0) {
      dupeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [duplicates]);

  useEffect(() => {
    if (!pnmId) {
      // Default a new PNM to whoever is adding them — they met them.
      setDraft({ ...BLANK, assignedLead: link?.brotherId ?? null });
      return;
    }
    return watchPnm(pnmId, (found) => {
      if (found) {
        const { id: _id, nameLower: _n, contactLog: _c, lastContactedDate: _l,
                createdAt: _ca, createdBy: _cb, updatedAt: _u, ...rest } = found;
        setDraft(rest);
        setPreviousLead(found.assignedLead);
      }
      setLoading(false);
    });
  }, [pnmId, link]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!draft.name.trim()) {
      setError('A name is required.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      // Duplicate check on name + phone, before insert. Editing an existing
      // record skips it — matching yourself is not a duplicate.
      if (!isEdit && !dupeAcknowledged) {
        const found = await findDuplicates(draft.name, draft.phone);
        if (found.length > 0) {
          setDuplicates(found);
          setDupeAcknowledged(true);
          setBusy(false);
          return;
        }
      }

      if (isEdit && pnmId) {
        await updatePnm(pnmId, draft, previousLead);
        navigate(`/pnms/${pnmId}`);
      } else {
        const id = await createPnm(draft, user.uid);
        navigate(`/pnms/${id}`);
      }
    } catch {
      setError('Could not save. Check your connection and try again.');
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <Link to={pnmId ? `/pnms/${pnmId}` : '/pnms'} className="text-sm text-gray-500">
        ← Cancel
      </Link>

      <div className="card space-y-3 p-4">
        <h2 className="text-lg font-semibold">{isEdit ? 'Edit PNM' : 'New PNM'}</h2>

        <div>
          <label className="label" htmlFor="name">Name</label>
          <input
            id="name"
            className="field"
            value={draft.name}
            onChange={(e) => {
              setDraft({ ...draft, name: e.target.value });
              setDuplicates([]);
              setDupeAcknowledged(false);
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              className="field"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="field"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="major">Major</label>
          <input
            id="major"
            className="field"
            value={draft.major}
            onChange={(e) => setDraft({ ...draft, major: e.target.value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ig">Instagram</label>
            <input
              id="ig"
              className="field"
              placeholder="handle, no @"
              value={draft.socials.instagram ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, socials: { ...draft.socials, instagram: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="label" htmlFor="snap">Snapchat</label>
            <input
              id="snap"
              className="field"
              value={draft.socials.snapchat ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, socials: { ...draft.socials, snapchat: e.target.value } })
              }
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="sports">Sports</label>
          <input
            id="sports"
            className="field"
            placeholder="comma separated — lacrosse, intramural basketball"
            value={draft.sports.join(', ')}
            onChange={(e) => setDraft({ ...draft, sports: parseList(e.target.value) })}
          />
        </div>

        <div>
          <label className="label" htmlFor="hobbies">Hobbies</label>
          <input
            id="hobbies"
            className="field"
            placeholder="comma separated"
            value={draft.hobbies.join(', ')}
            onChange={(e) => setDraft({ ...draft, hobbies: parseList(e.target.value) })}
          />
        </div>

        <div>
          <label className="label" htmlFor="interests">Interests</label>
          <input
            id="interests"
            className="field"
            placeholder="comma separated"
            value={draft.interests.join(', ')}
            onChange={(e) => setDraft({ ...draft, interests: parseList(e.target.value) })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select
              id="status"
              className="field"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as PnmStatus })}
            >
              {PNM_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lead">Assigned lead</label>
            <select
              id="lead"
              className="field"
              value={draft.assignedLead ?? ''}
              onChange={(e) => setDraft({ ...draft, assignedLead: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {brothers.map((brother) => (
                <option key={brother.id} value={brother.id}>{brother.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {duplicates.length > 0 && (
        <div ref={dupeRef} className="card border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            {duplicates.length === 1 ? 'A PNM' : `${duplicates.length} PNMs`} already on file with
            this name and phone:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {duplicates.map((dupe) => (
              <li key={dupe.id}>
                <Link className="text-blue-700 underline" to={`/pnms/${dupe.id}`}>
                  {dupe.name}
                </Link>{' '}
                <span className="text-gray-600">— {dupe.status}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-amber-900">
            Submit again to add anyway.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button className="btn-primary w-full" disabled={busy} type="submit">
        {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add PNM'}
      </button>
    </form>
  );
}
