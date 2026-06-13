/* FlowDay service worker — schedules "5 minutes left" notifications so they fire
   even when the tab is in the background. (A fully-closed browser would need the
   Push API + a server with VAPID keys; that's the documented next step.) */

const timers = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
  const msg = event.data || {};

  if (msg.type === 'reschedule') {
    // Clear everything and set fresh timers for the supplied items.
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
    for (const item of msg.items || []) {
      const delay = item.at - Date.now();
      if (delay <= 0) continue;
      const id = setTimeout(() => {
        self.registration.showNotification(item.title, {
          body: item.body,
          tag: item.id,
          icon: '/flow-icon.svg',
          badge: '/flow-icon.svg',
        });
        timers.delete(item.id);
      }, delay);
      timers.set(item.id, id);
    }
  }

  if (msg.type === 'clear') {
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  }

  if (msg.type === 'notify') {
    self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: '/flow-icon.svg',
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow('/');
    }),
  );
});
