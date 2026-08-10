-- ================================================================
-- UgoTour PostgreSQL schema - through Phase 8.1
-- ================================================================
-- Fresh database setup. Existing databases should apply their missing numbered migrations through 005
-- instead of recreating tables.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    profile_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS destinations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    region VARCHAR(120) NOT NULL,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
