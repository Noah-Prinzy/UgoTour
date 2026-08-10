-- ================================================================
-- UgoTour PostgreSQL schema - through Phase 8.8
-- ================================================================
-- Fresh database setup. Existing databases should apply their missing numbered migrations through 006
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
