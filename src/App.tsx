import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Layout } from './components/Layout';
import { Spinner } from './components/Spinner';
import { SettingsProvider } from './settings/SettingsProvider';
import { Brothers } from './pages/Brothers';
import { Join } from './pages/Join';
import { PnmDetail } from './pages/PnmDetail';
import { PnmForm } from './pages/PnmForm';
import { PnmList } from './pages/PnmList';
import { Settings } from './pages/Settings';
import { SignIn } from './pages/SignIn';

/**
 * Three gates, in order: signed in, linked to a brother record, and (for the
 * roster) exec. The link gate is what enforces the invite — a Google account
 * that has never claimed a code can reach nothing but /join.
 */
function Routing() {
  const { user, link, isExec, loading } = useAuth();

  if (loading) return <Spinner label="Signing in…" />;
  if (!user) return <SignIn />;
  if (!link) return <Join />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/pnms" element={<PnmList />} />
        <Route path="/pnms/new" element={<PnmForm />} />
        <Route path="/pnms/:pnmId" element={<PnmDetail />} />
        <Route path="/pnms/:pnmId/edit" element={<PnmForm />} />
        <Route
          path="/brothers"
          element={isExec ? <Brothers /> : <Navigate to="/pnms" replace />}
        />
        <Route path="/settings" element={<Settings />} />
      </Route>
      {/* Anything else, including the /join link once claimed, lands on the list. */}
      <Route path="*" element={<Navigate to="/pnms" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routing />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
