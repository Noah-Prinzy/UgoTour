# UgoTour

UgoTour is a JavaScript-first Uganda tourism **Progressive Web App (PWA)** for desktop and mobile browsers.

## Phase 8.5 highlights

- Home fullscreen hero, one-gesture Hero ↔ Search handoff and three-card destination queue remain intact
- Home **More to Discover** now shows only three featured destination cards; **View all destinations** opens the full catalog
- Destinations, Bookings, Profile, Login and Sign Up now open with wide photographic heroes that match the Home visual language
- Destination Details now uses its dynamic destination image/gallery as a full-bleed top hero
- Profile hero mirrors the logged-in user's profile picture, name and email while preserving the existing upload/edit flow
- Existing PostgreSQL data, authentication, bookings, destination galleries and REST API behavior are preserved
- Shared responsive typography, cream surfaces, forest tones, floating navigation and mobile bottom navigation now feel consistent across the app
- PWA cache advanced to Phase 8.5
- One cumulative guide remains at `docs/PROJECT_PROGRESS.md`

## Images

From the project root, download/verify the selected high-resolution destination galleries:

```powershell
npm run assets:download
npm run assets:verify
```

## Database

Phase 8.5 adds **no new migration**. If migrations 004 and 005 are already applied, no database command is required for this UI sub-phase.

## Run

```powershell
cd backend
npm run check
npm run db:test
npm start
```

Then open `frontend/index.html` using VS Code Live Server. If the PWA was already open, use a hard refresh once (`Ctrl + Shift + R`) so the new Phase 8.5 service-worker cache takes over.
