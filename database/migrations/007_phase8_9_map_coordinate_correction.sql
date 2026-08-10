-- ============================================================
-- PHASE 8.9: map coordinate QA correction
-- ============================================================
-- The Phase 8.9 map audit found that the Kazinga Channel longitude in the
-- Phase 8.8 seed was outside Uganda. GeoNames/OpenStreetMap-derived references
-- place the channel around -0.203611, 29.885556. This migration corrects only
-- that attraction record and does not alter users, sessions or bookings.

UPDATE attractions
SET latitude = -0.203611,
    longitude = 29.885556
WHERE name = 'Kazinga Channel';
