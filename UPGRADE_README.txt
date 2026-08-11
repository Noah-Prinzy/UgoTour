UgoTour Phase 1.14 — Contextual Markers + Live Navigation UX
============================================================

This is a cumulative overlay ZIP. Extract it over the existing UgoTour project
while working on the map-api-upgrade branch. It includes the earlier Phase 1.10–1.13
frontend/map work plus the Phase 1.14 navigation UX changes.

Phase 1.14 changes
------------------
1. Exactly one UgoTour search-clear (×) control. The search field is now a text
   searchbox so Chromium does not add a second native clear icon.
2. Calm default map: tourism markers are NOT shown globally. The map shows the
   user's location when permission is already granted or after My Location is used.
3. Specific-place search: selecting one result displays only that place marker.
4. General/area search: displays only results relevant to that area.
5. Nearby category filters: display only markers for the selected category/context.
6. Clearing search removes tourism markers and returns to the user's location when
   available.
7. Selected marker is enlarged/pulsed and always kept above other result pins.
8. Marker-to-information-card connector now uses a high-contrast two-pass curve with
   anchored endpoints, making the selected place much easier to follow visually.
9. Directions responses now include maneuver steps from openrouteservice or OSRM.
10. New Start navigation mode uses geolocation.watchPosition for live GPS updates,
    next-maneuver guidance, remaining distance/time, route progress and up to three
    upcoming steps.
11. Optional browser speech synthesis provides spoken navigation instructions.
12. Off-route detection can request a fresh route after sustained deviation.
13. Navigation mode hides unrelated tourism markers and keeps only the user's live
    location, destination marker and route.

Routing providers
-----------------
OPENROUTESERVICE_API_KEY remains recommended for production-grade driving, walking
and cycling routes. Without it, the app uses the public OSRM demo road router as a
prototype fallback. OSRM fallback turn steps are real road maneuvers for driving;
walking/cycling timing remains estimated until openrouteservice is configured.

Testing
-------
1. Restart the Node backend after extraction.
2. Hard-refresh / clear the old service worker cache once.
3. Map default: confirm no tourism pins are shown.
4. Use My Location: confirm the blue location marker appears.
5. Search a specific place and select it: only that place marker should remain.
6. Search Kampala as an area: relevant results should appear as map markers and the
   suggestion panel should close.
7. Test Attractions / Hotels / Food / Fuel / Health.
8. Select a place -> Directions -> Start navigation. On a real phone, grant precise
   location permission and keep the PWA/browser open while testing live guidance.

PWA cache: ugotour-v1-10-0
Responsive UI stylesheet: mobile-phase1.css?v=10.9.0
