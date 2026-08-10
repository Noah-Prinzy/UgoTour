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
│   ├── images/              -> local destination/profile-ready image assets
│   └── assets/icons/        -> PWA icons
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

## 12. Phase 8 — Visual redesign, profile pictures, local images and PWA support

Completed work:

- Reworked the complete frontend around a deep forest-green / warm cream tourism design system inspired by the two mobile travel references supplied for this phase.
- Changed the main typeface to **Manrope** for a modern travel/editorial feel.
- Added large photographic heroes, image-led destination cards, refined search/filter controls, modern booking cards and an immersive destination-details layout.
- Added desktop navigation plus a compact mobile bottom navigation bar so the same project adapts to PC and phone layouts.
- Added a dedicated **`frontend/images/`** folder and changed the UI to load destination photography from local project files rather than hotlinking image URLs during normal use.
- Added `image_url`, `photo_credit` and `photo_source_url` fields to PostgreSQL through migration `004_phase8_visuals_and_profile_photo.sql`. The database stores local relative image paths plus source/credit metadata.
- Added `scripts/download-images.js` and the root command **`npm run assets:download`**. On a normal internet-connected development machine, this downloads the selected source photos into `frontend/images/`, replacing the bundled fallback files while keeping the same filenames used by the app.
- The selected source set uses eight Unsplash photographs and one Pinterest/Viator Jinja pin requested for this phase. Source pages and credits are documented in `frontend/images/SOURCE_NOTES.txt`.
- Added a real profile-picture workflow: choose an image, resize/compress it in vanilla JavaScript, preview it, save/remove it through the REST API, and persist it in the `users.profile_image` column.
- Added `profileImage` to authenticated user responses so the navbar and profile page can display the saved avatar.
- Added a Web App Manifest, service worker, install prompt support, theme colors and PWA icons.
- UgoTour is now a **responsive Progressive Web App (PWA)**: it still works as a normal website in a browser and can also be installed on supported mobile/desktop browsers when served from HTTPS or localhost.
- Core application behavior remains vanilla JavaScript. Tailwind remains only a visual helper; the Phase 8 design relies primarily on the project's own CSS.

### 12.1 Local image workflow

Normal application rendering uses local paths such as:

```text
frontend/images/murchison-falls.jpg
frontend/images/bwindi.jpg
frontend/images/jinja-pinterest.jpg
frontend/images/queen-elizabeth.jpg
frontend/images/kidepo.jpg
frontend/images/lake-bunyonyi.jpg
frontend/images/sipi-falls.jpg
frontend/images/kampala.jpg
frontend/images/rwenzori.jpg
```

The Phase 8 ZIP contains working local fallback images so the interface does not break without internet access. The build environment used to prepare the ZIP cannot fetch the third-party image binaries directly, so the project includes a downloader that performs that final replacement on the developer's own internet-connected machine:

```powershell
cd "C:\Users\Noah\Desktop\JavaScript Projects\UgoTour"
npm run assets:download
```

The script downloads into **`frontend/images/`** and leaves the bundled fallback in place if any individual web download fails.

### 12.2 Selected source-image pages

Unsplash selections:

- Murchison Falls — Ivan Sabayuki — `https://unsplash.com/photos/a-river-with-a-waterfall-8WZRp0H75ao`
- Bwindi Impenetrable National Park — Nathalie Lays — `https://unsplash.com/photos/a-gorilla-standing-in-the-middle-of-a-forest-Lb65e5jMBMo`
- Queen Elizabeth National Park — Simone Dinoia — `https://unsplash.com/photos/an-elephant-walks-across-the-african-savanna-ewBGsxuMv3Y`
- Kidepo Valley National Park — CLINTON MWEBAZE — `https://unsplash.com/photos/a-herd-of-zebra-standing-on-top-of-a-grass-covered-field-1ejHmmazdjI`
- Lake Bunyonyi — Wietse Jongsma — `https://unsplash.com/photos/a-scenic-view-of-a-lake-surrounded-by-mountains-xd0k2HB4voA`
- Sipi Falls — Tony Samuel Gachie — `https://unsplash.com/photos/a-waterfall-in-the-middle-of-a-lush-green-forest-BnjZe8tQUXQ`
- Kampala — Robin Kutesa — `https://unsplash.com/photos/city-skyline-bathed-in-warm-sunset-light-Q3ymlvOJGFs`
- Rwenzori Mountains — Itote Rubombora — `https://unsplash.com/photos/green-trees-on-mountain-during-daytime-8PF8fl6e6yE`

