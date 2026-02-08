// Service Worker for PWA offline functionality
// Optimized for mobile performance and offline experience

const CACHE_NAME = 'gati-rehab-v2';
const RUNTIME_CACHE = 'gati-runtime-v2';
const API_CACHE = 'gati-api-v2';

// Assets to cache on install - Mobile optimized
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm/vision_wasm_internal.wasm',
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
];

// Mobile-optimized API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth',
  '/api/patients',
  '/api/sessions',
  '/api/ai',
];

// Install event - cache essential assets with mobile optimization
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing for mobile...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching mobile app shell');
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
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
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

// Fetch event - mobile-optimized caching strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Vite HMR and dev scripts
  if (event.request.url.includes('node_modules') ||
    event.request.url.includes('@vite') ||
    event.request.url.includes('/src/') ||
    event.request.url.includes('?v=') ||
    event.request.url.includes('token=')) {
    return;
  }

  // Mobile-optimized caching strategy
  if (event.request.destination === 'image') {
    // Cache images with longer TTL for mobile
    event.respondWith(cacheFirstStrategy(event.request, 'images'));
  } else if (event.request.url.includes('/api/')) {
    // API calls - network first with cache fallback
    event.respondWith(networkFirstStrategy(event.request, API_CACHE));
  } else {
    // HTML and critical assets - cache first
    event.respondWith(cacheFirstStrategy(event.request, RUNTIME_CACHE));
  }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(cacheName);
      cache.put(request, responseClone);
    }
    return networkResponse;
  } catch (err) {
    console.log('[Service Worker] Network failed, serving offline fallback', err);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    // Return cached response or error
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network-first strategy for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      const cache = await caches.open(cacheName);
      cache.put(request, responseClone);
    }
    return networkResponse;
  } catch (err) {
    console.log('[Service Worker] API failed, serving cached response', err);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('{"error": "Offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync event (for syncing data when back online)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync for mobile:', event.tag);

  if (event.tag === 'sync-session-data') {
    event.waitUntil(
      syncSessionData()
    );
  } else if (event.tag === 'sync-offline-data') {
    event.waitUntil(
      syncOfflineData()
    );
  }
});

// Helper function to sync session data
async function syncSessionData() {
  try {
    console.log('[Service Worker] Syncing session data...');

    // Check for offline session data
    const offlineData = await getOfflineData('session_data');

    if (offlineData && offlineData.length > 0) {
      for (const session of offlineData) {
        try {
          await fetch('/api/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(session)
          });

          // Remove synced data
          await removeOfflineData('session_data', session.id);
        } catch (error) {
          console.error('Failed to sync session:', error);
        }
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Session sync failed:', error);
    return Promise.reject(error);
  }
}

// Helper function to sync offline data
async function syncOfflineData() {
  try {
    console.log('[Service Worker] Syncing offline data...');

    // Sync various types of offline data
    const dataTypes = ['session_data', 'patient_data', 'ai_feedback'];

    for (const dataType of dataTypes) {
      const offlineData = await getOfflineData(dataType);

      if (offlineData && offlineData.length > 0) {
        for (const data of offlineData) {
          try {
            await fetch(`/api/${dataType}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data)
            });

            await removeOfflineData(dataType, data.id);
          } catch (error) {
            console.error(`Failed to sync ${dataType}:`, error);
          }
        }
      }
    }

    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Offline data sync failed:', error);
    return Promise.reject(error);
  }
}

// IndexedDB helpers for offline data storage
async function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gati-offline', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

async function removeOfflineData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gati-offline', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };

    request.onerror = () => reject(request.error);
  });
}

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification from Gati Rehab',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    tag: 'gati-rehab-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Gati Rehab', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Periodic background sync for data updates (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync triggered');

  if (event.tag === 'update-content') {
    event.waitUntil(
      updateContent()
    );
  }
});

async function updateContent() {
  try {
    console.log('[Service Worker] Updating content...');

    // Pre-fetch critical content for offline use
    const criticalUrls = [
      '/',
      '/patient-dashboard',
      '/doctor-dashboard'
    ];

    const cache = await caches.open(RUNTIME_CACHE);
    await Promise.all(
      criticalUrls.map(url => fetch(url).then(response => {
        if (response.ok) {
          cache.put(url, response);
        }
      }))
    );

    console.log('[Service Worker] Content updated');
  } catch (error) {
    console.error('[Service Worker] Content update failed:', error);
  }
}
