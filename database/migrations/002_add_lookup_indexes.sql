-- Phase 6 completion migration.
-- These indexes improve the common authenticated-user and booking lookups.

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
