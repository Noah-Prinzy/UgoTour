# UgoTour Phase 4 — Authentication and Profile

## Goal
Phase 4 adds a frontend-only user account flow while keeping application functionality in vanilla JavaScript.

## Current architecture

HTML + CSS/Tailwind -> interface and design

Vanilla JavaScript -> signup, login, session state, profile editing and logout

localStorage -> temporary browser-based user/session persistence

## Main files

- `frontend/pages/signup.html` — signup form and account introduction UI.
- `frontend/pages/login.html` — login form.
- `frontend/pages/profile.html` — logged-in profile, profile editing and password change UI.
- `frontend/js/services/auth-service.js` — user creation, login, logout, session lookup, profile updates and password changes.
- `frontend/js/pages/signup.js` — signup page events and form handling.
- `frontend/js/pages/login.js` — login page events and form handling.
- `frontend/js/pages/profile.js` — profile rendering and editing logic.
- `frontend/js/components/navbar.js` — changes navigation depending on login state.
- `frontend/js/utils/storage.js` — reusable localStorage helpers.
- `frontend/js/utils/validation.js` — reusable validation helpers.

## JavaScript concepts demonstrated

- asynchronous functions (`async` / `await`)
- Web Crypto API
- form submit events
- localStorage
- arrays and objects
- `.find()`, `.some()` and `.map()`
- conditional rendering
- reusable service functions
- DOM updates
- session-like state
- validation

## Important security note
This is intentionally a learning prototype. Browser localStorage is not a secure authentication database and SHA-256 alone is not the password-storage approach a production server should use. In a later backend phase, account records and password hashing will move to Node.js and PostgreSQL, and the browser will communicate with the backend through the REST API.
