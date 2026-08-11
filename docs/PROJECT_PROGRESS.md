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

## Phase 8.7 — Application Visual Architecture Refresh

Phase 8.7 turns the existing pages into one cohesive, authenticated tourism
product. The Node.js built-in HTTP server, raw PostgreSQL queries, REST routes,
destination data, booking operations and profile-photo storage remain intact.

### Authentication entry gate

- Added a reusable frontend session guard that treats the locally stored bearer
  token only as a hint and validates it with `GET /api/profile`.
- Home, Destinations, Destination Details, Bookings and Profile now require a
  valid API session. Missing or rejected tokens lead to Login, and rejected
  tokens are removed by the existing auth service.
- Login and Sign Up validate an existing session before rendering. A valid
  authenticated visitor is returned to Home.
- Successful login and signup save the backend token and open Home. Logout
  clears the token through the existing auth service and opens Login.

### Visual architecture

- **Home:** retained the database-driven fullscreen background crossfade,
  destination copy, local gallery images, search handoff and three-card
  **More to Discover** section. The corrected desktop selector presents five
  large destination photographs in a staggered arc on the far-right, with the
  active destination enlarged at the center and labels floating independently.
  Selecting a circle or pagination dot recenters the destination and updates the
  background, copy and CTA. Number badges, the `Now` label, arrow buttons,
  counter and menu-like row backgrounds were removed. Tablet and mobile use a
  horizontally scrollable circular selector. Orbit placement now uses stable
  queue-order attributes instead of DOM child positions, and the outgoing card
  fades away in place so carousel rotation cannot pull it toward the center.
- **Login and Sign Up:** replaced separate hero/form sections with one image-led
  split composition using existing local Rwenzori and Sipi Falls photographs.
  Only the working email, password, name and confirmation fields are present.
- **Destinations:** removed the large hero and rebuilt the page as one connected
  discovery dashboard with search, API-derived category filters, three featured
  cards, the complete filtered grid, result count and reset action. An upcoming
  journey panel is rendered only when the authenticated user has real bookings.
- **Profile:** removed the Phase 8.6 full-page tourism background. The account
  dashboard begins below navigation with the uploaded avatar, name, email and
  API-provided creation date, followed by existing profile, photo, password and
  logout actions.
- **Navigation and Bookings:** authenticated navigation consistently shows the
  user avatar/name and Home, Destinations, Bookings and Profile. Bookings now
  uses the compact dashboard heading and shared spacing while preserving listing
  and cancellation behavior.
- **Responsive behavior:** desktop destination controls, tablet grids and mobile
  stacked/horizontal layouts share the same spacing, form, card and focus system.

### Files added

- `frontend/js/services/session-guard.js`

### Files modified

- `frontend/index.html`
- `frontend/pages/login.html`
- `frontend/pages/signup.html`
- `frontend/pages/destinations.html`
- `frontend/pages/destination-details.html`
- `frontend/pages/profile.html`
- `frontend/pages/bookings.html`
- `frontend/css/components.css`
- `frontend/css/responsive.css`
- `frontend/js/app.js`
- `frontend/js/components/navbar.js`
- `frontend/js/pages/login.js`
- `frontend/js/pages/signup.js`
- `frontend/js/pages/destinations.js`
- `frontend/js/pages/destination-details.js`
- `frontend/js/pages/bookings.js`
- `frontend/js/pages/profile.js`
- `frontend/service-worker.js`
- `docs/PROJECT_PROGRESS.md`

No files were removed. No PostgreSQL migration is required. The service-worker
cache was incremented to `ugotour-phase8-7-v5` so installed clients receive the
new HTML, CSS, JavaScript and session guard. Same-origin documents, styles and
scripts now use a network-first service-worker strategy with cached fallback,
preventing mixed old/new visual assets after future UI releases.

### Phase 8.7 verification

- Backend and frontend JavaScript syntax checks.
- Local destination image verification and service-worker/manifest path audit.
- Auth route checks for missing, invalid and valid bearer sessions.
- Browser checks for login/signup routing, destination loading and selection,
  search/filter/reset, profile forms/photo controls, bookings/cancellation UI,
  console errors and desktop/tablet/mobile layout.

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

After the Phase 8 visual work, Phase 8.8 tourism-library expansion and Phase 8.9 interactive map, Phase 9 should focus on **production readiness and deployment**, including:

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

