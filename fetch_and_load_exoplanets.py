"""
Pulls exoplanet data from the NASA Exoplanet Archive (TAP service, no API
key required) and loads it into a local Postgres database.

Usage:
    python ingest_exoplanets.py

Environment variables (put these in a .env file or export them):
    DB_HOST      default: localhost
    DB_PORT      default: 5432
    DB_NAME      default: exoplanets
    DB_USER      required
    DB_PASSWORD  required

Schema expected (see README / schema.sql):
    exoplanets(id, pl_name, hostname, discovery_year, discovery_method,
               orbital_period, planet_radius, planet_mass, distance_ly,
               star_temp, last_updated)
    fetch_log(id, fetched_at, rows_fetched, status, error_message)
"""

import os
import sys
import logging
from datetime import datetime, timezone
 
import requests
import psycopg2 #https://pypi.org/project/psycopg2/
from psycopg2.extras import execute_values

NASA_TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

# ADQL query against the Planetary Systems (ps) table.
# We pull one row per planet using the default parameter set (default_flag = 1)
# so we don't get duplicate rows from multiple publications of the same planet.
ADQL_QUERY = """
SELECT pl_name, hostname, disc_year, discoverymethod,
       pl_orbper, pl_rade, pl_bmasse, sy_dist, st_teff
FROM ps
WHERE default_flag = 1
"""

REQUEST_PARAMS = {
    "query": ADQL_QUERY,
    "format": "json",
}

DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "port": os.environ.get("DB_PORT", "5432"),
    "dbname": os.environ.get("DB_NAME", "exoplanets"),
    "user": os.environ.get("DB_USER"),
    "password": os.environ.get("DB_PASSWORD"),
}

REQUEST_TIMEOUT_SECONDS = 60

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
) 
log = logging.getLogger("fetch_and_load_exoplanets")

# ================================================================================

def fetch_exoplanet_data():
    """Fetches exoplanet data from the NASA Exoplanet Archive TAP service."""
    log.info("Fetching exoplanet data from NASA Exoplanet Archive...")
    try:
        response = requests.get(NASA_TAP_URL, params=REQUEST_PARAMS, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        data = response.json()
        log.info("Received %d rows from NASA Exoplanet Archive.", len(data))
        return data
    except requests.RequestException as e:
        log.error("Error fetching data: %s", e)
        raise


def clean_row(raw):
    """
    Normalize a single raw API row into the tuple shape our DB expects.
    Missing/None values are passed through as NULL rather than guessed.
    """
    return (
        raw.get("pl_name"),
        raw.get("hostname"),
        raw.get("disc_year"),
        raw.get("discoverymethod"),
        raw.get("pl_orbper"),
        raw.get("pl_rade"),
        raw.get("pl_bmasse"),
        raw.get("sy_dist"),
        raw.get("st_teff"),
        datetime.now(timezone.utc),
    )


def upsert_exoplanets(conn, rows):
    """
    Insert or update exoplanet rows. Uses pl_name as the natural key for
    conflict resolution, since NASA's IDs aren't exposed in this query.
    """

    cleaned = [clean_row(r) for r in rows if r.get("pl_name")]

    upsert_sql = """
        INSERT INTO exoplanets (
            pl_name, hostname, discovery_year, discovery_method,
            orbital_period, planet_radius, planet_mass, distance_ly,
            star_temp, last_updated
        )
        VALUES %s
        ON CONFLICT (pl_name) DO UPDATE SET
            hostname         = EXCLUDED.hostname,
            discovery_year   = EXCLUDED.discovery_year,
            discovery_method = EXCLUDED.discovery_method,
            orbital_period   = EXCLUDED.orbital_period,
            planet_radius    = EXCLUDED.planet_radius,
            planet_mass      = EXCLUDED.planet_mass,
            distance_ly      = EXCLUDED.distance_ly,
            star_temp        = EXCLUDED.star_temp,
            last_updated     = EXCLUDED.last_updated;
    """

    with conn.cursor() as cur:
        execute_values(cur, upsert_sql, cleaned)
        conn.commit()

    log.info("Upserted %d rows into exoplanets table.", len(cleaned))
    return len(cleaned)


def log_fetch(conn, rows_fetched, status, error_message=None):
    """
    Log the fetch operation in the fetch_log table.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO fetch_log (fetched_at, rows_fetched, status, error_message)
            VALUES (%s, %s, %s, %s)
            """,
            (datetime.now(timezone.utc), rows_fetched, status, error_message),
        )
        conn.commit()


# ================================== Main =============================================

def main():
    if not DB_CONFIG["user"] or not DB_CONFIG["password"]:
        log.error("DB_USER and DB_PASSWORD must be set (env vars or .env file).")
        sys.exit(1)
 
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
    except psycopg2.OperationalError as e:
        log.error("Could not connect to database: %s", e)
        sys.exit(1)
 
    try:
        raw_rows = fetch_exoplanet_data()
        rows_written = upsert_exoplanets(conn, raw_rows)
        log_fetch(conn, rows_written, status="success")
        log.info("Ingestion complete: %d rows written.", rows_written)
 
    except requests.RequestException as e:
        log.error("Request to NASA Exoplanet Archive failed: %s", e)
        log_fetch(conn, 0, status="failed", error_message=str(e))
        sys.exit(1)
 
    except psycopg2.Error as e:
        log.error("Database error during ingestion: %s", e)
        conn.rollback()
        log_fetch(conn, 0, status="failed", error_message=str(e))
        sys.exit(1)
 
    finally:
        if conn:
            conn.close()
 
 
if __name__ == "__main__":
    main()