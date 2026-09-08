import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

export function SignIn() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      const code = (e as { code?: string }).code;
      // Closing the Google popup is a normal thing to do, not an error worth showing.
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError('Could not sign in. Try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6 text-center">
        <h1 className="text-xl font-semibold">PNM Tracking</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with Google, then enter the invite code exec sent you.
        </p>
        <button className="btn-primary mt-6 w-full" disabled={busy} onClick={() => void handleSignIn()}>
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
