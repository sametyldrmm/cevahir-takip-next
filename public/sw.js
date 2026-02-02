// Service Worker - Browser Push Notifications
// Bu dosya tarayıcıda arka planda çalışır ve push bildirimlerini yakalar

const CACHE_NAME = 'cpm-v1';
const NOTIFICATION_TITLE = 'CPM Bildirimi';

// Service Worker install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting(); // Hemen aktif ol
});

// Service Worker activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Tüm sayfalara hemen kontrolü al
});

// Push notification event - Arka planda bildirim geldiğinde
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  let notificationData = {
    title: NOTIFICATION_TITLE,
    body: 'Yeni bir bildiriminiz var',
    icon: '/favicon.png', // Fallback icon
    badge: '/favicon.png',
    tag: 'cpm-notification',
    requireInteraction: false,
    silent: false,
  };

  // Eğer push event'inde data varsa kullan
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
      };
    } catch (e) {
      // JSON parse hatası - text olarak al
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Bildirimi göster
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: [200, 100, 200], // Bildirim titreşimi
      actions: notificationData.data?.actions || [],
    })
  );
});

// Notification click event - Kullanıcı bildirime tıkladığında
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close(); // Bildirimi kapat

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';

  // Tıklanan action'a göre işlem yap
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  } else {
    // Varsayılan: Uygulamayı aç/focus et
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Eğer açık bir pencere varsa focus et
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});

// Message event - Sayfadan service worker'a mesaj gönderme
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

