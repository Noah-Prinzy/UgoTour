-- ============================================================
-- PHASE 1.19: Editorial profile + traveller feedback
-- Additive only; preserves existing users, trips and saved places.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio VARCHAR(500) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS user_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback(rating);
