import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Crest } from '../components/Crest';

/**
 * Turns a Firebase auth code into something the person in front of the screen
 * can act on. Anything unrecognised still shows its code, so it can be
 * reported without digging through devtools.
 */
function describeSignInError(code: string): string {
  // Firebase folds the server's sentence into the code here, so match a prefix.
  if (code.startsWith('auth/api-key-not-valid') || code === 'auth/invalid-api-key') {
    return 'The Firebase API key is not valid. Check VITE_FIREBASE_API_KEY in .env for a typo or a stray character, then restart the dev server.';
  }

  switch (code) {
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Google sign-in is not switched on for this Firebase project yet (Authentication → Sign-in method).';
    case 'auth/unauthorized-domain':
      return `This site (${window.location.hostname}) is not on the project's authorized domains list (Authentication → Settings).`;
    case 'auth/network-request-failed':
      return 'Could not reach Google. Check your connection and try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow popups for this site, or try again to be redirected instead.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    case '':
      return 'Could not sign in. Try again.';
    default:
      return `Could not sign in (${code}). Try again.`;
  }
}

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
      // Keep the raw error in the console: the code is the fastest route to a
      // diagnosis, and a vague "try again" wastes everyone's time.
      console.error('Sign-in failed', e);
      const code = (e as { code?: string }).code ?? '';

      // Closing the Google popup is a normal thing to do, not an error.
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return;
      }
      setError(describeSignInError(code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-5 flex items-center gap-3 text-chalk">
        <Crest className="h-9 w-9 object-contain" />
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
        <button className="btn-primary mt-6 w-full" disabled={busy} onClick={() => void handleSignIn()}>
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>
        {error && <p className="mt-3 text-sm text-feedback-error">{error}</p>}
      </div>
    </div>
  );
}