Pinterest selection requested for this phase:

- Jinja / Source of the Nile — Pinterest pin linking to Viator imagery — `https://www.pinterest.com/pin/explore-the-source-of-the-nile-ssezibwa-falls-and-mabira-forest--424886546113650179/`

For a public/commercial release, Pinterest image rights should be checked with the original image owner because Pinterest is a discovery platform rather than the copyright owner of every pin. The Jinja image can be replaced later without changing application code because UgoTour references the stable local filename.

### 12.3 Profile-picture API addition

Phase 8 adds:

```text
PATCH /api/profile/photo
```

The browser validates and resizes JPEG/PNG/WebP input before sending the image. The backend stores the resulting profile image against the authenticated user and supports removing it again. This is suitable for the current learning/local prototype; a large public deployment would normally move user-uploaded binaries to dedicated file/object storage and keep only their URL in PostgreSQL.

### 12.4 Phase 8.1 — cinematic motion system and exact-location galleries

Phase 8.1 is a **sub-phase of Phase 8**. It keeps the Phase 8 color palette,
photographic direction, profile system and PWA work, but replaces the more
static presentation with a stronger motion/layout language based on the
supplied `inspiration.mp4` reference.

The video was studied for movement and composition rather than copied for its
colors or imagery. The patterns adapted into UgoTour are:

- a full-bleed cinematic background destination image;
- a small location/category kicker paired with an oversized destination title;
- a horizontal rail of portrait destination cards;
- an active card that lifts/scales above its neighbors;
- card-to-background continuity when a destination is selected;
- title, location and description text that fade/slide between destinations;
- a thin timed progress line for autoplay;
- previous/next circular controls and a numeric slide counter;
- subtle slow background movement for depth;
- staged entrance/reveal motion instead of every element appearing at once;
- motion that is disabled/simplified when `prefers-reduced-motion` is enabled.

The Home page now implements that language with vanilla JavaScript. Clicking a
destination card creates a temporary image layer at the card's position and
animates it outward until it fills the hero. The underlying hero image is then
already in place, making the selected card feel as though it became the next
scene. Autoplay advances approximately every 6.5 seconds and restarts the thin
progress indicator. Hover, focus and hidden-tab states pause the timer.

A shared `frontend/js/ui-motion.js` module now gives the remaining screens a
consistent motion grammar. It uses `IntersectionObserver` for staged reveals
and `MutationObserver` so cards created later from API results also animate.
Destinations, Destination Details, Bookings, Login, Sign Up and Profile keep
their own page layouts, but now enter with the same restrained reveal/slide
behavior instead of unrelated animations.

#### Multi-image destination photography

The old Phase 8 single-photo workflow is superseded by location-specific
**multi-image galleries**. The current curated set contains 32 image slots for
the nine PostgreSQL destinations:

```text
Murchison Falls                   4 images
Bwindi Impenetrable National Park 4 images
Jinja                             4 images
Queen Elizabeth National Park     4 images
Kidepo Valley National Park       4 images
Lake Bunyonyi                     3 images
Sipi Falls                        2 images
Kampala                           4 images
Rwenzori Mountains                3 images
                                  ---------
Total                            32 images
```

Current paths are grouped by destination, for example:

```text
frontend/images/destinations/murchison-falls/murchison-01.jpg
frontend/images/destinations/murchison-falls/murchison-02.jpg
frontend/images/destinations/bwindi/bwindi-01.jpg
frontend/images/destinations/jinja/jinja-01.jpg
...
```

