/*
 * Focus Grove service worker — intentionally tiny.
 *
 * Purpose:
 *   1. Satisfy PWA installability checks (Chrome shows the install
 *      prompt more reliably with an active service worker).
 *   2. Basic offline resilience: network-first, falling back to the
 *      last cached copy when the network is unavailable. Vite already
 *      fingerprints assets, so serving stale-cached files is safe.
 */

const CACHE = 'focus-grove-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['/'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // drop caches from older versions
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  // only handle same-origin GETs (never auth/API calls)
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // keep a fresh copy for offline use
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(request, copy))
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ??
            // offline navigation with nothing cached → the app shell
            (request.mode === 'navigate' ? caches.match('/') : Response.error()),
        ),
      ),
  )
})
