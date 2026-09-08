import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { brotherName, watchBrothers } from '../data/brothers';
import { assignLead, deletePnm, setStatus, watchPnm } from '../data/pnms';
import { ContactAge } from '../components/ContactAge';
import { QuickLogCard } from '../components/QuickLogCard';
import { Spinner } from '../components/Spinner';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatPhone, normalizePhone } from '../lib/format';
import { PNM_STATUSES, type Brother, type Pnm, type PnmStatus } from '../types/models';

export function PnmDetail() {
  const { pnmId = '' } = useParams();
  const navigate = useNavigate();
  const { link, isExec } = useAuth();
  const [pnm, setPnm] = useState<Pnm | null | undefined>(undefined);
  const [brothers, setBrothers] = useState<Brother[]>([]);

  useEffect(() => watchPnm(pnmId, setPnm), [pnmId]);
  useEffect(() => watchBrothers(setBrothers), []);

  // Newest first — the last conversation is the one you need before the next.
  const log = useMemo(() => {
    if (!pnm) return [];
    return [...pnm.contactLog].sort((a, b) => b.date.toMillis() - a.date.toMillis());
  }, [pnm]);

  if (pnm === undefined) return <Spinner label="Loading…" />;
  if (pnm === null) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-gray-600">That PNM no longer exists.</p>
        <Link to="/pnms" className="btn-secondary mt-4">
          Back to list
        </Link>
      </div>
    );
  }

  const tags = [...pnm.sports, ...pnm.hobbies, ...pnm.interests];

  async function handleDelete() {
    if (!pnm) return;
    if (!confirm(`Delete ${pnm.name}? This cannot be undone.`)) return;
    await deletePnm(pnm);
    navigate('/pnms');
  }

  return (
    <div className="space-y-4">
      <Link to="/pnms" className="text-sm text-gray-500 hover:text-gray-700">
        ← All PNMs
      </Link>

      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{pnm.name}</h2>
            <p className="text-sm text-gray-500">{pnm.major || 'Major not recorded'}</p>
            {pnm.sourceEvent && (
              <p className="text-xs text-gray-500">Met at {pnm.sourceEvent}</p>
            )}
          </div>
          <StatusBadge status={pnm.status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {pnm.phone && (
            <a className="text-blue-700 underline" href={`tel:${normalizePhone(pnm.phone)}`}>
              {formatPhone(pnm.phone)}
            </a>
          )}
          {pnm.email && (
            <a className="text-blue-700 underline" href={`mailto:${pnm.email}`}>
              {pnm.email}
            </a>
          )}
          {pnm.socials.instagram && <span className="text-gray-600">IG @{pnm.socials.instagram}</span>}
          {pnm.socials.snapchat && <span className="text-gray-600">Snap @{pnm.socials.snapchat}</span>}
        </div>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <span className="label">Status</span>
            <select
              className="field"
              value={pnm.status}
              onChange={(e) => void setStatus(pnm.id, e.target.value as PnmStatus)}
            >
              {PNM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">Assigned lead</span>
            <select
              className="field"
              value={pnm.assignedLead ?? ''}
              onChange={(e) =>
                void assignLead(pnm.id, pnm.assignedLead, e.target.value || null)
              }
            >
              <option value="">Unassigned</option>
              {brothers.map((brother) => (
                <option key={brother.id} value={brother.id}>
                  {brother.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to={`/pnms/${pnm.id}/edit`} className="btn-secondary flex-1">
            Edit
          </Link>
          {isExec && (
            <button className="btn-danger" onClick={() => void handleDelete()}>
              Delete
            </button>
          )}
        </div>
      </div>

      {link && <QuickLogCard pnm={pnm} brotherId={link.brotherId} />}

      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="font-medium">Contact log</h3>
          <ContactAge value={pnm.lastContactedDate} />
        </div>
        {log.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">
            No contact logged yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {log.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">
                    {entry.method ?? 'Contacted'}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(entry.date)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {brotherName(brothers, entry.brotherId)}
                  {entry.event && <span> · {entry.event}</span>}
                </p>
                {entry.notes && <p className="mt-1 text-sm text-gray-700">{entry.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
