import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { ForegroundNotice } from './ForegroundNotice';

function tab({ isActive }: { isActive: boolean }) {
  return `flex-1 border-b-2 px-3 py-3 text-center text-sm font-medium ${
    isActive ? 'border-ink text-ink' : 'border-transparent text-gray-500 hover:text-gray-700'
  }`;
}

export function Layout() {
  const { brother, isExec, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">PNM Tracking</h1>
            <p className="text-xs text-gray-500">
              {brother?.name}
              {isExec && <span className="ml-1 text-ink">· exec</span>}
            </p>
          </div>
          <button className="btn-secondary" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        <nav className="mx-auto flex max-w-3xl px-2">
          <NavLink to="/pnms" className={tab}>
            PNMs
          </NavLink>
          {isExec && (
            <NavLink to="/brothers" className={tab}>
              Brothers
            </NavLink>
          )}
          <NavLink to="/settings" className={tab}>
            Settings
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">
        <ForegroundNotice />
        <Outlet />
      </main>
    </div>
  );
}
