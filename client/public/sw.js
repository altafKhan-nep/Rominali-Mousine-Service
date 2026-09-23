/* Service worker: handles web-push notifications for Romina Limousine Service. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = { title: 'Romina Limousine Service', message: '', data: {} };
  try {
    const parsed = JSON.parse(event.data?.text() || '{}');
    data = { ...data, ...parsed };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/favicon.ico',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.navigate(url).then((c) => c.focus());
      }
      return self.clients.openWindow(url);
    })
  );
});