---

## Phase 8.8 — Uganda Tourism Library Expansion

Phase 8.8 expands the PostgreSQL-backed library without rebuilding the app or turning every place into a top-level destination. Bookings continue to reference major destinations only. The future map is documented and prepared at the data layer; no map UI or mapping dependency was added.

### Library inventory

| Inventory | Count | Places |
| --- | ---: | --- |
| Existing before | 9 destinations | Murchison Falls; Bwindi Impenetrable National Park; Jinja; Queen Elizabeth National Park; Kidepo Valley National Park; Lake Bunyonyi; Sipi Falls; Kampala; Rwenzori Mountains |
| New national parks | 5 | Kibale; Lake Mburo; Semuliki; Mount Elgon; Mgahinga Gorilla |
| New hubs/destinations | 5 | Fort Portal; Entebbe; Ssese Islands; Lake Mutanda; Ziwa Rhino Sanctuary |
| New attractions | 41 | Hierarchical records listed below |
| Total | 19 destinations + 41 attractions | 60 map-ready tourism locations |

### Attraction hierarchy

- Kampala (10): Kasubi Royal Tombs; Uganda National Museum; Kabaka's Palace; Bulange and Royal Mile; Namugongo Martyrs Shrine; Ndere Cultural Centre; Uganda National Mosque; National Theatre and Craft Village; Kabaka's Lake; Munyonyo Martyrs Shrine.
- Jinja / Busoga corridor (9): Source of the Nile; Itanda Falls; Busowoko Falls; Mabira Forest; Kagulu Hill; Nalubaale Dam; Source of the Nile Bridge; Bishop Hannington Memorial Site; Ssezibwa Falls. District metadata makes clear that corridor sites are not all inside central Jinja.
- Kibale National Park (1): Bigodi Wetland Sanctuary.
- Fort Portal / western hub (3): Fort Portal Crater Lakes; Fort Portal Regional Museum; Katoosa Martyrs Site. Katoosa is explicitly described as a developing Phase I faith-tourism site.
- Semuliki National Park (1): Sempaya Hot Springs.
- Queen Elizabeth National Park (3): Kazinga Channel; Ishasha Sector; Lake Katwe.
- Murchison region (1): Budongo Forest.
- Entebbe / Lake Victoria (5): Ngamba Island Chimpanzee Sanctuary; Uganda Wildlife Conservation Education Centre; Entebbe Botanical Gardens; Mabamba Bay Wetland; Lutembe Bay.
- Independent regional locations (8): Nyero Rock Paintings; Fort Patiko / Baker's Fort; Tororo Rock; Aruu Falls; Kabale Regional Museum; Soroti Regional Museum; Moroto Regional Museum; Ajai Wildlife Reserve. Their nullable parent is intentional because none fits an existing destination honestly. Ajai is described as an active restoration landscape following the 2026 rhino reintroduction, not as a mature general attraction.

The Uganda museum network was checked against the current official museum site. The National Museum record carries its temporary-renovation status; the four regional museum records reflect the official Kabale, Soroti, Moroto and Fort Portal network.

### Database and API architecture

Migration `database/migrations/006_phase8_8_tourism_library.sql` is the next migration after `005`. It:

- adds `district`, `latitude NUMERIC(9,6)` and `longitude NUMERIC(9,6)` to destinations;
- creates `attractions` with a nullable parent destination, `ON DELETE CASCADE`, concise tourism metadata, local gallery metadata and required coordinates;
- adds case-insensitive unique name indexes and attraction lookup indexes;
- updates the original nine rows in place so their IDs remain unchanged;
- inserts ten guarded destination records and 41 guarded attraction records;
- is rerunnable without duplicating tourism records and never deletes users or bookings.

REST additions follow the existing router → controller → service → `pg` structure and parameterized SQL:

- `GET /api/attractions`
- `GET /api/attractions/:id`
- `GET /api/destinations/:id/attractions`

Destination API objects now also expose district, latitude and longitude. The details page requests its destination and nested attractions, renders compact local-image cards, and opens an accessible native dialog. Attraction booking was deliberately not added.

### Image architecture and quality

