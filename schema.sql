-- Notes:
-- Run this once against your database before running ingest_exoplanets.py
-- psql -U <user> -d exoplanets -f schema.sql
-- export DB_USER=<user> DB_PASSWORD=<password> DB_NAME=exoplanets
-- python ingest_exoplanets.py

CREATE TABLE IF NOT EXISTS exoplanets (
    id                SERIAL PRIMARY KEY,
    pl_name           VARCHAR UNIQUE NOT NULL,
    hostname          VARCHAR,
    discovery_year    INTEGER,
    discovery_method  VARCHAR,
    orbital_period    FLOAT,
    planet_radius     FLOAT,
    planet_mass       FLOAT,
    distance_ly       FLOAT,
    star_temp         FLOAT,
    last_updated      TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS fetch_log (
    id              SERIAL PRIMARY KEY,
    fetched_at      TIMESTAMP NOT NULL,
    rows_fetched    INTEGER NOT NULL,
    status          VARCHAR NOT NULL,
    error_message   VARCHAR
);

CREATE INDEX IF NOT EXISTS idx_exoplanets_radius ON exoplanets (planet_radius);
CREATE INDEX IF NOT EXISTS idx_exoplanets_year ON exoplanets (discovery_year);
CREATE INDEX IF NOT EXISTS idx_exoplanets_method ON exoplanets (discovery_method);