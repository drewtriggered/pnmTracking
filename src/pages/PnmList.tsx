import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useChapterData } from '../hooks/useChapterData';
import { PnmPlate } from '../components/PnmPlate';
import { Spinner } from '../components/Spinner';
import { daysSince } from '../lib/format';
import { STAGE_LABEL, STAGE_META } from '../lib/stages';
import { PNM_STATUSES, type Pnm, type PnmStatus } from '../types/models';

type Scope = 'mine' | 'all';

/** Stalest first — the name nobody has touched floats to the top of its column. */
function byStalest(a: Pnm, b: Pnm): number {
  const da = daysSince(a.lastContactedDate);
  const db = daysSince(b.lastContactedDate);
  return (db ?? Infinity) - (da ?? Infinity);
}

const BOARD_ORDER = [...PNM_STATUSES].sort(
  (a, b) => STAGE_META[a].order - STAGE_META[b].order,
);

export function PnmList() {
  const { pnms, brothers, loading, error } = useChapterData();
  const { link } = useAuth();
  const [scope, setScope] = useState<Scope>('mine');
  const [search, setSearch] = useState('');

  const mine = useMemo(
    () => pnms.filter((pnm) => pnm.assignedLead === link?.brotherId),
    [pnms, link],
  );

  const visible = useMemo(() => {
    const base = scope === 'mine' ? mine : pnms;
    const q = search.trim().toLowerCase();
    return q ? base.filter((pnm) => pnm.name.toLowerCase().includes(q)) : base;
  }, [scope, mine, pnms, search]);

  const columns = useMemo(() => {
    const grouped = new Map<PnmStatus, Pnm[]>();
    for (const status of BOARD_ORDER) grouped.set(status, []);
    for (const pnm of visible) grouped.get(pnm.status)?.push(pnm);
    for (const list of grouped.values()) list.sort(byStalest);
    return grouped;
  }, [visible]);

  if (loading) return <Spinner label="Loading the board…" />;
  if (error) {
    return <p className="card p-4 text-sm text-feedback-error">{error}</p>;
  }

  const live = BOARD_ORDER.filter((s) => s !== 'dropped');
  const droppedCount = columns.get('dropped')?.length ?? 0;
  const searching = search.trim().length > 0;

  const tabs: { key: Scope; label: string; count: number }[] = [
    { key: 'mine', label: 'My PNMs', count: mine.length },
    { key: 'all', label: 'All PNMs', count: pnms.length },
  ];

  return (
    <div className="space-y-5">
      {/* Control strip. */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link to="/pnms/new" className="btn-primary shrink-0 px-3">
            + PNM
          </Link>
        </div>

        <div className="flex border-b border-board-rail">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={scope === tab.key}
              onClick={() => setScope(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2.5 font-display text-sm font-semibold uppercase tracking-[0.1em] transition-colors ${
                scope === tab.key
                  ? 'border-orange text-chalk'
                  : 'border-transparent text-chalk-dim hover:text-chalk'
              }`}
            >
              {tab.label}
              <span className="text-2xs tabular-nums text-chalk-dim">{tab.count}</span>
            </button>
          ))}
        </div>

        {searching && (
          <p className="font-display text-2xs uppercase tracking-[0.16em] text-chalk-dim">
            {visible.length} {visible.length === 1 ? 'match' : 'matches'}
          </p>
        )}
      </div>

      {pnms.length === 0 ? (
        <p className="card p-6 text-center text-sm text-ink-soft">
          No names on the board yet. Add the first one.
        </p>
      ) : visible.length === 0 && searching ? (
        <p className="card p-6 text-center text-sm text-ink-soft">
          No names match “{search.trim()}”.
        </p>
      ) : visible.length === 0 && scope === 'mine' ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-ink-soft">Nothing is assigned to you yet.</p>
          <button
            type="button"
            className="mt-3 font-display text-xs font-semibold uppercase tracking-[0.1em] text-orange underline"
            onClick={() => setScope('all')}
          >
            See all PNMs
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {live.map((status) => {
            const list = columns.get(status) ?? [];
            if (list.length === 0) return null;
            return (
              <section key={status} className="space-y-2.5">
                <div className="section-head">
                  <span>{STAGE_LABEL[status]}</span>
                  <span className="count-chip">{list.length}</span>
                </div>
                <div className="space-y-2.5">
                  {list.map((pnm) => (
                    <PnmPlate key={pnm.id} pnm={pnm} brothers={brothers} />
                  ))}
                </div>
              </section>
            );
          })}

          {droppedCount > 0 && (
            <details className="group">
              <summary className="section-head cursor-pointer list-none text-chalk-dim marker:content-none">
                <span>Dropped</span>
                <span className="count-chip">{droppedCount}</span>
                <span className="ml-auto font-display text-2xs tracking-[0.1em] group-open:hidden">
                  Show
                </span>
                <span className="ml-auto hidden font-display text-2xs tracking-[0.1em] group-open:inline">
                  Hide
                </span>
              </summary>
              <div className="mt-2.5 space-y-2.5 opacity-70">
                {(columns.get('dropped') ?? []).map((pnm) => (
                  <PnmPlate key={pnm.id} pnm={pnm} brothers={brothers} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
