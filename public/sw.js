// Luna Bar - Service Worker for PWA & Push Notifications

// ⚠️ SYNC THIS VERSION WITH lib/sw-version.ts
const CACHE_VERSION = 'v3.3.6';
const CACHE_NAME = `luna-bar-${CACHE_VERSION}`;
const urlsToCache = [
  '/bg/staff',
  '/bg/admin',
  '/bg/menu',
  '/bg',
  '/offline.html'
];

// Listen for messages from clients (e.g., version requests, skip waiting)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    // Send version back to client
    event.ports[0]?.postMessage({ type: 'SW_VERSION', version: CACHE_VERSION });
    // Also broadcast to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SW_VERSION', version: CACHE_VERSION });
      });
    });
  }
  
  // Handle skip waiting request (force immediate activation)
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('⚡ SKIP_WAITING received, activating new SW immediately');
    self.skipWaiting();
  }
});

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Try to cache all URLs, but don't fail if some are unavailable
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              // If offline.html can't be cached, create it inline
              if (url === '/offline.html') {
                return cache.put(url, new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Server Offline</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.container{max-width:500px;width:100%;text-align:center;background:#1e293b;border-radius:16px;padding:40px;border:1px solid #334155}h1{font-size:24px;font-weight:700;margin-bottom:12px}p{color:#cbd5e1;line-height:1.6;margin-bottom:24px}</style></head><body><div class="container"><h1>Временен проблем със сървъра</h1><p>Сървърът е временно недостъпен. Приложението проверява автоматично на всеки 10 секунди дали сървърът е отново онлайн.</p></div></body></html>', {
                  headers: { 'Content-Type': 'text/html' }
                }));
              }
            })
          )
        );
      })
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
        // Return an error response instead of throwing
        return new Response(JSON.stringify({ error: 'Server offline' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
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
        // For API routes, return JSON error instead of offline.html
        // IMPORTANT: This check must be FIRST before any cache lookups
        if (url.pathname.startsWith('/api/')) {
          console.log('🔴 SW: API route failed, returning JSON error:', url.pathname);
          // Notify clients that server is offline
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SERVER_OFFLINE',
                message: 'Сървърът е недостъпен'
              });
            });
          });
          // Return JSON error for API routes
          return new Response(JSON.stringify({ error: 'Server offline' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // For non-API routes, try cache
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If navigation request and no cache, try to serve main page first (so React app loads)
          if (request.mode === 'navigate') {
            // Notify clients that server is offline
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  type: 'SERVER_OFFLINE',
                  message: 'Сървърът е недостъпен'
                });
              });
            });
            
            // Return minimal HTML with modal that preserves the current URL (no redirect)
            const offlineModalHTML = `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Временен проблем със сървъра</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0f172a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .modal {
      background: #1e293b;
      border-radius: 16px;
      padding: 32px;
      border: 1px solid #334155;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #f59e0b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    p {
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 0;
    }
    .checking {
      background: #10b981 !important;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="modal">
    <div class="icon" id="icon">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
    </div>
    <h1 id="title">Временен проблем със сървъра</h1>
    <p id="message">Сървърът е временно недостъпен. Приложението проверява автоматично на всеки 10 секунди дали сървърът е отново онлайн.</p>
  </div>
  <script>
    // Prevent redirect to login when offline
    if (typeof window !== 'undefined') {
      window.__isOffline = true;
    }
    
    let checkInterval;
    async function checkHealth() {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000)
        });
        if (response.status === 200 && response.ok) {
          document.getElementById('icon').className = 'icon checking';
          document.getElementById('title').textContent = 'Връзката е възстановена!';
          document.getElementById('message').textContent = 'Вече имате интернет връзка. Приложението е готово за използване.';
          // Mark as online before reload
          if (typeof window !== 'undefined') {
            window.__isOffline = false;
          }
          clearInterval(checkInterval);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } catch (error) {
        // Server still offline
      }
    }
    checkHealth();
    checkInterval = setInterval(checkHealth, 10000);
  </script>
</body>
</html>`;
            
            return new Response(offlineModalHTML, {
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            });
          }
          // For non-navigation non-API requests, return error (don't serve offline.html)
          // This prevents HTML from being returned for API-like requests
          return new Response('Resource not available offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
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

