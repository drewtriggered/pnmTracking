import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { Brother, UserLink } from '../types/models';

interface AuthState {
  /** Firebase user, or null when signed out. */
  user: User | null;
  /** The claimed link to a brother record. Null means "signed in but not a member yet". */
  link: UserLink | null;
  brother: Brother | null;
  isExec: boolean;
  /** True until we know both the auth state and whether a link exists. */
  loading: boolean;
  /**
   * The error code from a redirect sign-in that completed but failed —
   * distinct from `loading`, since onAuthStateChanged already reflects "no
   * user" by then. SignIn reads this so a failed redirect says why instead
   * of silently dropping the visitor back on the sign-in button.
   */
  redirectError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-reads the link after a successful invite claim. */
  refreshLink: () => Promise<void>;
}

/**
 * Safari's OAuth popup is unreliable well beyond installed PWAs — it
 * routinely reports `auth/popup-closed-by-user` the instant it opens, on a
 * plain browser tab, with nothing the user did. iPadOS also reports as
 * "Macintosh" with touch support, which is why that's checked alongside the
 * iPhone/iPad UA strings.
 */
function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [link, setLink] = useState<UserLink | null>(null);
  const [brother, setBrother] = useState<Brother | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [linkResolved, setLinkResolved] = useState(false);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  // Completes a redirect sign-in. onAuthStateChanged reports the user either
  // way, but this is where a failed redirect surfaces its reason — without
  // this, a visitor whose redirect silently failed just sees the sign-in
  // button again, with nothing explaining why.
  useEffect(() => {
    getRedirectResult(auth).catch((e) => {
      console.error('Redirect sign-in failed', e);
      setRedirectError((e as { code?: string }).code ?? 'unknown-error');
    });
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setAuthResolved(true);
      if (!next) {
        setLink(null);
        setBrother(null);
        setLinkResolved(true);
      } else {
        setLinkResolved(false);
      }
    });
  }, []);

  // Watch the membership link so an exec promoting someone, or a fresh claim,
  // takes effect without a reload.
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'userLinks', user.uid),
      (snap) => {
        setLink(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserLink) : null);
        setLinkResolved(true);
      },
      () => {
        // A denied read means "not a member" as far as the UI is concerned.
        setLink(null);
        setLinkResolved(true);
      },
    );
  }, [user]);

  // The brother record behind the link, for the header and "log a contact".
  useEffect(() => {
    if (!link) {
      setBrother(null);
      return;
    }
    return onSnapshot(doc(db, 'brothers', link.brotherId), (snap) => {
      setBrother(snap.exists() ? ({ id: snap.id, ...snap.data() } as Brother) : null);
    });
  }, [link]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      link,
      brother,
      // Trust the brother record over the link: it is the exec-writable source
      // of truth, so a demotion applies even if the link is stale.
      isExec: (brother?.role ?? link?.role) === 'exec',
      loading: !authResolved || !linkResolved,
      redirectError,
      signIn: async () => {
        // An installed PWA has no real window to pop up into — on iOS the
        // popup either never opens or can't hand its result back. And on
        // iOS Safari generally (installed or not), the popup routinely
        // reports itself closed the instant it opens, with nothing the
        // visitor did — Safari's OAuth popup handling is unreliable across
        // the board there, not just in standalone mode. So skip it and go
        // straight to redirect on any iOS device.
        if (window.matchMedia('(display-mode: standalone)').matches || isIOS()) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }

        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e) {
          const code = (e as { code?: string }).code ?? '';
          // A blocked or unreachable popup is a browser policy decision, not
          // something the user can fix; a full-page redirect works regardless.
          if (
            code === 'auth/popup-blocked' ||
            code === 'auth/operation-not-supported-in-this-environment' ||
            code === 'auth/web-storage-unsupported' ||
            code === 'auth/internal-error'
          ) {
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          throw e;
        }
      },
      signOut: async () => {
        await fbSignOut(auth);
      },
      refreshLink: async () => {
        if (!auth.currentUser) return;
        const snap = await getDoc(doc(db, 'userLinks', auth.currentUser.uid));
        setLink(snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserLink) : null);
      },
    }),
    [user, link, brother, authResolved, linkResolved, redirectError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
