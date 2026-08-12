UgoTour Phase 1.22 — Map Interaction + Result Card Polish
========================================================

Apply this overlay after the Phase 1.20 / 1.21 upgrades.
No database migration is required.

What changed
------------
1. Destination search-result cards
   - Reserves a dedicated top-right hit area for the Save heart.
   - Region labels no longer run underneath the heart on phone/tablet/desktop.

2. Map current-location control
   - The existing working My Location button is moved out of the search field.
   - It is now placed directly above the Leaflet +/- zoom controls in the
     bottom-right control stack.
   - Existing geolocation behavior and state are preserved.

3. Live map search suggestions
   - Existing UgoTour place matches remain visible directly below the search
     field while typing.
   - The dropdown is now height-limited, scrollable and touch-friendly.
   - Partial intent phrases such as "hot...", "foo...", "fuel..." and
     "hos..." also surface a quick nearby-command suggestion.

4. Map callout/card
   - Desktop/tablet callout uses a stable bottom-left decision rail instead of
     jumping around the selected marker.
   - Phone callout becomes image-over-copy so the photo never crushes text.
   - Phone card is lifted above the location/zoom controls.
   - Long names/descriptions wrap safely at unusual viewport widths.

5. Marker connector
   - Connector now measures the actual active Leaflet marker and the nearest
     callout edge.
   - A requestAnimationFrame interpolation pass keeps the line visually smooth
     while panning/zooming and while the card/image changes size.
   - Connector SVG never intercepts map pointer events.

6. Map movement
   - Mouse drag, touch drag, Leaflet zoom and direct map interaction remain
     unobstructed while a selected-place card is visible.

Shared stylesheet order
-----------------------
- navbar.js loads Phase 1.22 after the existing mobile/Phase 1.19-1.21 layers,
  ensuring these targeted fixes win the cascade without broad !important hacks.

PWA cache
---------
Cache version: ugotour-v1-16-2

After replacing the files, use Ctrl + Shift + R once in the browser.
