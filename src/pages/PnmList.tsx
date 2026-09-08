import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useChapterData } from '../hooks/useChapterData';
import { brotherName } from '../data/brothers';
import { ContactAge } from '../components/ContactAge';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner } from '../components/Spinner';
import { PNM_STATUSES, type Pnm } from '../types/models';

type Filters = {
  search: string;
  status: string;
  major: string;
  sport: string;
  interest: string;
  mineOnly: boolean;
};

const EMPTY: Filters = {
  search: '',
  status: '',
  major: '',
  sport: '',
  interest: '',
  mineOnly: false,
};

/** Distinct values across the class, so filters only offer what exists. */
function options(pnms: Pnm[], pick: (p: Pnm) => string[] | string): string[] {
  const set = new Set<string>();
  for (const pnm of pnms) {
    const value = pick(pnm);
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item) set.add(item);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function PnmList() {
  const { pnms, brothers, loading, error } = useChapterData();
  const { link } = useAuth();
  const [filters, setFilters] = useState<Filters>(EMPTY);

  const majors = useMemo(() => options(pnms, (p) => p.major), [pnms]);
  const sports = useMemo(() => options(pnms, (p) => p.sports), [pnms]);
  const interests = useMemo(
    () => options(pnms, (p) => [...p.interests, ...p.hobbies]),
    [pnms],
  );

  const visible = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return pnms.filter((pnm) => {
      if (search) {
        // Match the things a brother would actually type: who they are, or
        // the thing they remember about them.
        const haystack = [
          pnm.name,
          pnm.major,
          pnm.sourceEvent,
          pnm.email,
          pnm.phone,
          ...pnm.sports,
          ...pnm.hobbies,
          ...pnm.interests,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.status && pnm.status !== filters.status) return false;
      if (filters.major && pnm.major !== filters.major) return false;
      if (filters.sport && !pnm.sports.includes(filters.sport)) return false;
      if (
        filters.interest &&
        !pnm.interests.includes(filters.interest) &&
        !pnm.hobbies.includes(filters.interest)
      ) {
        return false;
      }
      if (filters.mineOnly && pnm.assignedLead !== link?.brotherId) return false;
      return true;
    });
  }, [pnms, filters, link]);

  const filtersActive = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  if (loading) return <Spinner label="Loading PNMs…" />;
  if (error) return <p className="card p-4 text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="field"
          placeholder="Search name, major, interests…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <Link to="/pnms/new" className="btn-primary shrink-0">
          + PNM
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          className="field"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          {PNM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={filters.major}
          onChange={(e) => setFilters({ ...filters, major: e.target.value })}
        >
          <option value="">All majors</option>
          {majors.map((major) => (
            <option key={major} value={major}>
              {major}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={filters.sport}
          onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
        >
          <option value="">All sports</option>
          {sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
        <select
          className="field"
          value={filters.interest}
          onChange={(e) => setFilters({ ...filters, interest: e.target.value })}
        >
          <option value="">All interests</option>
          {interests.map((interest) => (
            <option key={interest} value={interest}>
              {interest}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={filters.mineOnly}
            onChange={(e) => setFilters({ ...filters, mineOnly: e.target.checked })}
          />
          Only mine
        </label>
        <span>
          {visible.length} of {pnms.length}
          {filtersActive && (
            <button className="ml-3 underline" onClick={() => setFilters(EMPTY)}>
              Clear
            </button>
          )}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="card p-6 text-center text-sm text-gray-500">
          {pnms.length === 0 ? 'No PNMs yet. Add the first one.' : 'Nothing matches those filters.'}
        </p>
      ) : (
        <ul className="card divide-y divide-gray-100">
          {visible.map((pnm) => (
            <li key={pnm.id}>
              <Link
                to={`/pnms/${pnm.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{pnm.name}</span>
                    <StatusBadge status={pnm.status} />
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {[pnm.major, brotherName(brothers, pnm.assignedLead)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <ContactAge value={pnm.lastContactedDate} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
