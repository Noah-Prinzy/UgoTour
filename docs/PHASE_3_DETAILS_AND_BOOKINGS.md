# UgoTour Phase 3 — Destination Details and Booking Flow

## Goal
Phase 3 turns destination browsing into a simple user journey:

1. Browse/filter destinations.
2. Open one reusable destination-details page.
3. Read the destination id from the URL with `URLSearchParams`.
4. Render the correct destination with vanilla JavaScript.
5. Complete a booking form.
6. Validate the form with reusable JavaScript helpers.
7. Save the booking temporarily with `localStorage`.
8. View and cancel saved bookings on the Bookings page.

## Important architecture rule
- HTML = structure.
- CSS/Tailwind = design.
- Vanilla JavaScript = functionality.
- localStorage = temporary frontend persistence only.
- Node.js + PostgreSQL will replace localStorage in a later phase.

## Main Phase 3 files
- `frontend/pages/destination-details.html`
- `frontend/js/pages/destination-details.js`
- `frontend/js/services/booking-service.js`
- `frontend/pages/bookings.html`
- `frontend/js/pages/bookings.js`
- `frontend/js/utils/storage.js`
- `frontend/js/utils/validation.js`

The Phase 2 destination catalog is also updated so each destination card links to:

`destination-details.html?id=<destination id>`
