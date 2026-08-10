# UgoTour

UgoTour is a JavaScript-first Uganda tourism **Progressive Web App (PWA)**. It is responsive, so the same project works in desktop and mobile browsers, and supported browsers can install it like an app when it is served from localhost or HTTPS.

## Stack

- HTML
- CSS + Tailwind as a visual helper
- Vanilla JavaScript for frontend functionality
- Node.js built-in HTTP server
- REST API
- `pg` / node-postgres
- PostgreSQL

## Phase 8 highlights

- Forest-green / cream travel UI inspired by the supplied mobile design references
- Manrope typography
- Responsive desktop navigation and mobile bottom navigation
- Local destination photography in `frontend/images/`
- Image source downloader for selected Unsplash and Pinterest sources
- PostgreSQL-backed destinations, users, sessions and bookings
- Profile picture upload, resize, preview, remove and persistence
- PWA manifest, service worker, icons and install support
- One cumulative guide: `docs/PROJECT_PROGRESS.md`

## 1. Download the selected destination images

The ZIP includes local fallback images so the interface works immediately. To replace those fallbacks with the selected web-source photos on your internet-connected PC, run from the project root:

```powershell
npm run assets:download
```

The files are saved directly into:

```text
frontend/images/
```

Image source pages and attribution notes are in `frontend/images/SOURCE_NOTES.txt`.

## 2. Upgrade an existing Phase 7 database

From `backend` run:

```powershell
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\004_phase8_visuals_and_profile_photo.sql
```

Then:

```powershell
npm run check
npm run db:test
npm start
```

## 3. Run the frontend

Open `frontend/index.html` with VS Code Live Server during local development. Keep the backend terminal running.

For the complete architecture, phase history, API details, PWA notes and image-source information, see `docs/PROJECT_PROGRESS.md`.
