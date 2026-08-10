# UgoTour

UgoTour is a JavaScript-first Uganda tourism **Progressive Web App (PWA)** for desktop and mobile browsers.

## Phase 8.3 highlights

- Scroll-linked fullscreen Hero -> Search dissolve
- Direction-aware soft snap between Hero and Search resting positions
- Exactly three complete upcoming destination cards at all times
- Circular queue across all nine PostgreSQL destinations
- First card leaves when it becomes the new fullscreen hero
- Remaining cards shift forward and a new destination enters slot three
- Background crossfade, copy animation and queue movement stay synchronized
- Existing high-resolution destination galleries, profile pictures, bookings, authentication and PWA support retained
- PWA cache advanced to Phase 8.3
- One cumulative guide: `docs/PROJECT_PROGRESS.md`

## Images

From the project root, download/verify the selected high-resolution destination galleries:

```powershell
npm run assets:download
npm run assets:verify
```

## Database

Phase 8.3 adds no migration. If migrations 004 and 005 are already applied, no database command is required for this sub-phase.

## Run

```powershell
cd backend
npm run check
npm run db:test
npm start
```

Then open `frontend/index.html` using VS Code Live Server. If the PWA was already open, reload once so the new Phase 8.3 service-worker cache takes over.
