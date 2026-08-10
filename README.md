# UgoTour

UgoTour is a JavaScript-first tourism application for discovering destinations and experiences in Uganda.

## Architecture

### Frontend
- HTML for structure
- CSS + Tailwind CSS for design
- Vanilla JavaScript for application functionality

### Backend (later phase)
- JavaScript
- Node.js
- REST API

### Database (later phase)
- PostgreSQL
- `pg` / node-postgres
- SQL

## Completed phases

### Phase 1 — Frontend foundation
- reusable frontend structure
- Home page destination search
- JavaScript DOM rendering

### Phase 2 — Destinations catalog
- larger destination dataset
- live search
- category filtering
- reusable destination cards
- destination details dialog

### Phase 3 — Destination details and bookings
- dynamic destination-details page using URL parameters
- JavaScript booking form validation
- localStorage booking persistence
- bookings list and cancellation

### Phase 4 — Authentication and profile
- signup
- duplicate-email checking
- login
- local session state
- session-aware navbar
- editable user profile
- password changing
- logout
- commented JavaScript learning architecture

## Important
Phase 3 bookings and Phase 4 authentication currently use browser localStorage only. These are temporary frontend implementations used to learn the full flow before the Node.js REST API and PostgreSQL database are introduced.
