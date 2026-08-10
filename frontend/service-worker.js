const CACHE_NAME = "ugotour-phase8-9-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/main.css",
  "./css/components.css",
  "./css/animations.css",
  "./css/responsive.css",
  "./css/map.css",
  "./js/app.js",
  "./js/api.js",
  "./js/pwa.js",
  "./js/ui-motion.js",
  "./js/components/navbar.js",
  "./js/components/footer.js",
  "./js/components/destination-card.js",
  "./js/services/auth-service.js",
  "./js/services/session-guard.js",
  "./js/services/booking-service.js",
  "./js/services/destination-service.js",
  "./js/services/attraction-service.js",
  "./js/services/map-service.js",
  "./js/utils/validation.js",
  "./js/utils/assets.js",
  "./js/pages/destinations.js",
  "./js/pages/map.js",
  "./js/pages/destination-details.js",
  "./js/pages/bookings.js",
  "./js/pages/login.js",
  "./js/pages/signup.js",
  "./js/pages/profile.js",
  "./pages/destinations.html",
  "./pages/map.html",
  "./pages/destination-details.html",
  "./pages/bookings.html",
  "./pages/login.html",
  "./pages/signup.html",
  "./pages/profile.html",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./images/uganda-forest-fallback.jpg",
  "./images/profile-page-background.jpg",
  "./data/uganda-boundary.geojson"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // API data stays network-driven so account and booking information is never
  // served from an old service-worker cache.
  if (url.pathname.startsWith("/api/") || url.port === "3000") return;

  // HTML, CSS and JavaScript are network-first so a visual architecture update
  // cannot combine a new page structure with stale cached presentation logic.
  if (
    url.origin === self.location.origin &&
    ["document", "style", "script"].includes(event.request.destination)
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Leaflet itself and OpenStreetMap map tiles are intentionally NOT pre-cached.
  // The community OSM tile service prohibits bulk/offline prefetching; the map
  // page instead shows an offline fallback when tiles cannot be reached.

  // Phase 8.5 keeps destination images network-first. This matters because the
  // developer replaces compatibility placeholders with the downloaded 2400px
  // files after copying the ZIP; the service worker must not trap an old image.
  if (url.origin === self.location.origin && url.pathname.includes("/images/destinations/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
