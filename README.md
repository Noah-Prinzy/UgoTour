# UgoTour

UgoTour is a JavaScript-first Uganda tourism Progressive Web App. It combines a responsive browser/PWA frontend, a framework-light Node.js REST API, PostgreSQL, an interactive Uganda map, a curated tourism library, personal saved places and trip planning.

## Stack

- **Frontend:** HTML, CSS, vanilla JavaScript
- **Map:** Leaflet + OpenStreetMap tiles
- **Backend:** JavaScript + Node.js built-in HTTP server
- **Database:** PostgreSQL + `pg` + raw parameterized SQL
- **PWA:** manifest + service worker
- **No:** React, Vue, Angular, Express, NestJS, Prisma or ORM

## Final feature set

- 19 major Uganda destinations + 41 attractions
- Local multi-image destination/attraction photography
- Discover → Map → Details navigation
- Interactive Uganda tourism map with direct pins/search/callouts
- Account signup/login/logout with expiring **HttpOnly cookie sessions**
- Profile editing and profile pictures
- Password recovery with expiring reset links (Resend integration for production)
- Saved Places / Favorites across destinations, attractions and map callouts
- Personal **My Trips / Planned Visits** (not represented as paid/confirmed reservations)
- About, Help, Contact, Privacy and Terms pages
- Role-protected Admin dashboard for tourism records and contact messages
- PWA install/update experience and offline fallback
- Responsive WebP delivery images while retaining high-resolution source assets
- Security headers, request-size limits, CORS allowlist, write-origin checks, rate limiting and safe production errors
- Structured request/error logs and `/health`
- Sitemap/robots generator, database backup script and pre-deployment checks

## Local setup

### 1. Install backend dependency

```powershell
cd backend
npm install
```

### 2. Environment

From the project root:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local PostgreSQL password. `backend/start.js` reads the root `.env` for local development. Hosting-provider environment variables override `.env` values.

### 3. Apply the final migration

If your existing database is already at migration 007:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
cd backend
psql -U ugotour_user -h localhost -p 5432 -d ugotour_db -f ..\database\migrations\008_phase9_predeployment_features.sql
```

### 4. Validate

From the project root:

```powershell
npm run backend:check
npm run assets:verify
npm run predeploy:check
npm run security:smoke
```

From `backend` with PostgreSQL running:

```powershell
npm run db:test
npm run map:verify
```

### 5. Start

```powershell
cd backend
npm start
```

Then serve `frontend/` through VS Code Live Server (or another local static server). Local frontend/API requests use credentialed cookies and allow `localhost`/`127.0.0.1` development origins.

## Make your account an administrator

First create a normal UgoTour account, then from `backend`:

```powershell
npm run admin:grant -- your-email@example.com
```

Log out and back in. The Admin link will then appear.

## Password reset email

Development prints a reset URL in the backend terminal. Before public deployment configure:

```text
PUBLIC_APP_URL=https://your-domain.example
RESEND_API_KEY=...
PASSWORD_RESET_FROM=UgoTour <noreply@your-verified-domain.example>
```

The API stores only a hash of each reset token and reset links expire after 30 minutes.

## Production deployment assumptions

UgoTour now defaults deployed frontend requests to **same-origin `/api`**. The cleanest production topology is therefore:

```text
https://ugotour.example/       -> static frontend
https://ugotour.example/api/*  -> Node.js backend (reverse proxy)
                                 -> PostgreSQL
```

If the API must be on a separate origin, set `window.UGOTOUR_API_BASE_URL` before frontend modules load, add that exact frontend origin to `CORS_ALLOWED_ORIGINS`, configure cookies appropriately, and update the frontend CSP `connect-src` directive.

Recommended production settings include:

```text
APP_ENV=production
COOKIE_SECURE=true
COOKIE_SAME_SITE=Lax
COOKIE_DOMAIN=
CORS_ALLOWED_ORIGINS=https://your-domain.example
TRUST_PROXY=true   # only when the hosting proxy supplies trusted forwarding headers
DATABASE_URL=postgresql://...
DB_SSL=true        # when required by your database host
PUBLIC_APP_URL=https://your-domain.example
```

When `SESSION_COOKIE_NAME` is left blank in production, UgoTour uses a host-only `__Host-ugotour_session` cookie. Keep `COOKIE_DOMAIN` blank for that cookie.

## Build SEO files after you know the production domain

```powershell
npm run seo:build -- https://your-domain.example
```

This generates `frontend/sitemap.xml` and a production `frontend/robots.txt`.

## Database backups

On Windows/PowerShell, with `pg_dump` available:

```powershell
.\scripts\backup-db.ps1
```

For production, schedule this (or use your managed PostgreSQL provider's automated backups) and periodically test restoration.

## Image performance

High-resolution source photography remains under `frontend/images/`. Browser pages resolve raster sources to WebP copies under `frontend/images/optimized/`.

```powershell
npm run assets:optimize
npm run assets:verify
```

The final optimization pass reduces the 103 raster source assets from roughly 166 MB to roughly 40 MB of WebP transfer assets.

## Before public launch

1. Run migration 008 and all validation commands.
2. Configure production database, HTTPS, exact CORS origin, secure cookies and password-reset email.
3. Run `npm run seo:build -- https://your-domain`.
4. Configure automated PostgreSQL backups.
5. Configure your static host/reverse proxy to return security headers (especially CSP and anti-framing headers) at HTTP-header level; the project also includes a browser CSP meta policy.
6. Review Privacy and Terms with the legal requirements that apply to the deployment jurisdiction.
7. Test signup, login, logout, password reset, Saved Places, Trips, profile photo, map, Contact and Admin on the real HTTPS domain.

Full cumulative technical history is in `docs/PROJECT_PROGRESS.md`.
