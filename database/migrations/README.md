# Database migrations

Apply migrations in numeric order for an existing UgoTour database. Never rerun `schema.sql` over an existing database just to upgrade it.

1. `001_create_core_tables.sql` — creates `users`, `destinations`, `bookings`, and `sessions`.
2. `002_add_lookup_indexes.sql` — adds lookup indexes used by sessions and trip plans.
3. `003_add_destination_details.sql` — adds richer destination-detail fields and fills the original nine destinations.
4. `004_phase8_visuals_and_profile_photo.sql` — adds destination photo metadata and PostgreSQL-backed profile pictures.
5. `005_phase8_1_destination_galleries.sql` — adds local multi-image destination galleries.
6. `006_phase8_8_tourism_library.sql` — adds district/map coordinates, ten additional major destinations, the attractions hierarchy, and the expanded Uganda tourism library.
7. `007_phase8_9_map_coordinate_correction.sql` — corrects the Kazinga Channel coordinate found during map QA.
8. `008_phase9_predeployment_features.sql` — adds secure session expiry, user roles, saved places, password-reset tokens, contact messages, content visibility controls, and supporting indexes without deleting users or trip plans.

For the final pre-deployment upgrade on an existing Phase 8.11 database, normally only migration `008` is new.
