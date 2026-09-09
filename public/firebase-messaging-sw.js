/*
 * Background push handler.
 *
 * Separate from the PWA's own service worker (vite-plugin-pwa owns sw.js) and
 * registered by src/lib/push.ts at FCM's own scope, so the two registrations
 * never replace each other. A static file can't read the build's env vars, so
 * the config arrives on the registration query string.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = Object.fromEntries(new URL(self.location).searchParams.entries());

if (config.projectId) {
  firebase.initializeApp(config);

  /*
   * The SDK already draws the notification for any message carrying a
   * `notification` block — and then still calls this handler, so showing one
   * here too put every reminder on the lock screen twice. Reminders send that
   * block (with the icon and the tap target), so the only thing left to cover
   * is a data-only push, which the SDK displays not at all.
   */
  firebase.messaging().onBackgroundMessage((payload) => {
    if (payload.notification) return;

    const data = payload.data || {};
    self.registration.showNotification(data.title || 'PNM Tracking', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.kind ? `pnm-${data.kind}` : 'pnm',
      data: { link: (payload.fcmOptions && payload.fcmOptions.link) || data.link || '/' },
    });
  });
}

/*
 * Only fires for the notifications shown above: the SDK stops propagation on
 * the ones it drew itself, having already opened their link.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(clients.openWindow(link));
});
