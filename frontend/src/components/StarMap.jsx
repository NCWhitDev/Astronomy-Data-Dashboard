import React, { useMemo, useState } from "react";

// Discovery methods get distinct colors so the star field also reads
// as a legend of "how we found this world."
const METHOD_COLORS = {
  Transit: "#e1613d",
  "Radial Velocity": "#5fc9d6",
  "Direct Imaging": "#d9a441",
  Microlensing: "#8792ab",
  "Transit Timing Variations": "#c77dff",
};

function colorForMethod(method) {
  return METHOD_COLORS[method] || "#6a7593";
}

/**
 * StarMap — the dashboard's signature element.
 * Plots real exoplanets as a night sky: x = discovery year,
 * y = distance from Earth (log scale, so nearby and far planets are
 * both readable), point size = planet radius, color = discovery
 * method. This is real data, not decoration.
 */
export default function StarMap({ planets }) {
  const [hovered, setHovered] = useState(null);

  const { points, yearRange } = useMemo(() => {
    const usable = planets.filter(
      (p) => p.discovery_year && p.distance_ly && p.distance_ly > 0
    );
    if (usable.length === 0) return { points: [], yearRange: [2000, 2026] };

    const years = usable.map((p) => p.discovery_year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    const logDistances = usable.map((p) => Math.log10(p.distance_ly));
    const minLog = Math.min(...logDistances);
    const maxLog = Math.max(...logDistances);

    const pts = usable.map((p) => {
      const xPct = (p.discovery_year - minYear) / (maxYear - minYear || 1);
      const logD = Math.log10(p.distance_ly);
      // Invert y so closer planets sit lower, farther sit higher —
      // reads like looking deeper into the sky.
      const yPct = 1 - (logD - minLog) / (maxLog - minLog || 1);
      const radius = p.planet_radius ? Math.min(p.planet_radius, 15) : 1;

      return {
        ...p,
        xPct,
        yPct,
        r: 1.5 + Math.sqrt(radius) * 1.3,
        color: colorForMethod(p.discovery_method),
      };
    });

    return { points: pts, yearRange: [minYear, maxYear] };
  }, [planets]);

  const width = 1000;
  const height = 420;
  const padding = 40;

  return (
    <div className="starmap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Star map of exoplanets plotted by discovery year and distance from Earth"
        className="starmap-svg"
      >
        {points.map((p, i) => {
          const cx = padding + p.xPct * (width - padding * 2);
          const cy = padding + p.yPct * (height - padding * 2);
          const isHovered = hovered === p.id;
          return (
            <circle
              key={p.id ?? i}
              cx={cx}
              cy={cy}
              r={isHovered ? p.r * 1.6 : p.r}
              fill={p.color}
              opacity={isHovered ? 1 : 0.75}
              className="starmap-point"
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              tabIndex={0}
              onFocus={() => setHovered(p.id)}
              onBlur={() => setHovered(null)}
            >
              <title>{`${p.pl_name} — discovered ${p.discovery_year}, ${Math.round(p.distance_ly)} ly away`}</title>
            </circle>
          );
        })}
      </svg>

      <div className="starmap-axis-labels">
        <span>{yearRange[0]}</span>
        <span className="starmap-axis-caption">discovery year →</span>
        <span>{yearRange[1]}</span>
      </div>

      {hovered && (
        <div className="starmap-card">
          {(() => {
            const p = points.find((pt) => pt.id === hovered);
            if (!p) return null;
            return (
              <>
                <div className="starmap-card-name">{p.pl_name}</div>
                <div className="starmap-card-row">
                  <span>Host star</span>
                  <span>{p.hostname || "—"}</span>
                </div>
                <div className="starmap-card-row">
                  <span>Discovered</span>
                  <span>
                    {p.discovery_year} · {p.discovery_method}
                  </span>
                </div>
                <div className="starmap-card-row">
                  <span>Distance</span>
                  <span>{Math.round(p.distance_ly).toLocaleString()} ly</span>
                </div>
                <div className="starmap-card-row">
                  <span>Radius</span>
                  <span>
                    {p.planet_radius
                      ? `${p.planet_radius.toFixed(2)} × Earth`
                      : "unknown"}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}