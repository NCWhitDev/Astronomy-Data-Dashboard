Source: https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html

# Exoplanet Atlas

A full-stack dashboard that ingests live exoplanet data from NASA's public Exoplanet Archive, stores it in PostgreSQL, and serves it through a custom REST API to an interactive React frontend including a custom-built star map visualization of every confirmed planet's discovery year, distance from Earth, and radius.

**Live data. Real astronomy. Built from scratch.**

---

## Overview

Exoplanet Atlas pulls data from [NASA's Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/), normalizes and stores it in PostgreSQL, and exposes it through a REST API with filtering, sorting, and pagination. The React frontend visualizes the full dataset 6,000+ confirmed exoplanets through a custom scatter-plot "star map," aggregate statistics charts, and a searchable, sortable catalog table.

The design is themed around a real observatory convention: astronomers use dim red light at night to protect their eyes' dark adaptation, which is where the dashboard's accent color comes from.

## Architecture

```
NASA Exoplanet Archive (TAP API)
        │
        ▼
Python ingestion script  ──►  PostgreSQL (Docker)
                                    │
                                    ▼
                          Node/Express REST API
                                    │
                                    ▼
                          React + Vite frontend
```

## Features

- **Automated data ingestion** — pulls exoplanet records from NASA's public TAP API and upserts them into PostgreSQL, with run logging for observability
- **REST API** — endpoints for paginated/filtered/sorted planet listings, single-planet lookups, a random sample endpoint, and aggregate statistics
- **Interactive star map** — a custom SVG visualization plotting every planet by discovery year, distance from Earth (log scale), radius, and discovery method
- **Aggregate charts** — discoveries over time and a breakdown by discovery method, built with Recharts
- **Searchable catalog** — full data table with name search, discovery-method filtering, column sorting, and pagination

## Tech Stack

| Layer | Technology |
|---|---|
| Data ingestion | Python, `requests`, `psycopg2` |
| Database | PostgreSQL (via Docker) |
| API | Node.js, Express, `pg` |
| Frontend | React, Vite, Recharts |
| Data source | [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/) (TAP service) |

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) with `pip`

### 1. Start the database

```bash
docker run --name exoplanet-db \
  -e POSTGRES_USER=<your_db_user> \
  -e POSTGRES_PASSWORD=<your_db_pass \
  -e POSTGRES_DB=exoplanets \
  -p 5432:5432 \
  -d postgres

docker cp schema.sql exoplanet-db:/schema.sql
docker exec -i exoplanet-db psql -U devuser -d exoplanets -f /schema.sql
```

### 2. Run the ingestion pipeline

```bash
pip install requests psycopg2-binary

export DB_USER=devuser
export DB_PASSWORD=devpass
export DB_NAME=exoplanets

python fetch_and_load_exoplanets.py
```

*(On Windows PowerShell, use `$env:DB_USER="devuser"` instead of `export`.)*

### 3. Start the API

```bash
cd api
npm install
cp .env.example .env   # fill in your DB credentials
node server.js
```

API runs at `http://localhost:3001`.

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`.

## API Reference

| Endpoint | Description |
|---|---|
| `GET /api/exoplanets` | Paginated list — supports `page`, `pageSize`, `minRadius`, `maxRadius`, `discoveryMethod`, `sortBy`, `order` |
| `GET /api/exoplanets/sample` | Random sample across the full dataset (`limit`) — used by the star map |
| `GET /api/exoplanets/:id` | Single planet by ID |
| `GET /api/stats/discoveries-by-year` | Discovery counts grouped by year |
| `GET /api/stats/discovery-methods` | Discovery counts grouped by method |
| `GET /health` | Database connectivity check |

## Design Notes

- **SQL injection protection**: sort columns are validated against a whitelist; all filter values are parameterized.
- **Postgres `BIGINT` handling**: aggregate `COUNT(*)` queries are explicitly cast to `::int`, since Node's `pg` driver returns `BIGINT` as a string by default.
- **Representative sampling**: the star map pulls a true random sample (`ORDER BY RANDOM()`) rather than the most recent page, so the full year/distance range is represented.

## Project Structure

```
.
├── fetch_and_load_exoplanets.py   # ingestion script
├── schema.sql                      # database schema
├── api/                             # Express REST API
│   ├── server.js
│   ├── db.js
│   └── routes/
│       ├── exoplanets.js
│       └── stats.js
└── frontend/                        # React dashboard
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
            ├── StarMap.jsx
            ├── StatsCharts.jsx
            └── PlanetTable.jsx
```

## Data Source

All exoplanet data is sourced from the [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/), operated by Caltech under contract with NASA.

## Author

Developed by N. Connor Whitaker
