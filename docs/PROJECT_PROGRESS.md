# UgoTour — Project Progress and Technical Guide

This is the single cumulative documentation file for UgoTour. From this point
forward, new phases should update this file instead of creating a separate
Markdown file for every phase.

---

## 1. Project purpose

UgoTour is a JavaScript-first tourism application for exploring destinations,
experiences and travel opportunities in Uganda.

The project intentionally keeps application functionality close to plain
JavaScript so the underlying web concepts remain visible and understandable.
Frameworks/libraries are used mainly where they provide practical design or
infrastructure support rather than hiding application logic.

---

## 2. Current architecture

```text
UgoTour
│
├── Frontend
│   ├── HTML                  -> page structure
│   ├── CSS + Tailwind CSS    -> design and responsiveness
│   └── Vanilla JavaScript    -> application functionality
│
├── Backend
│   ├── JavaScript
│   ├── Node.js built-in HTTP server
│   ├── custom REST router
│   ├── controllers
│   ├── services
│   └── middleware
│
└── Database
    ├── pg / node-postgres
    ├── SQL
    └── PostgreSQL
```

The current backend request flow is:

```text
Browser / API client
        ↓ HTTP
Node.js server
        ↓
router.js
        ↓
controller
        ↓
service
        ↓
database.query()
        ↓
pg
        ↓
PostgreSQL
```

No Express, NestJS, Prisma, React, Vue or Angular is responsible for the core
application functionality.

---

## 3. Main folder structure

```text
UgoTour/
│
├── frontend/
│   ├── index.html
│   ├── pages/
│   ├── css/
│   ├── js/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── assets/
│
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── router.js
│       ├── controllers/
│       ├── middleware/
│       ├── services/
│       ├── database/
│       └── utils/
│
├── database/
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
│
├── docs/
│   └── PROJECT_PROGRESS.md
│
├── README.md
└── package.json
```

---

## 4. Phase 1 — Frontend foundation and Home search

Completed work:

- Created the reusable frontend folder structure.
- Built the UgoTour Home page.
- Added reusable JavaScript navbar, footer and destination-card components.
- Added starter destination data through a JavaScript service.
- Added a JavaScript-powered destination search field.
- Added search by destination name and category.
- Added Enter-key search support.
- Added result messages and reusable destination rendering.
- Kept UI structure in HTML, styling in CSS/Tailwind, and behavior in vanilla JavaScript.

Important JavaScript concepts introduced:

- ES modules (`import` / `export`)
- DOM selection
- DOM creation and manipulation
- event listeners
- arrays
- `.forEach()`
- `.filter()`
- `.includes()`
- reusable functions

---

## 5. Phase 2 — Destinations catalog

Completed work:

- Expanded the destination catalog.
- Rebuilt the Destinations page into a JavaScript-driven catalog.
- Added live text search.
- Added dynamic category filters.
- Added result counting.
- Added an empty-search state.
- Added reset-filter functionality.
- Added richer reusable destination cards.
- Added a destination details dialog.
- Added basic application state for search term and selected category.

Important JavaScript concepts introduced:

- `.map()`
- `Set`
- `.find()`
- application state objects
- combined filtering
- dynamic UI generation

---

## 6. Phase 3 — Destination details and booking flow

Completed work:

- Added one reusable `destination-details.html` page.
- Used URL parameters such as `destination-details.html?id=3` to determine which destination to load.
- Added destination-specific information and booking UI.
- Added JavaScript booking-form validation.
- Added temporary booking persistence with browser `localStorage`.
- Added a Bookings page.
- Added booking display and cancellation.

Important JavaScript concepts introduced:

- `URLSearchParams`
- `FormData`
- localStorage
- JavaScript objects
- date values
- dynamic page rendering

At this phase, booking persistence was still frontend-only and temporary.

---

## 7. Phase 4 — Frontend authentication and profile

Completed work:

- Rebuilt Sign Up, Login and Profile pages.
- Added frontend account creation.
- Added duplicate-email checking.
- Added login and logout.
- Added a temporary local user session.
- Added session-aware navbar rendering.
- Added profile editing.
- Added password-changing functionality.
- Used the browser Web Crypto API to avoid storing raw passwords in localStorage.

Important JavaScript concepts introduced:

- `async` / `await`
- Web Crypto API
- `.some()`
- `.find()`
- `.map()`
- conditional rendering
- session-like state

This frontend authentication system remains useful for learning, but the real
backend authentication introduced later replaces it as the production path.

---

## 8. Phase 5 — Node.js REST API backend

Completed work:

- Replaced the backend placeholder with a real Node.js server.
- Used Node's built-in `http` module instead of Express/NestJS.
- Created a custom JavaScript REST router.
- Added controller, service, middleware and utility layers.
- Added JSON request/response helpers.
- Added CORS support.
- Added backend password hashing using Node's built-in `scrypt`.
- Added bearer-token authentication.
- Added temporary server-side users, bookings and sessions in memory.