- Existing destination galleries remain under `frontend/images/destinations/`.
- New destination galleries use one folder per destination and two curated local images per new destination.
- Each attraction uses `frontend/images/attractions/<slug>/<slug>-01.jpg`.
- `scripts/tourism-image-manifest.js` defines the Phase 8.8 local-asset plan.
- `frontend/images/tourism-image-manifest.json` is generated with creator, provider, source page, original dimensions and licence metadata.
- `npm run assets:download` preserves valid files, resolves Wikimedia Commons metadata, stores production images locally and reports failures.
- `npm run assets:verify` checks manifest completeness, JPEG integrity, byte size and dimensions. New destination images require 2000px width; normal attraction cards require 1400px. Scarce exact imagery for Katoosa, Lutembe and Ajai has an explicit 1000px exception rather than substituting an unrelated photograph.
- Unsplash remains the provider for the original 32-image gallery; Wikimedia Commons is the Phase 8.8 provider. Pinterest is not used for production photography.

### Future Uganda tourism map (documented only)

All 19 destinations and all 41 attractions now have latitude/longitude values and useful categories. A future endpoint or combined query can feed destination and attraction rows to JavaScript pins for national parks, wildlife, adventure, culture, heritage, faith, lakes, cities and museums. Phase 8.8 does not install Leaflet, Mapbox, Google Maps or OpenStreetMap UI code.

### Phase 8.8 verification

- Migration applied twice successfully: both runs ended at 19 destinations and 41 attractions, with zero duplicate names and zero missing coordinate pairs.
- Preservation comparison: users stayed at 1 before/after; bookings stayed at 0 before/after; original destination IDs 1–9 remain.
- API: health, destination list/detail, attraction list/detail and destination-attractions passed against the live local PostgreSQL database.
- Authentication and bookings: isolated signup, login, profile fetch, destination booking creation, booking listing, cancellation and logout passed; the test account was removed afterward and database counts returned to the pre-test values.
- JavaScript: backend check and syntax checks for all 20 frontend modules passed.
- PWA: the attraction service was added to the app shell and the cache was advanced to `ugotour-phase8-8-v1`; API data remains network-driven.
- Image verification must report 93/93 passing files before production delivery; the exact last run is recorded in the final Phase 8.8 handoff.

---

## Phase 8.9 — Interactive Uganda Tourism Map

Phase 8.9 turns the map-ready tourism data from Phase 8.8 into an interactive
Uganda exploration experience without changing the booking model or adding a new
database migration.

### Map architecture

The map uses the existing `destinations` and `attractions` latitude/longitude
columns. A new backend map service combines both tables into one GeoJSON
FeatureCollection:

```text
PostgreSQL
├── destinations (19)
└── attractions (41)
        ↓
map-service.js
        ↓
map-controller.js
        ↓
GET /api/map/locations
        ↓ GeoJSON
frontend map-service.js
        ↓
Leaflet map
```

GeoJSON is shaped on the backend so coordinates are returned in the standard
`[longitude, latitude]` order while the frontend remains focused on map UI and
interaction.

### New backend files

- `backend/src/services/map-service.js`
- `backend/src/controllers/map-controller.js`
- `backend/src/database/verify-map-data.js`

New route:

- `GET /api/map/locations`

The response contains destination and attraction features plus summary counts.
No authentication, user, session or booking tables are modified.

### New frontend map experience

- `frontend/pages/map.html`
- `frontend/js/pages/map.js`
- `frontend/js/services/map-service.js`
- `frontend/css/map.css`
- `frontend/data/uganda-boundary.geojson`

The shared navigation now includes **Map** on desktop and mobile.

Map interactions include:

- all 60 tourism locations displayed as map-ready points;
- major-destination and attraction marker distinction;
- marker clustering for dense Kampala, Jinja and Entebbe areas;
- search across name, category, district, region, description and parent destination;
- filters for place type, category and region;
- synchronized results list and map selection;
- destination/attraction information panel;
- `View destination` / parent-destination navigation;
- deep links using `map.html?focus=destination:<id>` and
  `map.html?focus=attraction:<id>`;
- `View on map` links from Destination Details and attraction dialogs;
- responsive mobile information sheet;
- a `Fit Uganda` control;
- an offline/unavailable-map fallback message.

Destination Detail supports an optional `attraction=<id>` query parameter so a
map attraction can open its parent destination and automatically reveal the
correct attraction dialog.

