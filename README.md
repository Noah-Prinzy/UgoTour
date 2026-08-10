# UgoTour

UgoTour is a JavaScript-first Uganda tourism **Progressive Web App (PWA)** for desktop and mobile browsers.

## Phase 8.4 highlights

- One deliberate mouse-wheel, trackpad, touch-swipe or keyboard gesture triggers the complete fullscreen Hero -> Search transition
- No more pixel-by-pixel scroll-linked fading
- Hero image/UI fades and lifts while the Search/content surface rises and softly settles into place
- Reverse upward gesture plays the full transition back to the fullscreen hero
- Short post-transition momentum guard keeps trackpads from scrolling past the snapped Search section
- Exactly three complete upcoming destination cards remain synchronized with the fullscreen destination queue
- Existing background crossfades, destination galleries, profile pictures, bookings, authentication and PWA support retained
- PWA cache advanced to Phase 8.4
- One cumulative guide: `docs/PROJECT_PROGRESS.md`

## Images

From the project root, download/verify the selected high-resolution destination galleries:

```powershell
npm run assets:download
npm run assets:verify
```

## Database

Phase 8.4 adds no migration. If migrations 004 and 005 are already applied, no database command is required for this sub-phase.

## Run

```powershell
cd backend
npm run check
npm run db:test
npm start
```

Then open `frontend/index.html` using VS Code Live Server. If the PWA was already open, reload once so the new Phase 8.4 service-worker cache takes over.
