UgoTour Phase 1.17 — Dense Catalogue + Home-Reference Pages

Overlay this package on the existing UgoTour project while working on the map-api-upgrade branch.

Changes:
- Destinations uses the Home visual language for its full-screen background and shared navigation treatment, while keeping destination search/filter/catalogue functionality.
- Destinations background is constant instead of parallax-driven; the text sits directly on the image with no hero-card border.
- Destination cards use a controlled-random 7/5 and 4/4/4 layout pattern with CSS grid dense packing, eliminating dead grey gaps. Tablet becomes a stable two-column layout and phones a single-column feed.
- The Map startup/provider setup hint is no longer shown to users. Action/error feedback still appears when relevant.
- Saved and Bookings now use the same immersive background + Home-style navigation treatment, with angular responsive cards.
- Home and Profile remain intentionally outside this redesign.

PWA cache: ugotour-v1-13-0
Responsive UI stylesheet revision: mobile-phase1.css?v=11.2.0

After overlaying: restart the backend if it is running, then hard-refresh/clear the old service-worker cache once.


PHASE 1.18
-----------
- Removes the final legacy rounded/photo hero layer from Destinations.
- Discover Uganda heading/count now sit directly over the one full-screen background.
- Destinations background: Lake Victoria at Munyonyo (Michael Shade, public domain).
- Saved background: Kalangala beach, Lake Victoria (Frederick Noronha, CC BY-SA 3.0).
- Bookings background: Bushenyi highland road (BalukuBrian, CC BY-SA 4.0).
- Background sources are new to this build and are loaded from Wikimedia Commons.
- PWA cache: ugotour-v1-14-0.
- mobile-phase1.css revision: 11.3.0.
