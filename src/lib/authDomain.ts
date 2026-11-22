/**
 * Picks the authDomain the Firebase Auth SDK should use.
 *
 * Firebase's redirect sign-in hands the result back through a hidden iframe on
 * the authDomain. When that domain differs from the page's own domain (the app
 * on pnmtracking.web.app, authDomain left at the console default
 * pnmtracking.firebaseapp.com), Safari and other browsers that partition
 * third-party storage hide the result from the app: Google says you're signed
 * in, the page comes back, and the app still has no user. Using the page's own
 * host as authDomain keeps the whole hand-off first-party.
 *
 * That only works where the page's host serves Firebase's /__/auth/ handler,
 * which Firebase Hosting does on its *.web.app and *.firebaseapp.com domains.
 * Anywhere else (localhost, the emulator, another host) the configured value
 * is used unchanged.
 */
export function resolveAuthDomain(configured: string, pageHost: string | undefined): string {
  if (!pageHost) return configured;
  const hostname = pageHost.split(':')[0].toLowerCase();
  if (hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com')) {
    return pageHost;
  }
  return configured;
}
