const CACHE_NAME = "ugotour-v1-16-12";

const APP_SHELL = [
  "./", "./index.html", "./offline.html", "./manifest.webmanifest", "./favicon.svg",
  "./css/main.css", "./css/components.css", "./css/animations.css", "./css/responsive.css", "./css/mobile-phase1.css", "./css/map.css", "./css/phase1-19.css", "./css/phase1-20.css", "./css/phase1-21.css", "./css/phase1-22.css", "./css/phase1-23.css", "./css/phase1-24.css", "./css/phase1-25.css", "./css/phase1-28.css", "./css/phase1-29.css",
  "./js/app.js", "./js/home-card-routing.js", "./js/auth-home-transition.js", "./js/auth-password-visibility.js", "./js/api.js", "./js/pwa.js", "./js/shared-navigation-copy.js", "./js/footer-boot.js", "./js/ui-motion.js",
  "./js/components/navbar.js", "./js/components/footer.js", "./js/components/destination-card.js",
  "./js/services/auth-service.js", "./js/services/session-guard.js", "./js/services/booking-service.js",
  "./js/services/destination-service.js", "./js/services/attraction-service.js", "./js/services/map-service.js",
  "./js/services/saved-service.js", "./js/services/contact-service.js", "./js/services/admin-service.js",
  "./js/utils/validation.js", "./js/utils/assets.js",
  "./js/pages/destinations.js", "./js/pages/destination-experience.js", "./js/pages/map.js", "./js/pages/map-search-intent.js", "./js/pages/map-polish.js", "./js/pages/destination-details.js", "./js/pages/bookings.js",
  "./js/pages/login.js", "./js/pages/signup.js", "./js/pages/profile.js", "./js/pages/profile-settings.js", "./js/pages/saved.js",
  "./js/pages/forgot-password.js", "./js/pages/reset-password.js", "./js/pages/contact.js", "./js/pages/admin.js", "./js/pages/static-page.js", "./js/pages/offline.js",
  "./pages/destinations.html", "./pages/map.html", "./pages/destination-details.html", "./pages/bookings.html",
  "./pages/login.html", "./pages/signup.html", "./pages/profile.html", "./pages/profile-settings.html", "./pages/saved.html",
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

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.port === "3000") return;
  if (url.hostname === "tile.openstreetmap.org" || url.hostname.endsWith(".tile.openstreetmap.org")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(event.request, url.origin === self.location.origin)
        .catch(async () => (await caches.match(event.request)) || caches.match("./offline.html"))
    );
    return;
  }

  if (url.origin === self.location.origin && ["style", "script"].includes(event.request.destination)) {
    event.respondWith(
      fetchAndCache(event.request, true).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetchAndCache(event.request, url.origin === self.location.origin);
    })
  );
});
