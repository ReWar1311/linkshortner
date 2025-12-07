-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(150),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255),    -- used for Google OAuth, can be NULL
    provider VARCHAR(32),      -- e.g., 'google', can be NULL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LINKS TABLE
CREATE TABLE IF NOT EXISTS links (
    link_id SERIAL PRIMARY KEY,
    redirect_to TEXT NOT NULL,
    name VARCHAR(255),
    tagname VARCHAR(100),
    description TEXT,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LINKCLICKS (Analytics) TABLE
CREATE TABLE IF NOT EXISTS linkclicks (
    id SERIAL PRIMARY KEY,
    status VARCHAR(32),
    country VARCHAR(128),
    country_code VARCHAR(8),
    region VARCHAR(64),
    region_name VARCHAR(128),
    city VARCHAR(128),
    zip VARCHAR(32),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    timezone VARCHAR(64),
    isp VARCHAR(128),
    org VARCHAR(128),
    as_full VARCHAR(128),
    query VARCHAR(64),           -- IP address as stored by `details.data.query`
    link_id INTEGER NOT NULL REFERENCES links(link_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_linkclicks_link_id ON linkclicks(link_id);
INSERT INTO users (user_id, first_name, email, username, password_hash, provider) VALUES (0, 'Guest', NULL, 'guest', NULL, 'guest');
