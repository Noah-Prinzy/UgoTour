UgoTour Phase 1.12 — Professional Map + Functional Discovery Repair
===================================================================

This is a cumulative drop-in upgrade built on Phase 1.11 / Phase 1.10.
Recommended Git branch: map-api-upgrade

WHAT THIS REPAIRS
-----------------
1. Professional map presentation
   - Cleaner cream search surface + dark discovery toolbar.
   - Simplified country-scale map: destinations show first; attraction markers
     reveal as the user zooms into an area or performs a discovery search.
   - Removed the visually distracting simplified Uganda boundary overlay.
   - Crisp Leaflet tiles/labels remain unfiltered and unblurred.
   - Cleaner markers, zoom controls, status messages and route summary.

2. Destination-page attraction card readability
   - Attraction/site cards now use a high-contrast cream information surface.
   - Names, descriptions, location labels and "Find on map" are readable.
   - Save-heart placement/functionality is preserved.

3. Map place information panel
   - The callout height is content-driven.
   - No forced inner scrolling and no description line clamp.
   - Short information creates a smaller panel; longer content expands the panel.
   - Responsive desktop/tablet/phone sizing is preserved.

4. Navbar active-page readability
   - Desktop active page now uses a light pill with dark text.
   - Desktop nav links now include aria-current="page" for the selected page.

5. Functional discovery toolbar
   - My location requests browser GPS and makes that the discovery context.
   - After a general area search such as "Kampala", Attractions / Hotels / Food /
     Fuel / Health search around Kampala rather than forcing GPS.
   - With no searched area, nearby buttons use the user's current location.
   - Active button/context state is visible and accessible.

6. Directions repair
   - GET /api/map/route was added as the preferred idempotent route endpoint.
   - Existing Phase 1.11 POST /api/map/route remains supported.
   - Frontend first uses GET and falls back to POST for Phase 1.11 compatibility.
   - openrouteservice remains the preferred provider when a key is configured.
   - Without ORS, the prototype tries an OSRM road-geometry fallback.
   - If all external routing providers are unavailable, UgoTour returns a clearly
     labelled direct-distance estimate rather than leaving Directions dead.
   - Route summary displays distance, ETA and whether the route is approximate.

IMPORTANT: RESTART THE BACKEND
------------------------------
After extracting this ZIP, stop the currently running Node backend and start it
again so router.js and the new map endpoints are actually loaded:

  Ctrl+C
  npm run start:backend

If an older Node process is still running on port 3000, the browser can return
"Route not found" even though the files on disk have already been updated.

MAP / ROUTING ENVIRONMENT
-------------------------
Preferred production routing:
  OPENROUTESERVICE_API_KEY=<your key>

Optional provider configuration:
  ORS_BASE_URL=https://api.openrouteservice.org
  OSRM_BASE_URL=https://router.project-osrm.org
  NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
  OVERPASS_API_URL=https://overpass-api.de/api/interpreter
  MAP_DISCOVERY_CACHE_TTL_MS=900000

The public OSRM endpoint is a prototype fallback, not a guaranteed production
service. For production, configure openrouteservice or another managed/self-
hosted routing provider.

SEARCH / NEARBY BEHAVIOUR
-------------------------
Example:
  Search Kampala -> Enter
  -> UgoTour geocodes Kampala and discovers tourism sites
  -> context becomes "Explore near Kampala"
  -> Hotels searches hotels around Kampala
  -> Food searches food around Kampala
  -> Attractions searches attractions around Kampala

Tap My location to switch the context back to the user's GPS position.

PWA CACHE
---------
ugotour-v1-8-0
mobile-phase1.css revision: 10.7.0

TEST ORDER
----------
1. Extract over the UgoTour project while on map-api-upgrade.
2. Restart npm run start:backend.
3. Hard refresh / clear the old PWA cache once.
4. Open Destinations and confirm attraction text is readable.
5. Open Map and confirm the active Map navbar item is readable.
6. Search Kampala and press Enter.
7. Tap Attractions / Hotels / Food / Fuel / Health and confirm each searches the
   Kampala context.
8. Tap My location, allow permission and confirm the blue location marker.
9. Select a place -> Directions and allow location if requested.
10. Confirm route line + distance + ETA; switch Drive / Walk / Cycle.
11. Test desktop, tablet and phone sizes.

PHASE 1.13 — Unified Map Command Panel
- Search, nearby actions and transient status messages now share one floating map command panel.
- Removes the stacked-toolbar overlap seen above selected place cards.
- Existing search, GPS, nearby category and routing IDs/listeners remain unchanged.
- Desktop/tablet use a compact two/three-row glass panel; phone actions remain horizontally scrollable.
- Search suggestions still open independently below the search row.
- PWA cache: ugotour-v1-9-0
- mobile-phase1.css revision: 10.8.0
