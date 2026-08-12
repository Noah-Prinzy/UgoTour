UgoTour Phase 1.24.2 — Seamless Responsive Auth Handoff
=======================================================

Apply this overlay AFTER Phase 1.24.1. Replace matching files.
No backend or database migration is required.

FIXES
-----
1. Login/Signup -> splash -> Home handoff
   - Splash no longer fades away while still on Login/Signup.
   - It remains fully opaque until window.location.replace() begins.
   - Removes the split-second Login-page flash between splash and Home.
   - Progress settles to 100% before navigation without exposing the old page.
   - 5 second redirect fail-safe remains in place.

2. Responsive splash/loading screen
   - 320px phones through ultra-wide desktop.
   - Android / iPhone safe-area insets.
   - Tablet scaling.
   - Landscape phones/tablets and short browser windows.
   - Background uses object-fit: cover with responsive focal positioning.
   - Logo, heading, tagline and progress bar use clamp()-based sizing.
   - Reduced-motion support retained.

3. PWA/cache
   - phase1-24.css query bumped to v=1.24.2.
   - cache version bumped to ugotour-v1-16-6.

FILES
-----
frontend/js/auth-home-transition.js
frontend/js/components/navbar.js
frontend/css/phase1-24.css
frontend/service-worker.js
UPGRADE_README.txt

After copying, use Ctrl + Shift + R once.
