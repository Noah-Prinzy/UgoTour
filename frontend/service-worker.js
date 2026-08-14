// ============================================================
// UgoTour PWA SERVICE WORKER — PHASE 1.29B
// Pre-caches the application shell, removes old cache versions, provides an
// offline navigation fallback and uses network-first behavior for HTML/CSS/JS.
// Live API requests and OpenStreetMap tiles deliberately bypass this cache.
// ============================================================

// Changing this version creates a fresh application cache during deployment.
const CACHE_NAME = "ugotour-v1-16-14";

// Files required for the installable/offline-capable UgoTour application shell.
// Dynamic account/API data and map tiles are intentionally not pre-cached here.
const APP_SHELL = [
  "./", "./index.html", "./offline.html", "./manifest.webmanifest", "./favicon.svg",
  "./css/main.css", "./css/components.css", "./css/animations.css", "./css/responsive.css", "./css/mobile-phase1.css", "./css/map.css", "./css/phase1-19.css", "./css/phase1-20.css", "./css/phase1-21.css", "./css/phase1-22.css", "./css/phase1-23.css", "./css/phase1-24.css", "./css/phase1-25.css", "./css/phase1-28.css", "./css/phase1-29.css", "./css/phase1-29b.css", "./css/phase1-29b-destination-cards.css",
  "./js/app.js", "./js/home-card-routing.js", "./js/auth-home-transition.js", "./js/auth-password-visibility.js", "./js/api.js", "./js/pwa.js", "./js/shared-navigation-copy.js", "./js/favorites-copy.js", "./js/route-alias.js", "./js/footer-boot.js", "./js/ui-motion.js",
  "./js/components/navbar.js", "./js/components/footer.js", "./js/components/destination-card.js",
  "./js/services/auth-service.js", "./js/services/session-guard.js", "./js/services/booking-service.js",
  "./js/services/destination-service.js", "./js/services/attraction-service.js", "./js/services/map-service.js",
  "./js/services/saved-service.js", "./js/services/contact-service.js", "./js/services/admin-service.js",
  "./js/utils/validation.js", "./js/utils/assets.js",
  "./js/pages/destinations.js", "./js/pages/destination-experience.js", "./js/pages/map.js", "./js/pages/map-search-intent.js", "./js/pages/map-polish.js", "./js/pages/destination-details.js", "./js/pages/bookings.js",
  "./js/pages/login.js", "./js/pages/signup.js", "./js/pages/profile.js", "./js/pages/profile-settings.js", "./js/pages/saved.js",
  "./js/pages/forgot-password.js", "./js/pages/reset-password.js", "./js/pages/contact.js", "./js/pages/admin.js", "./js/pages/static-page.js", "./js/pages/offline.js",
  "./pages/destinations.html", "./pages/map.html", "./pages/destination-details.html", "./pages/bookings.html", "./pages/trips.html",
  "./pages/login.html", "./pages/signup.html", "./pages/profile.html", "./pages/profile-settings.html", "./pages/saved.html", "./pages/favorites.html",
  "./pages/forgot-password.html", "./pages/reset-password.html", "./pages/about.html", "./pages/help.html",
  "./pages/contact.html", "./pages/terms.html", "./pages/admin.html",
  "./assets/icons/icon-192.png", "./assets/icons/icon-512.png",
  "./images/optimized/uganda-forest-fallback.webp", "./images/optimized/profile-page-background.webp",
  "./images/optimized/backgrounds/saved-kalangala-beach.webp", "./images/optimized/backgrounds/bookings-bushenyi-road.webp",
  "./images/optimized/destinations/murchison-falls/murchison-01.webp",
  "./images/optimized/destinations/lake-bunyonyi/lake-bunyonyi-01.webp",
  "./images/optimized/destinations/kidepo/kidepo-04.webp",
  "./images/optimized/destinations/rwenzori/rwenzori-01.webp",
  "./images/optimized/destinations/queen-elizabeth/queen-elizabeth-02.webp",
  "./data/uganda-boundary.geojson"
];

// INSTALL: download the complete app shell into the versioned cache.
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

// ACTIVATE: remove obsolete UgoTour caches and immediately take control of clients.
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

// The Update button in pwa.js sends this message so a waiting worker can activate.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// Fetch a resource from the network and optionally write a successful same-origin
// response into the cache. Cache-write failures never invalidate a good response.
async function fetchAndCache(request, shouldCache) {
  const response = await fetch(request);
  if (!shouldCache || !response.ok) return response;

  const cacheCopy = response.clone();
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, cacheCopy);
  } catch {
    // A cache write must never turn a successful network response into a page error.
  }
  return response;
}

// Route every GET request through the appropriate online/offline strategy.
self.addEventListener("fetch", (event) => {
  // Mutating requests are never intercepted by the service worker.
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // REST API responses remain live/server-controlled, and map tiles remain external.
  if (url.pathname.startsWith("/api/") || url.port === "3000") return;
  if (url.hostname === "tile.openstreetmap.org" || url.hostname.endsWith(".tile.openstreetmap.org")) return;

  // Page navigations are network-first. If offline, use a cached copy of that page
  // and finally the dedicated offline.html fallback when no page copy exists.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(event.request, url.origin === self.location.origin)
        .catch(async () => (await caches.match(event.request)) || caches.match("./offline.html"))
    );
    return;
  }

  // Styles and JavaScript are network-first so deployments are picked up quickly,
  // with the previously cached file available when the network is unavailable.
  if (url.origin === self.location.origin && ["style", "script"].includes(event.request.destination)) {
    event.respondWith(
      fetchAndCache(event.request, true).catch(() => caches.match(event.request))
    );
    return;
  }

  // Other assets (images, icons, GeoJSON, etc.) are cache-first, then fetched and
  // cached on demand when they belong to this UgoTour origin.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetchAndCache(event.request, url.origin === self.location.origin);
    })
  );
});
