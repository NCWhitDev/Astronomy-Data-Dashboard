// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const exoplanetsRouter = require("./routes/exoplanets");
const statsRouter = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Simple request logger - handy while developing so you can see
// every request hit the terminal in real time.
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "astronomy-dashboard-api" });
});

app.get("/health", async (req, res) => {
  const pool = require("./db");
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

app.use("/api/exoplanets", exoplanetsRouter);
app.use("/api/stats", statsRouter);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler - catches anything that slips past
// individual route try/catch blocks.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});