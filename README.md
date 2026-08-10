# UgoTour

UgoTour is a JavaScript-first Uganda tourism **Progressive Web App (PWA)**. It is responsive, so the same project works in desktop and mobile browsers, and supported browsers can install it like an app when it is served from localhost or HTTPS.

## Stack

- HTML
- CSS + Tailwind as a visual helper
- Vanilla JavaScript for frontend functionality and motion
- Node.js built-in HTTP server
- REST API
- `pg` / node-postgres
- PostgreSQL

## Phase 8.2 highlights

- Phase 8 visual system retained, with a new motion/layout sub-phase based on the supplied travel-carousel video
- Cinematic Home destination slider with card-to-background morph transitions
- Autoplay, progress line, circular navigation controls, active-card lift and content transitions
- Shared staged reveal motion across Destinations, Bookings, Login, Sign Up, Profile and Destination Details
- Exact-location multi-image galleries for all nine PostgreSQL destinations
- 32 curated Unsplash photo sources mapped to local paths under `frontend/images/destinations/`
- Destination cards use a second gallery image on hover/focus instead of repeating one static image
- Destination Details has an animated thumbnail gallery
- Strict image quality verification after download: successful 32/32 manifest + minimum 1400×800
- Profile picture upload/persistence and PWA support remain from Phase 8
- One cumulative guide: `docs/PROJECT_PROGRESS.md`

## 1. Download the final high-resolution destination galleries

The ZIP keeps compatibility placeholders so paths never break, but **do not treat those placeholders as the final photography**. From the project root on your internet-connected PC run:

```powershell
npm run assets:download
npm run assets:verify
```

The downloader requests 2400px-class Unsplash files and writes them directly into:

```text
frontend/images/destinations/
```

Only continue once the downloader reports **32/32** and the verifier reports that all 32 images passed. Source pages and photo credits are recorded in `frontend/images/SOURCE_NOTES.txt`.

## 2. Upgrade the database

If migration 004 from the first Phase 8 build is already applied, you only need migration 005:

```powershell
cd backend
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\005_phase8_1_destination_galleries.sql
```

For a database that has not received the first Phase 8 migration yet, apply 004 before 005:

```powershell
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\004_phase8_visuals_and_profile_photo.sql
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\005_phase8_1_destination_galleries.sql
```

Then:

```powershell
npm run check
npm run db:test
npm start
```

## 3. Run the frontend

Open `frontend/index.html` with VS Code Live Server during local development. Keep the backend terminal running.

For the complete architecture, phase history, API details, PWA notes, motion design and image-source information, see `docs/PROJECT_PROGRESS.md`.
