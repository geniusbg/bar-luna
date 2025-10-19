// Luna Bar - Service Worker for PWA & Push Notifications

const CACHE_NAME = 'luna-bar-v1';
const urlsToCache = [
  '/bg/staff'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// 🔔 PUSH NOTIFICATION HANDLER
self.addEventListener('push', (event) => {
  console.log('🔔🔔🔔 PUSH EVENT RECEIVED 🔔🔔🔔', event);
  console.log('Has data:', !!event.data);
  
  let data = {
    title: 'Luna Bar',
    body: 'Ново известие',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'luna-notification-' + Date.now(),
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    silent: false,
    renotify: true
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦📦📦 PAYLOAD PARSED:', JSON.stringify(payload, null, 2));
      data = { ...data, ...payload };
    } catch (e) {
      console.error('❌ Push parse error:', e);
      try {
        const text = event.data.text();
        console.log('📝 Raw text:', text);
        data.body = text;
      } catch (e2) {
        console.error('❌ Could not read as text either:', e2);
      }
    }
  } else {
    console.warn('⚠️ No data in push event!');
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag,
    vibrate: data.vibrate,
    requireInteraction: data.requireInteraction,
    silent: data.silent,
    renotify: data.renotify,
    timestamp: Date.now(),
    data: {
      url: data.url || '/bg/staff',
      timestamp: Date.now()
    }
  };

  console.log('📢📢📢 CALLING showNotification:', data.title);
  console.log('Options:', JSON.stringify(notificationOptions, null, 2));

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
      .then(() => {
        console.log('✅✅✅ NOTIFICATION SHOWN SUCCESSFULLY!');
      })
      .catch(err => {
        console.error('❌❌❌ NOTIFICATION SHOW FAILED:', err);
        console.error('Error details:', err.message, err.stack);
      })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/bg/staff';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if staff dashboard is already open
        for (let client of windowClients) {
          if (client.url.includes('/staff') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync (for offline orders)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Future: sync offline orders when back online
  console.log('Syncing offline orders...');
}

