// Service Worker for TourTrip PWA
const CACHE_NAME = 'tourtrip-v1.0.0';
const STATIC_CACHE = 'tourtrip-static-v1.0.0';
const DYNAMIC_CACHE = 'tourtrip-dynamic-v1.0.0';
const FIRESTORE_CACHE = 'tourtrip-firestore-v1.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
  '/_next/static/css/',
  '/_next/static/js/',
];

// Firebase SDK resources to cache
const FIREBASE_ASSETS = [
  'https://www.gstatic.com/firebasejs/',
  'https://firestore.googleapis.com/',
  'https://identitytoolkit.googleapis.com/',
  'https://securetoken.googleapis.com/',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache Firebase assets
      caches.open(FIRESTORE_CACHE).then((cache) => {
        console.log('[SW] Caching Firebase assets');
        return cache.addAll(FIREBASE_ASSETS);
      }),

      // Skip waiting to activate immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== FIRESTORE_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (isFirebaseRequest(url)) {
    event.respondWith(handleFirebaseRequest(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDefaultRequest(request));
  }
});

// Handle Firebase requests with offline support
async function handleFirebaseRequest(request) {
  try {
    // Try network first for Firebase requests
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(FIRESTORE_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Firebase request failed, trying cache');

    // Try cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for Firestore
    return new Response(
      JSON.stringify({
        error: 'Offline mode - some features may be limited',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);

    // Cache GET requests
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    return new Response(
      JSON.stringify({ error: 'Network error', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  // Try cache first for images
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cache successful image responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Return placeholder for failed image requests
    return new Response('', {
      status: 404,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // For HTML requests, return offline page
    if (request.headers.get('accept').includes('text/html')) {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }

    return new Response('', { status: 404 });
  }
}

// Handle default requests
async function handleDefaultRequest(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for HTML requests
    if (request.headers.get('accept').includes('text/html')) {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('Offline', { status: 503 });
    }

    return new Response('', { status: 404 });
  }
}

// Utility functions
function isFirebaseRequest(url) {
  return url.hostname.includes('firestore.googleapis.com') ||
         url.hostname.includes('identitytoolkit.googleapis.com') ||
         url.hostname.includes('securetoken.googleapis.com') ||
         url.hostname.includes('firebaseio.com');
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('tourtrip.app') && url.pathname.includes('/api');
}

function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) ||
         url.searchParams.has('image') ||
         url.pathname.includes('/images/');
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/i) ||
         url.pathname.startsWith('/_next/static/') ||
         STATIC_ASSETS.some(asset => url.pathname.startsWith(asset));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'TourTrip\'ten yeni bildirim',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        action: data.action,
      },
      actions: [
        {
          action: 'view',
          title: 'Görüntüle',
        },
        {
          action: 'dismiss',
          title: 'Kapat',
        },
      ],
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'TourTrip', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync function
async function syncOfflineActions() {
  try {
    const cache = await caches.open('offline-actions');
    const keys = await cache.keys();

    for (const request of keys) {
      try {
        await fetch(request);
        await cache.delete(request);
        console.log('[SW] Synced offline action:', request.url);
      } catch (error) {
        console.error('[SW] Failed to sync action:', request.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    console.log('[SW] Cache update requested');
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  try {
    const cache = await caches.open(STATIC_CACHE);

    // Update critical resources
    const criticalAssets = [
      '/',
      '/manifest.json',
      '/offline.html',
    ];

    await cache.addAll(criticalAssets);
    console.log('[SW] Cache updated');
  } catch (error) {
    console.error('[SW] Cache update failed:', error);
  }
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();

    // Remove old entries (keep only last 50)
    if (keys.length > 50) {
      const toDelete = keys.slice(0, keys.length - 50);
      await Promise.all(toDelete.map(key => cache.delete(key)));
      console.log('[SW] Cleaned up', toDelete.length, 'old cache entries');
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}, 1000 * 60 * 60); // Every hour

console.log('[SW] Service Worker loaded');