### Mapping libraries and tile policy

Phase 8.9 uses Leaflet 1.9.4 and Leaflet.markercluster 1.1.0 from their public
CDN distributions. The interactive base map uses the standard OpenStreetMap tile
URL and visibly preserves OpenStreetMap attribution.

UgoTour does **not** pre-download, bulk-cache or package OpenStreetMap map tiles.
The service worker caches the local map page/code/boundary file but leaves map
tiles network-driven, matching the OpenStreetMap tile usage policy. The tile URL
can be overridden later through `window.UGOTOUR_TILE_URL` for production hosting.

Uganda's lightweight visual outline is stored locally in
`frontend/data/uganda-boundary.geojson`, based on the Natural Earth 1:110m
country boundary distributed by the `datasets/geo-boundaries-world-110m`
project. It is used for visual context and initial map fitting, not cadastral or
survey work.

### Coordinate QA

`npm run map:verify` was added to the backend package. It checks:

- destination count;
- attraction count;
- missing coordinate pairs;
- coordinates that fall outside a broad Uganda sanity envelope.

This is intentionally a sanity check rather than a replacement for source-level
geographic verification. Phase 8.8 already populated all 19 destination and 41
attraction coordinate pairs.

### PWA updates

The service-worker cache is advanced to `ugotour-phase8-9-v1` and now includes:

- map HTML;
- local map CSS/JavaScript;
- frontend map API service;
- Uganda boundary GeoJSON.

External Leaflet resources and OpenStreetMap tiles are not placed in the app
shell. If the map library/tiles cannot be reached, the page keeps a readable
fallback instead of pretending a stale/offline basemap is available.

### Phase 8.9 database status

No new map schema is required because Phase 8.8 already supplied the coordinate
columns and attraction hierarchy. One small data-correction migration is
required after the coordinate QA described below.

### Phase 8.9 coordinate correction

The map sanity pass caught one Phase 8.8 data error before the map was packaged:
`Kazinga Channel` had longitude `29.157595`, which placed the pin west of
Uganda. Current GeoNames/OpenStreetMap-derived references place the channel near
`-0.203611, 29.885556`. Migration
`007_phase8_9_map_coordinate_correction.sql` updates that one tourism record.

Because Phase 8.8 may already have been applied on a developer database, this is
kept as a new migration rather than silently rewriting migration `006`.

## Phase 8.10 — Immersive Map Canvas & Connected Pin Callouts

Phase 8.10 simplifies the Phase 8.9 map experience after UI review. The tourism
library, GeoJSON endpoint, coordinates, deep links and PostgreSQL architecture
remain unchanged; this phase is a focused frontend interaction redesign.

### Map layout redesign

The map is now the complete visual surface of `pages/map.html`, similar to the
full-screen image treatment used on Home. The page no longer contains the large
"Explore Uganda" introduction, tourism-library counters, dashboard filter bar,
left-hand results list, or footer section. The map uses the visible viewport
(`100svh`) and the normal UgoTour navigation floats above it.

A compact search control and `Fit Uganda` action float directly on the map. The
page itself does not need to scroll, which keeps the map concise on desktop,
tablet and mobile.

### Direct tourism pins

All map-ready tourism locations are rendered directly as Leaflet pin icons.
Phase 8.10 removes marker clustering so destinations and attractions are treated
as actual geographic pinpoints rather than dashboard results. Major destination
pins use the UgoTour forest treatment and attraction pins use a warm heritage
accent. Hovering/focusing a pin shows its place name and selecting it enlarges
the active marker subtly.

### Search interaction

Search no longer filters a persistent results list. Typing opens a small,
temporary suggestion surface (maximum six matches). Choosing a result, or
pressing Enter, flies the map to that tourism location, activates the matching
pin and opens its place callout. Clearing search closes the active callout and
returns the map to the Uganda-wide view.

Search still uses the complete GeoJSON properties, including name, category,
region, district, parent destination, description and highlight.

### Connected information callout

Selecting a marker opens one compact map callout containing:

- local tourism image;
- destination/attraction type;
- category;
- place name;
- district/region;
- short description;
- `View details` when a supported Destination Details route exists.