Phase 8.1 uses Unsplash destination photography for the actual travel gallery
set. Pinterest remains a **UI/motion inspiration source only** in this
sub-phase; the travel photography uses dedicated source pages with clearer
location/credit metadata. Every selected page and photographer is recorded in
`frontend/images/SOURCE_NOTES.txt`.

The artifact ZIP contains compatibility placeholders at all expected paths so
there are no broken local image references when the project is copied. The
preparation environment cannot retrieve the final third-party image binaries,
so the developer must run the included downloader on an internet-connected
machine before judging final image sharpness. The downloader requests
2400px-class files and creates a completion manifest only when the curated set
has been fetched.

The quality gate is intentionally strict:

```powershell
npm run assets:download
npm run assets:verify
```

`assets:verify` refuses to approve the compatibility placeholders. It requires
all **32/32** curated files in the download manifest, a minimum resolution of
**1400 × 800**, and a basic file-size threshold. This prevents an incomplete or
blurry gallery from accidentally being treated as finished.

#### Database and API gallery support

Migration `005_phase8_1_destination_galleries.sql` adds:

```text
destinations.gallery_images JSONB
```

Each destination stores an ordered array such as:

```json
[
  {
    "url": "images/destinations/jinja/jinja-01.jpg",
    "credit": "Photographer name",
    "sourceUrl": "Unsplash source page"
  },
  {
    "url": "images/destinations/jinja/jinja-02.jpg",
    "credit": "Photographer name",
    "sourceUrl": "Unsplash source page"
  }
]
```

The destination API now returns `galleryImages` in addition to the existing
primary `imageUrl`. This lets the frontend use the same database-backed photo
set everywhere instead of hard-coding separate image lists in page scripts.

UI usage of the gallery data now includes:

- **Home:** each destination uses its primary gallery image in the cinematic
  slider and portrait card rail;
- **Destinations:** cards crossfade to a second exact-location photo on
  hover/focus when one is available;
- **Destination Details:** an animated thumbnail gallery switches the main
  photograph and its photographer/source credit;
- **database seed/migration:** local image paths and their credits are persisted
  so the gallery remains API-driven.

### 12.5 Phase 8.2 — full-viewport Home hero and transition repair

Phase 8.2 is a focused UI correction based on a screen recording of the live
Phase 8.1 Home page. The recording revealed two issues in the cinematic hero:

1. the temporary card-to-background image clone used a higher stacking layer
   than the hero UI, so the expanding photograph briefly covered the title,
   description, destination cards and dark readability gradient; and
2. `scrollIntoView()` was being used to center the active horizontal card,
   which could also move the document vertically and make the whole hero jump.

The Home experience was therefore changed without altering the PostgreSQL
schema, destination galleries, authentication, bookings or profile system.

#### Full-screen opening surface

The Home hero now occupies the complete opening viewport:

```text
Desktop / mobile viewport
┌──────────────────────────────────────────┐
│ floating navigation                      │
│                                          │
│ destination background                   │
│ title + description                      │
│ destination card rail + controls         │
│                              scroll cue ↓ │
└──────────────────────────────────────────┘
                    ↓ scroll
┌──────────────────────────────────────────┐
│ destination search                       │
│ travel themes                            │
│ more destination information/cards       │
└──────────────────────────────────────────┘
```

The hero uses `100vh` with a `100svh` override for modern mobile browsers. On
the Home page only, the existing navigation floats over the hero instead of
occupying layout height above it. Other pages retain their normal sticky
navigation behavior.

#### Background-only destination transition

The card morph overlay has been removed from the Home transition. Two full-hero
image layers (`journey-bg-a` and `journey-bg-b`) now alternate. The inactive
layer preloads/decodes the next destination image and then crossfades beneath
the permanent readability gradient and UI. The stacking order is now:

```text
TOP
hero title / cards / controls / progress
readability gradient
crossfading destination image layers
BOTTOM
```

