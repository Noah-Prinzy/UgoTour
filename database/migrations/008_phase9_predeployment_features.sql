-- ============================================================
-- PHASE 9: Pre-deployment features and security hardening
-- ============================================================
-- This migration is additive. It preserves all existing users, trips,
-- destinations and attractions.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE sessions
SET expires_at = COALESCE(expires_at, created_at + INTERVAL '7 days')
WHERE expires_at IS NULL;

ALTER TABLE sessions ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '7 days');
ALTER TABLE sessions ALTER COLUMN expires_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_token_expires_at ON sessions(token, expires_at);

ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE attractions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS saved_places (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id BIGINT REFERENCES destinations(id) ON DELETE CASCADE,
  attraction_id BIGINT REFERENCES attractions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT saved_places_exactly_one_place CHECK (
    (destination_id IS NOT NULL AND attraction_id IS NULL)
    OR
    (destination_id IS NULL AND attraction_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS saved_places_user_destination_unique
  ON saved_places(user_id, destination_id)
  WHERE destination_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS saved_places_user_attraction_unique
  ON saved_places(user_id, attraction_id)
  WHERE attraction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contact_messages_status_check CHECK (status IN ('new', 'read', 'closed'))
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created_at
  ON contact_messages(status, created_at DESC);

-- Remove already-expired sessions/reset tokens during migration.
DELETE FROM sessions WHERE expires_at <= NOW();
DELETE FROM password_reset_tokens WHERE expires_at <= NOW();
