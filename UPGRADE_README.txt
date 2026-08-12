UgoTour Phase 1.24 — Cinematic Loading + 4-Column Results Gallery
=================================================================

Apply this ZIP OVER the current Phase 1.23 project (which should already include
Phases 1.20–1.22). Replace matching files.

WHAT CHANGED
------------
1. Authentication -> Home loading screen
   - Uses the existing Murchison Falls Home hero photograph as a full-screen
     loading background (no new external image dependency).
   - Photo fades/settles into place while the branded UgoTour content enters.
   - Progress is a smooth one-pass fill rather than a repeating scanner.
   - Successful Login/Sign Up handoff is slightly longer and fades out more
     gently so it reads as a transition rather than a flash.
   - Reduced-motion users still get a stable, immediate presentation.

2. Destinations searched/filtered results
   - Wide desktop: 4 equal compact cards per row; results wrap into more rows.
   - Tablet: 2 cards per row.
   - Phone: 1 card per row.
   - Cards use image-on-top + information-below instead of very wide/shallow rows.
   - Destination and attraction cards share the same visual rhythm.
   - Images use object-fit: cover and controlled aspect ratios.
   - Titles allow 2 lines; descriptions allow 3 lines; CTA/footer remains visible.
   - Save hearts retain a dedicated top-right lane and do not cover region text.
   - Default unfiltered Destinations carousel is NOT changed.

3. PWA
   - Cache version: ugotour-v1-16-4
   - Adds phase1-24.css to the app shell.

FILES IN THIS OVERLAY
---------------------
frontend/css/phase1-24.css
frontend/js/auth-home-transition.js
frontend/js/components/navbar.js
frontend/service-worker.js
UPGRADE_README.txt

NO backend or database files are changed.

AFTER COPYING
-------------
Use Ctrl + Shift + R once. If a previously installed PWA remains stale, close
and reopen it after the refreshed browser page has activated the new service
worker.