As a result, the changing photograph can no longer cover the interface. Cards
still lift/scale subtly when selected so the interaction retains the reference
video's tactile feeling without using the unstable full-screen card expansion.
The destination copy continues to fade/slide between scenes.

#### Horizontal card scrolling fix

The active destination is now centered by calling `scrollTo()` on
`#journey-cards` and calculating a horizontal offset. This changes only the card
rail's `scrollLeft`; it does not ask the browser to bring an element into the
document viewport. This removes the unwanted vertical page movement observed in
the Phase 8.1 recording.

#### Scroll handoff

A small animated **Scroll to explore** cue is placed at the bottom of the hero.
The destination search has a stable `#home-search` anchor immediately after the
full-screen opening. Scrolling naturally hands the user from the cinematic
intro into search, travel themes and the existing destination content. Reduced
motion preferences disable the cue animation and background transition timing.

No new database migration is required for Phase 8.2. If migrations 004 and 005
were already applied, the database is ready.

### 12.6 Phase 8.3 — scroll morph, soft snap and three-card circular queue

Phase 8.3 refines the Home interaction requested after reviewing the Phase 8.2 full-screen hero. It does not add a database migration or change the destination, authentication or booking API contracts.

#### Scroll-linked Hero -> Search handoff

The opening hero now sits inside a taller transition scene while the actual `journey-slider` remains sticky at the top of the viewport. Vanilla JavaScript calculates scroll progress and progressively fades/lifts the hero UI, softens the photograph and lets one opaque Home content surface rise over the lower half. That surface contains Search, travel themes and the content below it, so the fullscreen destination appears to dissolve into the page instead of ending at a hard `100vh` boundary.

There are two intentional resting positions around the opening boundary:

```text
A. Fullscreen destination hero
        ⇅ scroll-linked dissolve / rise
B. Search + Home content aligned to the viewport
```

When scrolling stops inside this transition zone, a custom eased scroll finishes the movement. Direction-aware thresholds make downward movement favor Search and upward movement favor the fullscreen hero. Below the opening boundary, the rest of the site scrolls normally. Reduced-motion preferences bypass the animated snap.

#### Exactly three upcoming destination cards

The old all-destination horizontal rail is replaced by a circular **three-card upcoming queue**. The fullscreen destination is never duplicated in the rail. If Kidepo is fullscreen, the queue can be `Sipi Falls | Kampala | Rwenzori Mountains`; when Sipi becomes fullscreen, the queue becomes `Kampala | Rwenzori Mountains | Murchison Falls`. This continues indefinitely across all nine PostgreSQL destinations.

The first card is marked **Next**. All three cards remain complete and visible on desktop and mobile; there is no half-card clipping or hidden tail behind the hero image.

#### Synchronized queue animation

The queue uses a FLIP-style vanilla JavaScript transition. The destination becoming fullscreen gets a temporary departing clone, remaining cards move smoothly into their new slots, and a newly upcoming destination enters slot three from the outer side. This runs alongside the background crossfade and destination-copy transition for autoplay, next/previous controls and card selection.

#### PWA cache refresh

The service-worker cache key is now `ugotour-phase8-3-v1` so installed/cached copies do not keep serving Phase 8.2 Home JavaScript or CSS.

No new PostgreSQL migration is required for Phase 8.3. Databases with migrations 004 and 005 already applied are ready.


## Phase 8.4 — One-gesture cinematic Hero ↔ Search handoff

Phase 8.4 replaces the Phase 8.3 continuously scroll-linked Home transition with
a discrete, deliberate gesture-driven handoff. The user now scrolls/swipes once
from the fullscreen hero and JavaScript plays the entire transition before
settling exactly on the Search/content surface.

### Downward behavior

```text
Fullscreen hero
      ↓ one deliberate scroll / swipe
Hero copy + three-card queue fade/lift
Hero photography softens and recedes
Search/content surface rises from below
Content slightly overshoots and settles
      ↓
Exact Search resting position
```

The browser's normal pixel-by-pixel scrolling is intercepted only at the Hero
boundary. During the roughly one-second handoff, repeated wheel/touch events are
locked out. A short momentum cooldown also swallows the tail of trackpad inertia
so the page does not immediately drift past the Search section after landing.

