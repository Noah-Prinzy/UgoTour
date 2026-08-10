# UgoTour

UgoTour is a JavaScript-first Uganda tourism **Progressive Web App (PWA)** for desktop and mobile browsers.

## Current highlights — Phase 8.9

- PostgreSQL tourism library with **19 major destinations + 41 attractions**
- Interactive Uganda tourism map with search, filters, marker clustering and synchronized result cards
- Dedicated `GET /api/map/locations` GeoJSON endpoint
- Destination and attraction deep links into the map
- `View on map` actions from Destination Details
- Responsive desktop map and mobile information-sheet treatment
- Existing authentication, profile pictures, bookings and destination galleries remain intact
- OpenStreetMap tiles remain network-driven and are not bulk/offline cached by the PWA
- One cumulative technical guide remains at `docs/PROJECT_PROGRESS.md`

## Images

From the project root, verify the local high-resolution tourism library:

```powershell
npm run assets:verify
```

If you need to re-fetch source images configured by the project:

```powershell
npm run assets:download
```

## Database

Phase 8.9 does not change the map schema, but the coordinate QA found and corrected one Phase 8.8 data point. If migration `006_phase8_8_tourism_library.sql` is already applied, run:

```powershell
cd backend
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\007_phase8_9_map_coordinate_correction.sql
```

Then verify the map-ready database:

```powershell
npm run map:verify
```

Expected library counts are 19 destinations, 41 attractions and 60 total map pins.

## Run

```powershell
cd backend
npm run check
npm run db:test
npm run map:verify
npm start
```

Keep the backend terminal running, then open `frontend/index.html` using VS Code Live Server. The authenticated navigation now includes **Map**.

If an older PWA version is already open, use a hard refresh once (`Ctrl + Shift + R`) so the `ugotour-phase8-9-v1` service-worker cache takes over.