An SVG connector is positioned between the selected Leaflet marker and the
callout. JavaScript recalculates the connection whenever the map pans, zooms,
resizes or finishes a search focus, so the callout remains visually tied to the
correct pin. On smaller screens the callout settles near the bottom of the map
and the connector adapts to that layout.

Nested attractions continue linking to their parent destination through
`destination-details.html?id=<destination>&attraction=<attraction>`. Independent
attractions with no destination-details route keep their map summary without a
fake details link.

### Preserved Phase 8.9 architecture

No PostgreSQL migration is required for Phase 8.10. These systems are preserved:

- `GET /api/map/locations` GeoJSON endpoint;
- 19 major destinations and 41 attractions;
- all stored latitude/longitude values;
- Uganda boundary GeoJSON;
- `map.html?focus=destination:<id>` / `attraction:<id>` deep links;
- Destination Details `View on map` links;
- authentication/session gate;
- bookings and profiles;
- OpenStreetMap attribution and network-driven tiles.

The service-worker cache advances to `ugotour-phase8-10-v1` so older Phase 8.9
map HTML/CSS/JavaScript cannot remain stuck in the installed PWA.

### Phase 8.10 files changed

- `frontend/pages/map.html`
- `frontend/js/pages/map.js`
- `frontend/css/map.css`
- `frontend/service-worker.js`
- `package.json`
- `backend/package.json`
- `docs/PROJECT_PROGRESS.md`

### Phase 8.10 checks

- frontend map JavaScript syntax check;
- backend `npm run check`;
- map-page structure check confirming removal of the results list/dashboard;
- marker-cluster dependency removal check;
- connected-callout element/path checks;
- service-worker cache version check;
- ZIP integrity check.


---

## Phase 8.11 — Discovery → Map → Details Flow

This phase makes the Uganda Map the intentional bridge between discovery and detailed planning.

### Discovery page
- The Destinations page now loads both major destinations and attractions from the REST API.
- The total counter represents the whole tourism library rather than destinations only.
- Search and category filtering operate across both place types.
- Major-destination cards link to `map.html?focus=destination:<id>`.
- Attraction cards link to `map.html?focus=attraction:<id>`.
- Attractions are displayed in their own image-led discovery section instead of being hidden only inside Destination Details.

### Map callouts
- Map information callouts are larger, with a larger image, title, description and stronger `View details` action.
- Major destinations open their normal Destination Details page.
- Attractions that belong to a destination open the parent Destination Details page without adding an attraction query parameter.
- Independent attractions without a parent destination use the same Destination Details page in standalone-attraction mode, rather than losing the `View details` action.
- Therefore arriving from the Map no longer auto-opens the attraction modal.

### Destination Details cleanup
- The top-level `View on map` button was removed from Destination Details.
- Automatic popup-on-arrival logic for `?attraction=<id>` was removed.
- Attraction cards inside Destination Details can still be intentionally opened by the user.

### Navigation model
`Destinations / Attractions → Map pin + callout → View details → Destination Details`

### Database
No PostgreSQL migration is required for Phase 8.11.

---

## Phase 9 — Final Features and Production Readiness

Phase 9 is the pre-deployment completion pass. It deliberately avoids adding another large tourism subsystem and instead finishes the user/account experience, introduces operator tools, hardens the public API, and supplies deployment/backup/SEO tooling.

### Saved Places / Favorites

Logged-in users can now save both major destinations and attractions. Saved state is stored in PostgreSQL rather than browser storage and appears through heart controls on discovery cards, Destination Details and map callouts.

New REST endpoints:

```text
GET    /api/saved
GET    /api/saved/status?placeType=destination|attraction&placeId=<id>
POST   /api/saved
DELETE /api/saved/:placeType/:id
```

New frontend page:

```text
frontend/pages/saved.html
```

The navbar exposes **Saved** on desktop; mobile users can reach Saved through Profile while keeping the bottom navigation concise.

### Trip planning terminology

The underlying compatibility endpoint remains `/api/bookings`, but the user-facing product now describes these records as **My Trips / Planned Visits**. A saved trip is a personal plan containing a destination, date and traveller count; it is not presented as a confirmed hotel, tour-operator, payment or transport reservation.

### HttpOnly cookie sessions

Browser bearer-token storage has been retired. Login and signup create an expiring server-side session and set the random session identifier as an HttpOnly cookie. Frontend JavaScript uses `credentials: "include"` and never reads the session token.