### Upward behavior

When the user returns to the top boundary of the Search/content section and
scrolls upward once, the same sequence is reversed: the content falls/fades away,
the hero photography and UI return, and the viewport lands exactly at the
fullscreen hero position.

### Normal scrolling remains normal

The cinematic interception is limited to the two resting positions:

```text
Hero ↔ Search = one-gesture cinematic handoff
Search ↓ rest of page = ordinary browser scrolling
```

Keyboard PageDown/ArrowDown/Space and PageUp/ArrowUp are also supported at the
relevant boundary, and `prefers-reduced-motion` users receive an immediate
resting-position change instead of the full animation.

The Phase 8.3 three-card circular destination queue remains intact and continues
to synchronize with hero background/copy changes. The service-worker cache key
is advanced to `ugotour-phase8-4-v1` so an installed PWA does not keep serving
the previous scroll-linked Home JavaScript/CSS. No PostgreSQL migration is
required for Phase 8.4.

## 13. Running the current application

### 13.1 Download and verify the final high-resolution destination images

From the **UgoTour project root**, run these commands while connected to the
internet:

```powershell
npm run assets:download
npm run assets:verify
```

The downloader writes the curated files directly under:

```text
frontend/images/destinations/
```

Do not treat the bundled compatibility placeholders as the final photography.
Continue only when the downloader reports **32/32** and the verifier confirms
that all 32 images meet the Phase 8.1 minimum quality target of **1400 × 800**.
If the downloader reports fewer than 32 successful files, run it again while
connected to the internet and then run the verifier again.

### 13.2 Apply the Phase 8 / Phase 8.1 migrations

If migration `004_phase8_visuals_and_profile_photo.sql` was already applied
from the first Phase 8 build, apply only migration 005 from `UgoTour/backend`:

```powershell
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\005_phase8_1_destination_galleries.sql
```

If Phase 8 migration 004 has **not** been applied yet, run 004 first and then
005:

```powershell
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\004_phase8_visuals_and_profile_photo.sql
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\005_phase8_1_destination_galleries.sql
```

Migration 004 adds profile-image/destination-photo metadata fields. Migration
005 adds the ordered multi-image JSONB galleries and updates all nine existing
destination rows to the new local gallery paths.

### 13.3 Start the backend

From `UgoTour/backend`:

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

A healthy Phase 8.5 response from `/health` reports:

```json
{
  "status": "ok",
  "message": "UgoTour API is running",
  "phase": "8.5",
  "database": "connected"
}
```

### 13.4 Start the frontend

Use VS Code Live Server to serve:

```text
frontend/index.html
```

Keep `npm start` running in the backend terminal while browsing the frontend.
Because the service worker caches local assets, refresh/reload the PWA after
running `assets:download` so the new gallery files can replace any previously
cached compatibility placeholders. Phase 8.1 uses network-first handling for
`frontend/images/destinations/` to make this replacement safer during local
development.

### 13.5 PWA installation

When the frontend is served from **localhost** or a deployed **HTTPS** address,
supported browsers can offer installation. UgoTour includes
`manifest.webmanifest`, `service-worker.js`, app icons, theme colors and an
install button that appears when the browser exposes the install prompt.


## 13.6 Phase 8.5 — cross-page visual consistency

Phase 8.5 keeps the Home fullscreen hero and one-gesture handoff intact, while
bringing the rest of UgoTour into the same image-led visual system.

- Home **More to Discover** now renders only three destination cards; the
  existing **View all destinations** action opens the complete catalog.
- Destinations now opens with a full-width photographic hero and lifts the
  searchable/filterable catalog into a cream content surface below it.
- Bookings receives an immersive Lake Bunyonyi hero and keeps the PostgreSQL
  itinerary cards and cancellation flow unchanged underneath.
- Profile receives a Bwindi hero plus a live identity pill that mirrors the
  logged-in user's name, email and uploaded profile picture.
