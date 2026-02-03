// Service Worker for PWA offline functionality
// Owner: Member 6

const CACHE_NAME = 'gati-rehab-v1';
const RUNTIME_CACHE = 'gati-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/logo.png',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for runtime
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Network failed, check if we have an offline fallback
          console.log('[Service Worker] Network failed, serving offline page');

          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Background sync event (for syncing data when back online)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-session-data') {
    event.waitUntil(
      // This will be called when the device comes back online
      syncSessionData()
    );
  }
});

// Helper function to sync session data
async function syncSessionData() {
  try {
    console.log('[Service Worker] Syncing session data...');

    // TODO: Implement actual sync logic
    // This should read from IndexedDB/localStorage and POST to Firestore

    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    return Promise.reject(error);
  }
}

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification from Gati Rehab',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('Gati Rehab', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
