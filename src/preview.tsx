/**
 * Design-review harness — dev only, not part of the app bundle.
 *
 * Renders the redesigned surfaces with fixture data so they can be screenshot
 * without a live Firebase sign-in. Served at /preview.html by `vite dev`.
 * Safe to delete; nothing imports it.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import type { Timestamp } from 'firebase/firestore';
import './index.css';
import { Crest } from './components/Crest';
import { PnmPlate } from './components/PnmPlate';
import { StatusBadge } from './components/StatusBadge';
import { ContactAge } from './components/ContactAge';
import { STAGE_LABEL } from './lib/stages';
// STAGE_LABEL drives the fixture selects below.
import { PNM_STATUSES, type Brother, type Pnm, type PnmStatus } from './types/models';

function ts(daysAgo: number | null): Timestamp | null {
  if (daysAgo === null) return null;
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return { toMillis: () => d.getTime(), toDate: () => d } as Timestamp;
}

const brothers = [
  { id: 'b1', name: 'Koen R.' },
  { id: 'b2', name: 'David L.' },
  { id: 'b3', name: 'Ricky A.' },
  { id: 'b4', name: 'Alex T.' },
] as unknown as Brother[];

let n = 0;
function pnm(
  name: string,
  status: PnmStatus,
  major: string,
  lead: string | null,
  daysAgo: number | null,
): Pnm {
  return {
    id: `p${n++}`,
    name,
    status,
    major,
    assignedLead: lead,
    lastContactedDate: ts(daysAgo),
  } as unknown as Pnm;
}

const FIXTURES: Pnm[] = [
  pnm('Marcus Whitfield', 'identified', 'Mechanical Eng.', null, null),
  pnm('Trey Osborne', 'identified', 'Business', 'b2', 14),
  pnm('Cole Bräutigam', 'contacted', 'Cybersecurity', 'b1', 2),
  pnm('Jaylen Frost', 'contacted', 'Biology', 'b3', 8),
  pnm('Sam Pham', 'contacted', 'Undeclared', 'b1', 21),
  pnm('Devin Marsh', 'building relationship', 'Software Eng.', 'b4', 1),
  pnm('Antoine Ferrell', 'building relationship', 'Marketing', 'b2', 6),
  pnm('Will Kirkpatrick', 'bid extended', 'Electrical Eng.', 'b1', 3),
  pnm('Nate Sorensen', 'pledged', 'Kinesiology', 'b3', 0),
  pnm('Bryce Nakamura', 'dropped', 'Accounting', 'b4', 33),
];

function byStalest(a: Pnm, b: Pnm) {
  const da = a.lastContactedDate?.toDate();
  const db = b.lastContactedDate?.toDate();
  const va = da ? Date.now() - da.getTime() : Infinity;
  const vb = db ? Date.now() - db.getTime() : Infinity;
  return vb - va;
}

const order = [...PNM_STATUSES].filter((s) => s !== 'dropped');

function Masthead() {
  return (
    <header className="bg-board">
      <div className="mx-auto flex max-w-3xl items-start gap-2.5 px-4 pb-2.5 pt-3">
        <Crest className="mt-0.5 h-9 w-9 shrink-0 text-sigep-gold" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-base font-semibold uppercase leading-none tracking-[0.13em] text-chalk">
                SigEp <span className="text-chalk-dim">·</span> Indiana Tech
              </p>
              <p className="mt-1 font-display text-2xs uppercase tracking-[0.16em] text-chalk-dim">
                Drew T. <span className="text-sigep-gold">· exec</span>
              </p>
            </div>
            <button className="btn-ghost-dark px-3 py-1.5 text-xs">Sign out</button>
          </div>
          <p className="mt-2 font-display text-lg font-semibold uppercase leading-none tracking-[0.1em] text-orange-onboard">
            Nobody goes cold
          </p>
        </div>
      </div>
      <div className="h-[3px] bg-orange" />
      <div className="h-px bg-sigep-red" />
      <nav className="mx-auto flex max-w-3xl shadow-[inset_0_-1px_0_theme(colors.board.rail)]">
        <span className="flex-1 border-b-2 border-orange bg-white/5 py-3 text-center font-display text-sm font-semibold uppercase tracking-[0.16em] text-chalk">
          Board
        </span>
        <span className="flex-1 border-b-2 border-transparent py-3 text-center font-display text-sm font-semibold uppercase tracking-[0.07em] text-chalk-dim">
          Roster
        </span>
        <span className="flex-1 border-b-2 border-transparent py-3 text-center font-display text-sm font-semibold uppercase tracking-[0.07em] text-chalk-dim">
          Settings
        </span>
      </nav>
    </header>
  );
}

function Board() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input className="field" placeholder="Search by name" defaultValue="" />
          <span className="btn-primary shrink-0 px-3">+ PNM</span>
        </div>
        <div className="flex border-b border-board-rail">
          <span className="flex flex-1 items-center justify-center gap-2 border-b-2 border-transparent py-2.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-chalk-dim">
            My PNMs <span className="text-2xs tabular-nums text-chalk-dim">6</span>
          </span>
          <span className="flex flex-1 items-center justify-center gap-2 border-b-2 border-orange py-2.5 font-display text-sm font-semibold uppercase tracking-[0.1em] text-chalk">
            All PNMs <span className="text-2xs tabular-nums text-chalk-dim">10</span>
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {order.map((status) => {
          const list = FIXTURES.filter((p) => p.status === status).sort(byStalest);
          if (!list.length) return null;
          return (
            <section key={status} className="space-y-2.5">
              <div className="section-head">
                <span>{STAGE_LABEL[status]}</span>
                <span className="count-chip">{list.length}</span>
              </div>
              <div className="space-y-2.5">
                {list.map((p) => (
                  <PnmPlate key={p.id} pnm={p} brothers={brothers} />
                ))}
              </div>
            </section>
          );
        })}
        <details className="group">
          <summary className="section-head cursor-pointer list-none text-chalk-dim marker:content-none">
            <span>Dropped</span>
            <span className="count-chip">1</span>
            <span className="ml-auto font-display text-2xs tracking-[0.1em] group-open:hidden">Show</span>
          </summary>
        </details>
      </div>
    </div>
  );
}

function DetailCard() {
  const p = FIXTURES[4]; // Sam Pham, contacted, 21d — a plate going cold
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-5">
      <span className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-chalk-dim">
        ← The board
      </span>
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold uppercase leading-none tracking-[0.02em] text-ink">
              {p.name}
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">Sophomore · {p.major} · GPA 3.1</p>
            <p className="text-xs text-ink-faint">Met at Rush BBQ</p>
          </div>
          <StatusBadge status={p.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a className="text-stage-contacted underline">(260) 555-0148</a>
          <a className="text-stage-contacted underline">sam.pham@example.edu</a>
          <span className="text-ink-soft">IG @sampham</span>
        </div>
        <p className="mt-3 whitespace-pre-line rounded-sm bg-ink/[0.06] px-3 py-2 text-sm text-ink-soft">
          Roommate is already a PNM. Big into intramural volleyball. Wants to talk about the
          service requirement before committing.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="attr">volleyball</span>
          <span className="attr">climbing</span>
          <span className="attr">film</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <span className="label">Stage</span>
            <select className="field" defaultValue={p.status}>
              {PNM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <span className="label">Assigned lead</span>
            <select className="field" defaultValue="Koen R.">
              <option>Koen R.</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="btn-secondary flex-1">Edit</span>
          <span className="btn-danger">Delete</span>
        </div>
      </div>

      <div className="card p-4">
        <span className="btn-primary w-full py-3.5 text-lg">Log a contact</span>
        <div className="mt-3 flex items-center justify-between gap-2 note-ok">
          <span className="stamp origin-left text-sm text-stage-pledged">Logged · today</span>
          <button className="font-display text-xs font-semibold uppercase tracking-[0.1em] text-stage-pledged underline">
            Add details
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink">
            Contact log
          </h3>
          <ContactAge value={p.lastContactedDate} />
        </div>
        <ul className="divide-y divide-ink/10">
          <li className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-sm font-semibold uppercase tracking-[0.08em] text-ink">
                text
              </span>
              <span className="stamp text-ink-faint">Aug 20, 2026</span>
            </div>
            <p className="text-xs text-ink-faint">Koen R. · Rush BBQ</p>
            <p className="mt-1 text-sm text-ink-soft">
              Said he'd come to the house tour. Following up this week.
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SignInCard() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-4">
      <div className="mb-5 flex items-center gap-3 text-chalk">
        <Crest className="h-9 w-9 text-sigep-gold" />
        <div className="leading-none">
          <p className="font-display text-xl font-semibold uppercase tracking-[0.14em]">
            SigEp <span className="text-chalk-dim">·</span> Indiana Tech
          </p>
          <p className="mt-1 font-display text-2xs font-semibold uppercase tracking-[0.24em] text-orange">
            Nobody goes cold
          </p>
        </div>
      </div>
      <div className="card w-full max-w-sm p-6 text-center">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.03em] text-ink">
          Recruitment board
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sign in with Google, then enter the invite code exec sent you.
        </p>
        <span className="btn-primary mt-6 w-full">Continue with Google</span>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter>
      <Masthead />
      <Board />
      <div className="border-t-4 border-board-rail">
        <DetailCard />
      </div>
      <div className="border-t-4 border-board-rail">
        <SignInCard />
      </div>
    </MemoryRouter>
  </StrictMode>,
);
