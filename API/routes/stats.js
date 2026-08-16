// routes/stats.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

/**
 * GET /api/stats/discoveries-by-year
 * Count of discoveries per year - feeds a line/bar chart of
 * discoveries over time.
 */
router.get("/discoveries-by-year", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT discovery_year, COUNT(*)::int AS count
      FROM exoplanets
      WHERE discovery_year IS NOT NULL
      GROUP BY discovery_year
      ORDER BY discovery_year ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching discoveries-by-year stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

/**
 * GET /api/stats/discovery-methods
 * Count of planets per discovery method - feeds a pie/bar chart
 * breakdown.
 */
router.get("/discovery-methods", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT discovery_method, COUNT(*)::int AS count
      FROM exoplanets
      WHERE discovery_method IS NOT NULL
      GROUP BY discovery_method
      ORDER BY count DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching discovery-methods stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;