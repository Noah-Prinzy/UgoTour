# Database migrations

Apply migrations in numeric order for an existing database:

1. `001_create_core_tables.sql` — creates `users`, `destinations`, `bookings`, and `sessions`.
2. `002_add_lookup_indexes.sql` — adds lookup indexes used by sessions/bookings.
3. `003_add_destination_details.sql` — adds the richer destination fields needed by the Phase 7 API-connected details page and fills the existing nine destinations.

- `004_phase8_visuals_and_profile_photo.sql` — adds destination photo metadata and PostgreSQL-backed profile pictures.

- `005_phase8_1_destination_galleries.sql` — adds exact-location multi-image destination galleries and updates the primary image paths used by Phase 8.1.
