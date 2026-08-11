-- ================================================================
-- UgoTour PostgreSQL schema - through Phase 9 pre-deployment
-- ================================================================
-- Fresh database setup. Existing databases should apply their missing numbered migrations through 008
-- instead of recreating tables.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_image TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS destinations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    region VARCHAR(120) NOT NULL,
    district VARCHAR(120),
    description TEXT NOT NULL,
    highlight VARCHAR(255),
    activities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    best_for VARCHAR(255),
    suggested_days INTEGER CHECK (suggested_days > 0),
    travel_tip TEXT,
    image_url TEXT,
    photo_credit VARCHAR(180),
    photo_source_url TEXT,
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    latitude NUMERIC(9,6) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    longitude NUMERIC(9,6) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS destinations_name_unique_ci ON destinations (LOWER(name));

CREATE TABLE IF NOT EXISTS attractions (
    id BIGSERIAL PRIMARY KEY,
    destination_id BIGINT REFERENCES destinations(id) ON DELETE CASCADE,
    name VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    district VARCHAR(120),
    region VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    highlight VARCHAR(255),
    latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    image_url TEXT,
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    photo_credit VARCHAR(180),
    photo_source_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS attractions_name_unique_ci ON attractions (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_attractions_destination_id ON attractions(destination_id);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    destination_id BIGINT NOT NULL
        REFERENCES destinations(id)
        ON DELETE CASCADE,

    travel_date DATE NOT NULL,

    travellers INTEGER NOT NULL
        CHECK (travellers > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_expires_at ON sessions(token, expires_at);


CREATE TABLE IF NOT EXISTS saved_places (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_id BIGINT REFERENCES destinations(id) ON DELETE CASCADE,
    attraction_id BIGINT REFERENCES attractions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((destination_id IS NOT NULL AND attraction_id IS NULL) OR (destination_id IS NULL AND attraction_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS saved_places_user_destination_unique ON saved_places(user_id,destination_id) WHERE destination_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS saved_places_user_attraction_unique ON saved_places(user_id,attraction_id) WHERE attraction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE TABLE IF NOT EXISTS contact_messages (
    id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(120) NOT NULL, email VARCHAR(255) NOT NULL, subject VARCHAR(180) NOT NULL, message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new','read','closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_created_at ON contact_messages(status, created_at DESC);