REST endpoints introduced:

```text
GET    /health

GET    /api/destinations
GET    /api/destinations/:id

POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/profile
PATCH  /api/profile
PATCH  /api/profile/password

GET    /api/bookings
POST   /api/bookings
DELETE /api/bookings/:id
```

The Phase 5 backend was fully functional but memory-based, meaning a server
restart erased users, sessions and bookings.

---

## 9. Phase 6 — PostgreSQL integration and database-backed REST API

### 9.1 PostgreSQL environment

Local development database:

```text
PostgreSQL: 18.4
Database:   ugotour_db
User:       ugotour_user
Port:       5432
```

The Node.js PostgreSQL driver is:

```text
pg / node-postgres
```

It is deliberately used instead of Prisma so SQL and database behavior remain
visible in the code.

### 9.2 Core tables

The database contains:

```text
users
├── id
├── name
├── email
├── password_hash
├── created_at
└── updated_at

destinations
├── id
├── name
├── category
├── region
├── description
├── highlight
├── activities
├── best_for
├── suggested_days
├── travel_tip
└── created_at

bookings
├── id
├── user_id
├── destination_id
├── travel_date
├── travellers
└── created_at

sessions
├── id
├── token
├── user_id
└── created_at
```

Foreign-key relationships:

```text
users.id ───────────────┐
                        ├── bookings.user_id
                        └── sessions.user_id

destinations.id ────────── bookings.destination_id
```

### 9.3 Seed data

Nine Uganda destinations are seeded into PostgreSQL:

1. Murchison Falls
2. Bwindi Impenetrable National Park
3. Jinja
4. Queen Elizabeth National Park
5. Kidepo Valley National Park
6. Lake Bunyonyi
7. Sipi Falls
8. Kampala
9. Rwenzori Mountains

### 9.4 Node.js PostgreSQL connection

`backend/src/database/connection.js` creates a reusable `pg.Pool`.

The connection defaults to the local UgoTour database but supports environment
variable overrides:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

The connection can be tested from the backend folder with:

```powershell
npm run db:test
```

A successful test retrieves all nine destinations from PostgreSQL.

### 9.5 Database-backed services

Phase 6 completion removes the Phase 5 in-memory stores from the live backend
path.

The following services now use SQL through `database.query()`:

```text
destination-service.js
    ↓
SELECT destinations from PostgreSQL

auth-service.js
    ↓
INSERT/SELECT users
INSERT/DELETE sessions

user-service.js
    ↓
UPDATE profile/password in users

booking-service.js
    ↓
INSERT/SELECT/DELETE bookings
```

As a result:

- destination API data comes from PostgreSQL;
- accounts persist after server restarts;
- login sessions persist after server restarts;
- profile changes persist;
- password changes persist;
- bookings persist;
- deleted bookings stay deleted.

### 9.6 Authentication flow

```text
POST /api/auth/login
        ↓
users table
        ↓
verify scrypt password hash
        ↓
create random token
        ↓
sessions table
        ↓
Bearer token returned
```

Protected requests send:

```text
Authorization: Bearer <token>
```

`middleware/auth.js` joins `sessions` and `users` to identify the authenticated
user.

### 9.7 Booking flow

```text
POST /api/bookings
        ↓
verify bearer session
        ↓
verify destination exists
        ↓
INSERT into bookings
        ↓
return booking + destination name
```

Listing bookings performs a SQL JOIN between `bookings` and `destinations`.

### 9.8 Health check

`GET /health` now performs a PostgreSQL query as part of the health check.
A successful response reports:

```json
{
  "status": "ok",
  "message": "UgoTour API is running",
  "phase": 6,
  "database": "connected"
}
```

---

## 10. Database setup files

The `database/` folder makes the database reproducible instead of depending on
manual commands only.

```text
database/
├── schema.sql
├── migrations/
│   ├── 001_create_core_tables.sql
│   ├── 002_add_lookup_indexes.sql
│   └── 003_add_destination_details.sql
└── seeds/
    └── 001_destinations.sql
```

`schema.sql` now represents the complete schema through Phase 7.

Migration `001` creates the four core tables.

Migration `002` adds indexes used for authenticated-session and booking lookups.

Migration `003` moves the richer destination-details fields that originally
lived only in frontend JavaScript into PostgreSQL:

```text
activities
best_for
suggested_days
travel_tip
```

The seed script includes all nine destinations and their richer details for a
fresh database.

---

## 11. Phase 7 — Frontend ↔ Backend integration

Phase 7 completes the main application data flow:

```text
HTML/CSS interface
        ↓
Vanilla JavaScript
        ↓ fetch()
Node.js REST API
        ↓
controllers/services
        ↓ database.query()
pg / node-postgres
        ↓
PostgreSQL
```

### 11.1 Central API client

`frontend/js/api.js` is now the common API client.

It handles:

- the API base URL (`http://127.0.0.1:3000/api`);
- `fetch()` requests;
- JSON request/response conversion;
- HTTP error handling;
- authenticated `Authorization: Bearer <token>` headers;
- saving/removing the current bearer token.

Only the bearer token remains in browser `localStorage`. Destination records,
users, profiles and bookings are no longer duplicated there.

### 11.2 Destination integration

The frontend destination service now calls:

```text
GET /api/destinations
GET /api/destinations/:id
```

The Home page, Destinations catalog and Destination Details page all use API
data from PostgreSQL.

Search and category filtering are still performed with visible vanilla
JavaScript methods such as `.filter()`, `.includes()` and `Set` after the API
data arrives.

### 11.3 Signup and login integration

Signup now uses:

```text
POST /api/auth/signup
```

The backend:

1. validates the request;
2. hashes the password using Node.js `scrypt`;
3. inserts the user into PostgreSQL;
4. creates a session row;
5. returns a bearer token.

Login uses:

```text
POST /api/auth/login
```

The frontend saves only the returned token. Passwords and password hashes are
never stored in frontend localStorage.

Logout uses:

```text
POST /api/auth/logout
```

and removes the corresponding backend session plus the local bearer token.

### 11.4 Session-aware navbar

`renderNavbar()` is now asynchronous because it checks the real backend session
through:

```text
GET /api/profile
```

Logged-in users see their first name and Logout. Logged-out users see Login and
Sign up.

### 11.5 Profile integration

The Profile page now uses:

```text
GET   /api/profile
PATCH /api/profile
PATCH /api/profile/password
```

Profile name/email edits and password changes are therefore persisted in
PostgreSQL.

### 11.6 Booking integration

The Destination Details booking form now requires a valid logged-in session.
The logged-in name and email are loaded from the backend profile and shown in
the form.

Booking creation uses:

```text
POST /api/bookings
```

The frontend sends:

```json
{
  "destinationId": 3,
  "travelDate": "2026-08-20",
  "travellers": 2
}
```

The backend identifies the user from the bearer token instead of trusting a
user ID supplied by the browser.

The Bookings page uses:

```text
GET    /api/bookings
DELETE /api/bookings/:id
```

Booking cards now show destination name, category, region, travel date,
traveller count and status using database-backed API responses.

### 11.7 Loading and error states

Frontend pages now show useful messages when:

- destinations are loading;
- the API cannot be reached;
- authentication is required;
- a booking is being saved/cancelled;
- a REST request fails.

This keeps network behavior visible instead of hiding it behind a framework.

---

## 12. Running the current application

### 12.1 Apply the Phase 7 migration once

For an existing Phase 6 local database, from `UgoTour/backend` run:

```powershell
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\003_add_destination_details.sql
```

Expected output includes one `ALTER TABLE` followed by destination `UPDATE`
results.

### 12.2 Start the backend

From:

```text
UgoTour/backend
```

run:

```powershell
npm install
npm run db:test
npm run check
npm start
```

Default backend address:

```text
http://127.0.0.1:3000
```

Health check:

```text
http://127.0.0.1:3000/health
```

A healthy Phase 7 response reports:

```json
{
  "status": "ok",
  "message": "UgoTour API is running",
  "phase": 7,
  "database": "connected"
}
```

### 12.3 Start the frontend

Use VS Code Live Server to serve:

```text
frontend/index.html
```

Keep `npm start` running in the backend terminal while browsing the frontend.
The frontend is now dependent on the API for its application data.

---

## 13. Current persistence and integration status

```text
Destinations          -> PostgreSQL ✅
Destination details   -> PostgreSQL ✅
Users                 -> PostgreSQL ✅
Password hashes       -> PostgreSQL ✅
Sessions              -> PostgreSQL ✅
Profile changes       -> PostgreSQL ✅
Bookings              -> PostgreSQL ✅
Frontend API calls    -> fetch() ✅
Bearer authentication -> API headers ✅
```

Current browser-local data:

```text
ugotour_auth_token -> bearer token only
```

The earlier frontend-only user arrays, destination arrays and booking
localStorage records are no longer the live application path.

---

## 14. Next phase — Phase 8

The main application architecture is now connected end-to-end. Phase 8 can
focus on production readiness and presentation rather than replacing another
major data layer.

Likely Phase 8 work:

- final UI/UX polish and real destination imagery;
- accessibility review;
- responsive/device testing;
- frontend/backend integration testing;
- move development database credentials fully into environment configuration;
- production CORS configuration;
- deployment configuration;
- deployment of frontend, Node.js backend and PostgreSQL;
- final documentation cleanup and demonstration checklist.

---

## 15. Documentation rule going forward

Do not create separate `PHASE_X_*.md` documents.

All future architecture changes, completed features, setup steps and phase notes
must be appended to or updated inside:

```text
docs/PROJECT_PROGRESS.md
```

This keeps UgoTour documentation in one continuously maintained source.
