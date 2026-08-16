// routes/exoplanets.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

// Columns we allow sorting/filtering on. Whitelisting these prevents
// SQL injection via query params (we never interpolate raw column
// names from the request directly into the query).
const SORTABLE_COLUMNS = new Set([
  "pl_name",
  "hostname",
  "discovery_year",
  "discovery_method",
  "orbital_period",
  "planet_radius",
  "planet_mass",
  "distance_ly",
  "star_temp",
]);

/**
 * GET /api/exoplanets
 * Paginated, filterable, sortable list of exoplanets.
 *
 * Query params (all optional):
 *   page            default 1
 *   pageSize        default 25, max 100
 *   minRadius       filter: planet_radius >= value
 *   maxRadius       filter: planet_radius <= value
 *   discoveryMethod filter: exact match on discovery_method
 *   sortBy          one of SORTABLE_COLUMNS, default discovery_year
 *   order           "asc" or "desc", default desc
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize) || 25, 100);
    const offset = (page - 1) * pageSize;

    const conditions = [];
    const values = [];
    
    if (req.query.minRadius !== undefined) {
      values.push(req.query.minRadius);
      conditions.push(`planet_radius >= $${values.length}`);
    }
    if (req.query.maxRadius !== undefined) {
      values.push(req.query.maxRadius);
      conditions.push(`planet_radius <= $${values.length}`);
    }
    if (req.query.discoveryMethod) {
      values.push(req.query.discoveryMethod);
      conditions.push(`discovery_method = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // Validate sortBy/order against whitelists rather than trusting
    // the client directly - this is the standard way to allow
    // dynamic sorting without opening up SQL injection.
    const sortBy = SORTABLE_COLUMNS.has(req.query.sortBy)
      ? req.query.sortBy
      : "discovery_year";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    values.push(pageSize, offset);
    const limitPlaceholder = `$${values.length - 1}`;
    const offsetPlaceholder = `$${values.length}`;

    const dataQuery = `
      SELECT id, pl_name, hostname, discovery_year, discovery_method,
             orbital_period, planet_radius, planet_mass, distance_ly,
             star_temp, last_updated
      FROM exoplanets
      ${whereClause}
      ORDER BY ${sortBy} ${order} NULLS LAST
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM exoplanets
      ${whereClause}
    `;

    // Count query uses the same WHERE values but not the limit/offset
    // ones we appended, so we slice those off for this call.
    const countValues = values.slice(0, values.length - 2);

    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, values),
      pool.query(countQuery, countValues),
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Error fetching exoplanets:", err);
    res.status(500).json({ error: "Failed to fetch exoplanets" });
  }
});

/**
 * GET /api/exoplanets/:id
 * Single planet by numeric id.
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM exoplanets WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Exoplanet not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching exoplanet by id:", err);
    res.status(500).json({ error: "Failed to fetch exoplanet" });
  }
});

module.exports = router;