-- Notes:
-- Run this once against your database before running ingest_exoplanets.py
psql -U <user> -d exoplanets -f schema.sql
export DB_USER=<user> DB_PASSWORD=<password> DB_NAME=exoplanets
python ingest_exoplanets.py

CREATE TABLE IF NOT EXISTS exoplanets (
    id SERIAL PRIMARY KEY,
    pl_name VARCHAR UNIQUE NOT NULL,
    hostname VARCHAR,
    discovery_year INT,
    discovery_method VARCHAR,
    orbit_period FLOAT,             -- days
    planet_radius FLOAT,            -- Earth radii
    planet_mass FLOAT,              -- Earth masses
    distance_light_years FLOAT,     -- light years from Earth
    star_temp FLOAT,                -- host star temperature in Kelvin
    star_radius FLOAT,              -- host star radius in Solar radii
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
)

CREATE TABLE IF NOT EXISTS fetch_log(
    id SERIAL PRIMARY KEY,
    fetched_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rows_fetched INT NOT NULL,
    status VARCHAR NOT NULL,        -- 'success' or 'failure'
    error_message TEXT
)

-- Helpful indexes for the API layer's filtering/sorting endpoints
CREATE INDEX IF NOT EXISTS idx_exoplanets_radius ON exoplanets (planet_radius);
CREATE INDEX IF NOT EXISTS idx_exoplanets_year ON exoplanets (discovery_year);
CREATE INDEX IF NOT EXISTS idx_exoplanets_method ON exoplanets (discovery_method);