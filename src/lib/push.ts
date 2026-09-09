import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { arrayRemove, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db, firebaseApp } from './firebase';

/**
 * Web push registration.
 *
 * Tokens live on the brother record as an array — one per device — because a
 * brother with a phone and a laptop should be reachable on both. Dead tokens
 * are pruned server-side when FCM rejects them.
 */

export type PushState =
  | 'unsupported'
  | 'needs-install'
  | 'denied'
  | 'granted'
  | 'prompt';

/** Chrome/Firefox/Edge support this outright; iOS only once installed. */
export async function pushState(): Promise<PushState> {
  if (!(await isSupported().catch(() => false))) {
    // iOS Safari only exposes the API to a home-screen install (16.4+).
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const installed = window.matchMedia('(display-mode: standalone)').matches;
    return iOS && !installed ? 'needs-install' : 'unsupported';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return 'prompt';
}

/**
 * FCM's own scope, kept deliberately.
 *
 * A service worker registration is keyed by scope, so registering the
 * messaging worker at the default "/" replaced the PWA's sw.js — and the PWA's
 * own registration on the next load replaced it straight back, leaving pushes
 * arriving at a worker with no handler for them. This is the scope the
 * Firebase SDK uses when it registers the worker itself, so nothing collides.
 */
const FCM_SCOPE = '/firebase-cloud-messaging-push-scope';

/** The background handler needs the config too; it reads it off the query string. */
function messagingSwUrl(): string {
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

/**
 * The one registration every token in this module is read from.
 *
 * Letting the SDK fall back to its own default would register the worker
 * without the query string — a worker with no Firebase config, and so no
 * background handler at all.
 */
function messagingWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(messagingSwUrl(), { scope: FCM_SCOPE });
}

/**
 * Asks for permission and stores this device's token. Must be called from a
 * user gesture — browsers ignore an unprompted permission request.
 */
export async function enablePush(brotherId: string): Promise<string> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error('No VAPID key configured. Add VITE_FIREBASE_VAPID_KEY to .env.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notifications are blocked for this site.');
  }

  const registration = await messagingWorker();
  const token = await getToken(getMessaging(firebaseApp), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error('Could not register this device for notifications.');

  await updateDoc(doc(db, 'brothers', brotherId), { fcmTokens: arrayUnion(token) });
  return token;
}

/**
 * Drops this device: unsubscribes it from push, then forgets the token.
 *
 * Reading the token back from the same registration matters — from any other
 * one it is a different token, and removing that from the array would leave
 * this device's real token in place, still being pushed to.
 */
export async function disablePush(brotherId: string): Promise<void> {
  const messaging = getMessaging(firebaseApp);
  const registration = await messagingWorker().catch(() => null);
  const token = registration
    ? await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      }).catch(() => null)
    : null;

  if (token) {
    await updateDoc(doc(db, 'brothers', brotherId), { fcmTokens: arrayRemove(token) });
    // Best effort: the record is already clean, and a token the browser keeps
    // is harmless once the server has stopped addressing it.
    await deleteToken(messaging).catch(() => undefined);
  }
}

/** Foreground messages don't raise a system notification on their own. */
export async function onForegroundMessage(handler: (title: string, body: string) => void) {
  if (!(await isSupported().catch(() => false))) return () => {};
  return onMessage(getMessaging(firebaseApp), (payload) => {
    handler(payload.notification?.title ?? 'PNM Tracking', payload.notification?.body ?? '');
  });
}
