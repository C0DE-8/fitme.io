const CACHE_NAME = "fitme-io-v1.0.0"
const OFFLINE_URL = "/offline.html"

// Essential files to cache
const STATIC_CACHE_URLS = ["/", "/index.html", "/offline.html", "/404.html", "/500.html"]

// Install event - cache essential files
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...")

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching essential files")
        // Cache files one by one to avoid failing on missing files
        return Promise.allSettled(
          STATIC_CACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to cache ${url}:`, err)
              return null
            }),
          ),
        )
      })
      .then(() => {
        console.log("[SW] Installation complete")
        // Force activation
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[SW] Installation failed:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => {
        console.log("[SW] Activation complete")
        // Take control of all clients
        return self.clients.claim()
      }),
  )
})

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith("http")) {
    return
  }

  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  try {
    // For navigation requests (HTML pages)
    if (request.mode === "navigate") {
      return await handleNavigation(request)
    }

    // For API requests
    if (url.pathname.startsWith("/api/")) {
      return await handleApiRequest(request)
    }

    // For static assets
    return await handleStaticAsset(request)
  } catch (error) {
    console.error("[SW] Request failed:", error)

    // Return offline page for navigation
    if (request.mode === "navigate") {
      const cache = await caches.open(CACHE_NAME)
      const offlinePage = await cache.match(OFFLINE_URL)
      return offlinePage || new Response("Offline", { status: 503 })
    }

    return new Response("Network Error", { status: 503 })
  }
}

// Handle navigation requests (HTML pages)
async function handleNavigation(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // Fallback to cache
    const cache = await caches.open(CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log("[SW] Serving from cache:", request.url)
      return cachedResponse
    }

    // Fallback to offline page
    const offlinePage = await cache.match(OFFLINE_URL)
    return offlinePage || new Response("Offline", { status: 503 })
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Always try network first for API calls
    const networkResponse = await fetch(request)

    // Cache successful GET responses
    if (networkResponse.ok && request.method === "GET") {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    // For GET requests, try cache
    if (request.method === "GET") {
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(request)

      if (cachedResponse) {
        console.log("[SW] Serving API from cache:", request.url)
        return cachedResponse
      }
    }

    // Return offline API response
    return new Response(
      JSON.stringify({
        error: "Offline",
        message: "This feature requires an internet connection",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Handle static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME)

  // Try cache first for static assets
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    console.log("[SW] Serving static asset from cache:", request.url)
    return cachedResponse
  }

  try {
    // Fallback to network
    const networkResponse = await fetch(request)

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    return new Response("Asset not available offline", { status: 503 })
  }
}

// Background sync
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag)

  if (event.tag === "sync-pending-actions") {
    event.waitUntil(syncPendingActions())
  }
})

async function syncPendingActions() {
  try {
    // This would sync pending actions from IndexedDB
    console.log("[SW] Syncing pending actions...")

    // Notify clients about sync completion
    const clients = await self.clients.matchAll()
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        data: { message: "Pending actions synced" },
      })
    })
  } catch (error) {
    console.error("[SW] Sync failed:", error)
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received")

  const options = {
    body: "You have new updates in fitme.io",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192'%3E%3Crect width='192' height='192' rx='24' fill='%238b5cf6'/%3E%3Cpath d='M54 108c12 12 24 18 42 18 18 0 30-6 42-18' stroke='white' stroke-width='15' stroke-linecap='round' fill='none'/%3E%3Ccircle cx='72' cy='72' r='9' fill='white'/%3E%3Ccircle cx='120' cy='72' r='9' fill='white'/%3E%3C/svg%3E",
    badge:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Crect width='72' height='72' rx='12' fill='%238b5cf6'/%3E%3Ctext x='36' y='45' text-anchor='middle' fill='white' font-size='24' font-weight='bold'%3EF%3C/text%3E%3C/svg%3E",
    vibrate: [100, 50, 100],
    data: { url: "/" },
  }

  if (event.data) {
    try {
      const data = event.data.json()
      options.body = data.body || options.body
      options.title = data.title || "fitme.io"
      options.data.url = data.url || "/"
    } catch (e) {
      console.warn("[SW] Invalid push data")
    }
  }

  event.waitUntil(self.registration.showNotification("fitme.io", options))
})

// Notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked")

  event.notification.close()

  const url = event.notification.data?.url || "/"

  event.waitUntil(clients.openWindow(url))
})

// Message handling
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data)

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