Production defaults:

- `Secure` cookies;
- `SameSite=Lax` unless intentionally configured otherwise;
- host-only `__Host-ugotour_session` cookie when no explicit cookie name is supplied;
- seven-day session expiry by default (configurable, capped by backend logic);
- database checks reject expired sessions;
- password changes and password resets invalidate existing sessions.

Bearer headers remain accepted for API tooling/backwards compatibility but the browser does not use them.

### Cross-site request protection

Credentialed CORS now reflects only an exact configured origin (plus localhost during development). Browser write requests are additionally rejected when Fetch Metadata reports `cross-site`, or when an explicit `Origin` is not trusted. This complements the session cookie's SameSite policy.

The recommended deployment topology is a same-origin `/api` reverse proxy. The production frontend API client therefore defaults to:

```text
https://your-site.example/api
```

instead of accidentally pointing deployed visitors at localhost.

### Password recovery

New pages:

```text
frontend/pages/forgot-password.html
frontend/pages/reset-password.html
```

New API routes:

```text
POST /api/auth/password-reset/request
POST /api/auth/password-reset/confirm
```

Reset tokens are generated with cryptographic randomness but only a SHA-256 token hash is stored in PostgreSQL. Links expire after 30 minutes and are single-use. A successful reset updates the password hash and removes all user sessions.

Development prints the reset URL in the backend terminal. Production email delivery is implemented through the Resend Email API when `RESEND_API_KEY` and `PASSWORD_RESET_FROM` are configured. Public reset-request responses remain generic so account existence is not intentionally disclosed.

### Informational, support and legal pages

Added:

```text
frontend/pages/about.html
frontend/pages/help.html
frontend/pages/contact.html
frontend/pages/privacy.html
frontend/pages/terms.html
```

The Contact form writes messages into PostgreSQL. Privacy and Terms are explicit pre-deployment templates and should be reviewed for the jurisdiction in which UgoTour is publicly operated.

### Admin/content management

The `users` table now supports `role = user | admin`. Admin endpoints are protected by server-side role checks, not merely hidden navigation.

Admin capabilities include:

- summary counts;
- view/add/edit major destinations;
- view/add/edit attractions;
- change map coordinates and local image paths;
- publish/hide tourism records through `is_active`;
- review Contact messages and mark them new/read/closed.

The current local-image architecture means the Admin UI manages the image **path** rather than uploading arbitrary production binaries. New images should still go through the curated `frontend/images/` + optimization/source-credit workflow.

Grant an existing account admin access from `backend`:

```powershell
npm run admin:grant -- user@example.com
```

### Phase 9 database migration

`008_phase9_predeployment_features.sql` is additive and preserves existing users, trips, destinations and attractions. It adds:

```text
users.role
sessions.expires_at
destinations.is_active / updated_at
attractions.is_active / updated_at
saved_places
password_reset_tokens
contact_messages
```

plus supporting constraints and indexes.

For an existing database already through migration 007:

```powershell
cd backend
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\008_phase9_predeployment_features.sql
```

### API hardening

The custom Node.js API now includes:

- configurable JSON-body size limit;
- general rate limiting;
- tighter authentication/password-reset rate limiting;
- Contact-form rate limiting;
- exact credentialed CORS allowlisting;
- Fetch-Metadata/origin checks for browser writes;
- request IDs;
- structured JSON request/error logging;
- safe generic production 500 responses;
- `X-Content-Type-Options`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- no-store API response policy;
- graceful shutdown that closes the PostgreSQL pool;
- server request/header/keep-alive timeouts.

The in-memory limiter is suitable for this single-instance prototype/deployment tier. A future horizontally scaled deployment should move rate-limit counters into shared infrastructure.

### PWA install and update UX

The PWA layer now captures `beforeinstallprompt` and exposes **Install UgoTour** controls when supported. When a new service worker waits, the UI exposes an **Update available** action that activates the new worker and reloads cleanly.

The final service-worker cache is:

```text
ugotour-v1-0-0
```

Navigation uses network-first behavior with `offline.html` fallback. JavaScript/CSS are network-first, optimized local images become cache-first after use, and OpenStreetMap tiles/API responses are explicitly excluded from PWA caching.

### Performance/image delivery

The project retains original high-resolution tourism sources for quality and provenance, while normal browser paths resolve raster images to generated WebP assets under:

```text
frontend/images/optimized/
```

Final optimization pass:

```text
103 raster source images
~166 MB source raster bytes
~40 MB optimized WebP bytes
~76% transfer-size reduction
```

Off-screen destination/trip images use lazy loading. The Home opening image is eager/high-priority and preloaded because it is the initial visual/LCP candidate.

The development-only Tailwind browser CDN was removed because the final UI is already implemented in project CSS; this avoids shipping a runtime development compiler to users.

### Accessibility pass

Phase 9 adds/reinforces:

- skip-to-content navigation;
- visible `:focus-visible` treatment;
- semantic main landmarks;
- accessible names on map/profile/save controls;
- live regions for form/status feedback;
- keyboard-accessible links/buttons/dialog controls;
- reduced-motion support retained from earlier animation phases.

### SEO tooling

Public pages have page-specific titles/descriptions and private/account pages are `noindex,nofollow` where appropriate. Once the final public domain is known, run:

```powershell
npm run seo:build -- https://your-domain.example
```

This produces deployment-specific `frontend/sitemap.xml` and `frontend/robots.txt`. Dynamic personal pages are excluded.

### Backups and operational monitoring

Added Windows backup helper:

```powershell
.\scripts\backup-db.ps1
```

It creates a PostgreSQL custom-format dump through `pg_dump`. Production should schedule backups (or enable managed-provider backups) and periodically test restoration.

The backend now emits structured request logs with request ID, method, path, response status and duration. `/health` verifies database connectivity and reports the runtime environment/timestamp for uptime checks.

### Production configuration

A root `.env.example` documents database, cookie, CORS, rate-limit and password-reset settings. `backend/start.js` contains a zero-dependency local `.env` loader; environment variables supplied by a hosting provider take precedence.

Before public deployment configure at minimum:

```text
APP_ENV=production
DATABASE_URL=...
CORS_ALLOWED_ORIGINS=https://your-domain.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=Lax
PUBLIC_APP_URL=https://your-domain.example
RESEND_API_KEY=...
PASSWORD_RESET_FROM=...
```

The preferred setup serves the frontend and API through the same HTTPS site, forwarding `/api/*` to Node.js. If frontend/API origins are intentionally split, CORS, the browser API base and CSP must be configured for those exact origins.

### Final validation commands

From the project root:

```powershell
npm run backend:check
npm run assets:verify
npm run predeploy:check
npm run security:smoke
```

With PostgreSQL running, from `backend`:

```powershell
npm run db:test
npm run map:verify
```

After the production domain is known:

```powershell
npm run seo:build -- https://your-domain.example
```

### Phase 9 key files added

```text
.env.example
backend/start.js
backend/src/controllers/admin-controller.js
backend/src/controllers/contact-controller.js
backend/src/controllers/password-reset-controller.js
backend/src/controllers/saved-controller.js
backend/src/services/admin-service.js
backend/src/services/contact-service.js
backend/src/services/password-reset-service.js
backend/src/services/saved-service.js
backend/src/middleware/rate-limit.js
backend/src/middleware/security.js
backend/src/utils/cookies.js
backend/src/database/grant-admin.js
database/migrations/008_phase9_predeployment_features.sql
frontend/offline.html
frontend/pages/saved.html
frontend/pages/forgot-password.html
frontend/pages/reset-password.html
frontend/pages/about.html
frontend/pages/help.html
frontend/pages/contact.html
frontend/pages/privacy.html
frontend/pages/terms.html
frontend/pages/admin.html
frontend/js/services/saved-service.js
frontend/js/services/contact-service.js
frontend/js/services/admin-service.js
frontend/js/pages/saved.js
frontend/js/pages/forgot-password.js
frontend/js/pages/reset-password.js
frontend/js/pages/contact.js
frontend/js/pages/admin.js
frontend/js/pages/static-page.js
scripts/optimize-images.py
scripts/build-seo.js
scripts/backup-db.ps1
scripts/predeploy-check.js
```

### Phase 9 status

The application code is now at its final pre-deployment feature stage. Actual deployment still requires infrastructure-specific values that cannot be embedded safely in a downloadable ZIP: the public domain, production PostgreSQL connection, HTTPS/reverse-proxy configuration, email-provider credentials, and final legal review.
