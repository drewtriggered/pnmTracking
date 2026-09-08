/*
 * Background push handler.
 *
 * Separate from the PWA's own service worker (vite-plugin-pwa owns sw.js) and
 * registered by src/lib/push.ts. A static file can't read the build's env
 * vars, so the config arrives on the registration query string.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = Object.fromEntries(new URL(self.location).searchParams.entries());

if (config.projectId) {
  firebase.initializeApp(config);
  firebase.messaging().onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    self.registration.showNotification(title || 'PNM Tracking', {
      body: body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: payload.fcmOptions || {},
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';
  event.waitUntil(clients.openWindow(link));
});
