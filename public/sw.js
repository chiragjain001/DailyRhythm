// Enhanced Service Worker for MindSync PWA
const CACHE_NAME = 'mindsync-v1.0.3';
const staticAssets = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-icon-180.png'
];

// Install event - cache only static assets that are guaranteed to exist
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Opened cache');
        // Cache static assets one by one with error handling
        const cachePromises = staticAssets.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`Cached: ${url}`);
            } else {
              console.warn(`Failed to cache ${url}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`Error caching ${url}:`, error);
          }
        });
        await Promise.allSettled(cachePromises);
        console.log('Cache installation completed');
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - improved handling with better error management
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests and chrome-extension requests
  if (!event.request.url.startsWith(self.location.origin) || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip Next.js internal requests and API routes to avoid conflicts
  if (event.request.url.includes('_next/') || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('__nextjs_original-stack-frame')) {
    return;
  }

  // For navigation requests (page loads), let the browser handle them naturally
  // Only intercept static asset requests
  if (event.request.mode === 'navigate') {
    console.log('Skipping navigation request to avoid redirect issues:', event.request.url);
    return;
  }

  event.respondWith(
    handleFetch(event.request)
  );
});

async function handleFetch(request) {
  try {
    // Check cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Serving from cache:', request.url);
      return cachedResponse;
    }

    // Only handle static assets - let navigation requests go through normally
    const isStaticAsset = request.url.includes('/icons/') || 
                         request.url.includes('/manifest.json') ||
                         request.url.includes('.png') ||
                         request.url.includes('.jpg') ||
                         request.url.includes('.svg') ||
                         request.url.includes('.ico');

    if (!isStaticAsset) {
      // For non-static assets, just fetch normally without caching
      return fetch(request);
    }

    // Fetch static assets with caching
    console.log('Fetching static asset:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful static asset responses
    if (networkResponse && networkResponse.status === 200) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, networkResponse.clone());
        console.log('Cached static asset:', request.url);
      } catch (cacheError) {
        console.warn('Failed to cache static asset:', request.url, cacheError);
      }
    }

    return networkResponse;

  } catch (error) {
    console.error('Fetch failed for static asset:', request.url, error);
    
    // For static assets, try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Returning cached version after network failure:', request.url);
      return cachedResponse;
    }
    
    // If no cached version, let the error propagate
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline actions when connection is restored
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from MindSync',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('MindSync', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
