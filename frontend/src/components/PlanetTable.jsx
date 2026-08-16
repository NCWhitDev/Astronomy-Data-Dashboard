import React from "react";

const COLUMNS = [
  { key: "pl_name", label: "Name" },
  { key: "hostname", label: "Host Star" },
  { key: "discovery_year", label: "Year" },
  { key: "discovery_method", label: "Method" },
  { key: "planet_radius", label: "Radius (⊕)" },
  { key: "distance_ly", label: "Distance (ly)" },
];

export default function PlanetTable({
  planets,
  loading,
  sortBy,
  order,
  onSortChange,
  search,
  onSearchChange,
  methodFilter,
  onMethodFilterChange,
  methods,
  page,
  totalPages,
  onPageChange,
}) {
  function handleHeaderClick(key) {
    if (sortBy === key) {
      onSortChange(key, order === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  }

  return (
    <div className="panel catalog">
      <div className="catalog-controls">
        <input
          type="text"
          placeholder="Search by planet name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="catalog-search"
          aria-label="Search planets by name"
        />
        <select
          value={methodFilter}
          onChange={(e) => onMethodFilterChange(e.target.value)}
          className="catalog-select"
          aria-label="Filter by discovery method"
        >
          <option value="">All discovery methods</option>
          {methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="catalog-table-wrap">
        <table className="catalog-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key}>
                  <button
                    className="catalog-sort-btn"
                    onClick={() => handleHeaderClick(col.key)}
                  >
                    {col.label}
                    {sortBy === col.key && (
                      <span className="catalog-sort-arrow">
                        {order === "asc" ? " ↑" : " ↓"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="catalog-empty">
                  Loading catalog…
                </td>
              </tr>
            ) : planets.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="catalog-empty">
                  No planets match this filter.
                </td>
              </tr>
            ) : (
              planets.map((p) => (
                <tr key={p.id}>
                  <td className="catalog-name">{p.pl_name}</td>
                  <td>{p.hostname || "—"}</td>
                  <td>{p.discovery_year || "—"}</td>
                  <td>{p.discovery_method || "—"}</td>
                  <td>{p.planet_radius ? p.planet_radius.toFixed(2) : "—"}</td>
                  <td>
                    {p.distance_ly ? Math.round(p.distance_ly).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="catalog-pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="catalog-page-btn"
        >
          ← Prev
        </button>
        <span className="catalog-page-status">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="catalog-page-btn"
        >
          Next →
        </button>
      </div>
    </div>
  );
}