// db.js
// Central Postgres connection pool, shared across all routes.
// Using a pool (not a single client) lets Express handle concurrent
// requests without each one blocking on a single DB connection.

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "exoplanets",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on("error", (err) => {
  // Catches errors on idle clients in the pool (e.g. DB connection dropped)
  // so they don't crash the whole server.
  console.error("Unexpected error on idle Postgres client", err);
});

module.exports = pool;