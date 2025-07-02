// Service Worker for SmartyPants-AI PWA
const CACHE_NAME = "smartypants-ai-v1.0.0";
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/style.css",
  "/js/index.js",

  "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=400",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log("Service Worker: Installation complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Installation failed", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activation complete");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline, network when online
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        // For API requests, try network first, fallback to cache
        if (
          event.request.url.includes("/ask") ||
          event.request.url.includes("/upload-syllabus")
        ) {
          return fetch(event.request)
            .then((networkResponse) => {
              return networkResponse;
            })
            .catch(() => {
              return cachedResponse;
            });
        }
        return cachedResponse;
      }

      // For new requests, try network first
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.log("Service Worker: Network request failed", error);

          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }

          throw error;
        });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Service Worker: Background sync triggered");
    event.waitUntil(
      // Handle any queued requests here
      Promise.resolve()
    );
  }
});

// Push notification handling (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "New notification from SmartyPants-AI",
      icon: "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=192",
      badge:
        "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=96",
      vibrate: [200, 100, 200],
      data: data,
      actions: [
        {
          action: "open",
          title: "Open App",
          icon: "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=96",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "SmartyPants-AI",
        options
      )
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(clients.openWindow("/"));
  }
});
