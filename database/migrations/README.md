# Database migrations

Apply migrations in numeric order for an existing database:

1. `001_create_core_tables.sql` — creates `users`, `destinations`, `bookings`, and `sessions`.
2. `002_add_lookup_indexes.sql` — adds lookup indexes used by sessions/bookings.
3. `003_add_destination_details.sql` — adds the richer destination fields needed by the API-connected details page and fills the original nine destinations.
4. `004_phase8_visuals_and_profile_photo.sql` — adds destination photo metadata and PostgreSQL-backed profile pictures.
5. `005_phase8_1_destination_galleries.sql` — adds local multi-image destination galleries.
6. `006_phase8_8_tourism_library.sql` — preserves the original destination rows, adds district and map-ready coordinates, inserts ten major destinations, creates the cascading attractions hierarchy, and inserts 41 verified/status-aware attractions.

7. `007_phase8_9_map_coordinate_correction.sql` — corrects the Kazinga Channel coordinate caught during the interactive-map QA pass.
