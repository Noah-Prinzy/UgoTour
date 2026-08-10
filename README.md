# UgoTour

UgoTour is a JavaScript-first tourism application for discovering destinations,
experiences and travel opportunities in Uganda.

## Technology architecture

### Frontend
- HTML for page structure
- CSS + Tailwind CSS for visual design
- Vanilla JavaScript for functionality
- `fetch()` for REST API communication

### Backend
- JavaScript
- Node.js built-in HTTP server
- custom REST routing/controllers/services/middleware

### Database
- PostgreSQL
- `pg` / node-postgres
- SQL

## Current status

Phases 1–7 are complete. The vanilla JavaScript frontend is now connected to the
Node.js REST API, and the API persists destinations, users, sessions, profiles
and bookings in PostgreSQL.

The browser no longer keeps duplicate destination/user/booking business data.
It stores only the bearer token needed for the current authenticated session.

## Phase 7 database migration

If your database already contains the Phase 6 schema, run this once from the
`backend` folder:

```powershell
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\003_add_destination_details.sql
```

## Running UgoTour locally

First start the backend from `UgoTour/backend`:

```powershell
npm install
npm run db:test
npm run check
npm start
```

Default backend URL:

```text
http://127.0.0.1:3000
```

Then serve `frontend/index.html` with VS Code Live Server. Keep the Node.js
backend running while using the frontend because the browser now loads its data
through the REST API.

## Documentation

All project architecture, completed phases, database setup and future progress
are maintained in one cumulative document:

```text
docs/PROJECT_PROGRESS.md
```