- Login and Sign Up now use photographic top heroes with a focused form surface
  that overlaps the bottom edge, replacing the older split-screen treatment.
- Destination Details keeps its dynamic database-selected gallery but the lead
  photograph is now full-bleed across the top of the viewport, with the existing
  overview and booking panel lifted over its lower edge.
- Desktop floating navigation, mobile bottom navigation, typography, spacing,
  shadows, cream surfaces and forest tones are now consistent across pages.

No PostgreSQL migration is required for Phase 8.5. It is a frontend visual
consistency pass plus a small profile display synchronization update.


---

## Phase 8.6 — content hierarchy cleanup + no-hero Profile

Phase 8.6 responds to the cross-page review after Phase 8.5. The Home page is
unchanged.

### Destinations and Bookings layout cleanup

- Kept both photographic heroes, but rebuilt the cream content surface directly
  underneath them with a clearer vertical rhythm.
- Heading, supporting copy and page action now live in one intentional intro
  block instead of appearing compressed against each other.
- Search/filter controls on Destinations start after a consistent spacing gap.
- Booking status, empty states and itinerary cards now start below the intro
  without visually colliding with the page heading.
- Desktop and mobile spacing were tuned separately so the rounded content
  surface still overlaps the hero, but no longer feels crowded or disoriented.

### Profile redesign

- Removed the Profile hero completely, including its large promotional wording.
- Profile information now begins immediately below the floating navigation.
- Added one full-page tourism background image and a dark readability overlay.
- Account/photo, Edit Profile and Change Password cards use translucent cream
  surfaces over the photograph while preserving all existing profile API logic.
- The dedicated `frontend/images/profile-page-background.jpg` uses the curated
  Bwindi Unsplash selection by William Pietermans. Running
  `npm run assets:download` refreshes that file from the same high-resolution
  source used by the destination gallery.

No PostgreSQL migration is required for Phase 8.6.

---

## 14. Current persistence and integration status

```text
Destinations          -> PostgreSQL ✅
Destination details   -> PostgreSQL ✅
Destination galleries -> 32 curated local paths + PostgreSQL JSONB metadata ✅
Image source mapping  -> exact-location/high-resolution Unsplash source set documented ✅
Image quality gate    -> implemented; passes only after 32/32 download + >= 1400×800
Users                 -> PostgreSQL ✅
Password hashes       -> PostgreSQL ✅
Profile pictures      -> PostgreSQL ✅
Sessions              -> PostgreSQL ✅
Profile changes       -> PostgreSQL ✅
Bookings              -> PostgreSQL ✅
Frontend API calls    -> fetch() ✅
Bearer authentication -> API headers ✅
Cinematic Home motion -> full-viewport background crossfade + vanilla JavaScript ✅
Shared page reveals   -> IntersectionObserver / MutationObserver ✅
Responsive mobile UI  -> CSS + vanilla JS ✅
PWA shell/install     -> manifest + service worker ✅
```

Current browser-local data is intentionally limited to:

```text
ugotour_auth_token          -> bearer token
ugotour_favourite_<id>      -> optional device-only favourite UI state
ugotour_api_base_url        -> optional development/deployment API override
```

---

## 15. Next phase — Phase 9

The application is now functionally connected and has the Phase 8 / 8.1 / 8.2 / 8.3 / 8.4 / 8.5 visual
and motion system. Phase 9 should focus on **production readiness and
deployment**, including:

- environment-based backend database credentials;
- production API base URL configuration;
- production CORS rules;
- hosting the Node.js backend and PostgreSQL database;
- serving/deploying the PWA over HTTPS;
- mobile/desktop device testing;
- accessibility and final integration testing;
- final deployment/presentation checklist.

---

## 16. Documentation rule going forward

Do not create separate `PHASE_X_*.md` documents inside `docs/`.

All future architecture changes, completed features, setup steps and phase notes
must be appended to or updated inside:

```text
docs/PROJECT_PROGRESS.md
```

This keeps UgoTour documentation in one continuously maintained source.
