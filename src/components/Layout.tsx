import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Crest } from './Crest';

function tab({ isActive }: { isActive: boolean }) {
  return `flex-1 border-b-2 py-3 text-center font-display text-sm font-semibold uppercase tracking-[0.07em] transition-colors ${
    isActive
      ? 'border-orange bg-white/5 text-chalk'
      : 'border-transparent text-chalk-dim hover:text-chalk'
  }`;
}

export function Layout() {
  const { brother, isExec, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-board">
        <div className="mx-auto flex max-w-3xl items-start gap-2.5 px-4 pb-2.5 pt-3">
          <Crest className="mt-0.5 h-9 w-9 shrink-0 text-sigep-gold" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold uppercase leading-none tracking-[0.13em] text-chalk">
                  SigEp <span className="text-chalk-dim">·</span> Indiana Tech
                </p>
                {brother?.name && (
                  <p className="mt-1 font-display text-2xs uppercase tracking-[0.16em] text-chalk-dim">
                    {brother.name}
                    {isExec && <span className="text-sigep-gold"> · exec</span>}
                  </p>
                )}
              </div>
              <button className="btn-ghost-dark px-3 py-1.5 text-xs" onClick={() => void signOut()}>
                Sign out
              </button>
            </div>
            <p className="mt-2 font-display text-lg font-semibold uppercase leading-none tracking-[0.1em] text-orange-onboard">
              Nobody goes cold
            </p>
          </div>
        </div>
        <div className="h-[3px] bg-orange" />
        <div className="h-px bg-sigep-red" />
        <nav className="mx-auto flex max-w-3xl shadow-[inset_0_-1px_0_theme(colors.board.rail)]">
          <NavLink to="/pnms" className={tab}>
            Board
          </NavLink>
          {isExec && (
            <NavLink to="/brothers" className={tab}>
              Roster
            </NavLink>
          )}
          <NavLink to="/settings" className={tab}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}
