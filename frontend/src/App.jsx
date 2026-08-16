import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import StarMap from "./components/StarMap.jsx";
import { DiscoveriesByYearChart, DiscoveryMethodsChart } from "./components/StatsCharts.jsx";
import PlanetTable from "./components/PlanetTable.jsx";
import { fetchExoplanets, fetchExoplanetSample, fetchDiscoveriesByYear, fetchDiscoveryMethods } from "./api.js";

export default function App() {
  // Data for the star map + method filter dropdown — a broad sample,
  // fetched once, independent of the table's pagination.
  const [mapPlanets, setMapPlanets] = useState([]);
  const [methods, setMethods] = useState([]);

  // Stats chart data
  const [byYear, setByYear] = useState([]);
  const [byMethod, setByMethod] = useState([]);

  // Table state
  const [tablePlanets, setTablePlanets] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("discovery_year");
  const [order, setOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const [error, setError] = useState(null);

  // One-time load: star map sample + stats + method list
  useEffect(() => {
    async function loadOnce() {
      try {
        const [mapData, yearStats, methodStats] = await Promise.all([
          fetchExoplanetSample(400),
          fetchDiscoveriesByYear(),
          fetchDiscoveryMethods(),
        ]);
        setMapPlanets(mapData);
        setByYear(yearStats);
        setByMethod(methodStats);
        setMethods(methodStats.map((m) => m.discovery_method));
      } catch (err) {
        setError(
          "Couldn't reach the API. Make sure the backend server is running on port 3001."
        );
      }
    }
    loadOnce();
  }, []);

  // Reload table whenever page/sort/filter changes
  const loadTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = {
        page,
        pageSize: 20,
        sortBy,
        order,
      };
      if (methodFilter) params.discoveryMethod = methodFilter;

      const result = await fetchExoplanets(params);

      // Client-side name search on top of the server-paginated page —
      // simplest option here since the API doesn't have a name-search
      // param yet; fine for a portfolio dashboard at this data size.
      const filtered = search
        ? result.data.filter((p) =>
            p.pl_name.toLowerCase().includes(search.toLowerCase())
          )
        : result.data;

      setTablePlanets(filtered);
      setTotalPages(result.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError(
        "Couldn't reach the API. Make sure the backend server is running on port 3001."
      );
    } finally {
      setTableLoading(false);
    }
  }, [page, sortBy, order, methodFilter, search]);

  useEffect(() => {
    loadTable();
  }, [loadTable]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [sortBy, order, methodFilter, search]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-eyebrow">NASA Exoplanet Archive · Live Catalog</div>
        <h1 className="topbar-title">Exoplanet Atlas</h1>
        <p className="topbar-sub">
          A field log of confirmed worlds beyond our solar system, refreshed
          from NASA's Exoplanet Archive.
        </p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="hero-section">
        <div className="panel-eyebrow">Field log · Sky position by discovery</div>
        <h2 className="panel-title-large">The Sky, By the Numbers</h2>
        <p className="hero-caption">
          Each point is a confirmed exoplanet. Position: discovery year
          (horizontal) and distance from Earth (vertical, log scale). Size:
          planet radius. Color: how it was found.
        </p>
        <StarMap planets={mapPlanets} />
        <div className="starmap-legend">
          {["Transit", "Radial Velocity", "Direct Imaging", "Microlensing"].map(
            (m) => (
              <span key={m} className="legend-item">
                <span className={`legend-dot legend-dot-${m.replace(/\s/g, "")}`} />
                {m}
              </span>
            )
          )}
        </div>
      </section>

      <section className="stats-section">
        <DiscoveriesByYearChart data={byYear} />
        <DiscoveryMethodsChart data={byMethod} />
      </section>

      <section className="catalog-section">
        <div className="panel-eyebrow">Catalog · Full record</div>
        <h2 className="panel-title-large">Browse the Catalog</h2>
        <PlanetTable
          planets={tablePlanets}
          loading={tableLoading}
          sortBy={sortBy}
          order={order}
          onSortChange={(newSort, newOrder) => {
            setSortBy(newSort);
            setOrder(newOrder);
          }}
          search={search}
          onSearchChange={setSearch}
          methodFilter={methodFilter}
          onMethodFilterChange={setMethodFilter}
          methods={methods}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </section>

      <footer className="footer">
        <div>
          Data sourced from the{" "}
          <a href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noreferrer">
            NASA Exoplanet Archive
          </a>
          .
        </div>
        <div className="footer-credit">Developed by N. Connor Whitaker</div>
      </footer>
    </div>
  );
}