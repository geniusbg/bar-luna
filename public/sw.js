// Luna Bar - Service Worker for PWA & Push Notifications

const CACHE_VERSION = 'v3.2.1'; // Increment this for updates (change when you update the app)
const CACHE_NAME = `luna-bar-${CACHE_VERSION}`;
const urlsToCache = [
  '/bg/staff',
  '/bg/admin',
  '/bg/menu',
  '/bg'
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  // Force immediate activation
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
  // Take control immediately
  self.clients.claim();
});

// Fetch strategy - Network first, fallback to cache
// Only cache same-origin requests, let external images pass through
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;
  
  // Skip caching for external domains
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }
  
  // For POST/PUT/DELETE requests: Always go to network and detect offline
  if (request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() => {
        // Notify clients that server is offline
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SERVER_OFFLINE',
              message: 'Сървърът е недостъпен'
            });
          });
        });
        // Re-throw the error to show normal browser error
        throw new Error('Server offline');
      })
    );
    return;
  }
  
  
  // For same-origin GET requests: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        // For non-API routes, try cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Re-throw error if no cache
          throw new Error('No cache available');
        });
      })
  );
});

// 🔔 PUSH NOTIFICATION HANDLER
self.addEventListener('push', (event) => {
  console.log('🔔🔔🔔 PUSH EVENT RECEIVED 🔔🔔🔔', event);
  console.log('Has data:', !!event.data);
  
  let data = {
    title: 'Luna Bar',
    body: 'Ново известие',
    icon: '/luna-icon-192.png',
    badge: '/luna-icon-192.png',
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
    icon: data.icon || '/luna-icon-192.png',
    badge: data.badge || '/luna-icon-192.png',
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

