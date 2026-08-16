import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">
        {payload[0].value.toLocaleString()}
      </div>
    </div>
  );
}

export function DiscoveriesByYearChart({ data }) {
  return (
    <div className="panel">
      <div className="panel-eyebrow">Log · Discoveries over time</div>
      <h3 className="panel-title">Confirmed Planets by Year</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#232d47" vertical={false} />
          <XAxis
            dataKey="discovery_year"
            stroke="#8792ab"
            fontSize={12}
            fontFamily="IBM Plex Mono"
            tickLine={false}
          />
          <YAxis stroke="#8792ab" fontSize={12} fontFamily="IBM Plex Mono" tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#e1613d"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#e1613d" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DiscoveryMethodsChart({ data }) {
  const top = data.slice(0, 6);
  return (
    <div className="panel">
      <div className="panel-eyebrow">Log · How we find them</div>
      <h3 className="panel-title">Discovery Methods</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
        >
          <CartesianGrid stroke="#232d47" horizontal={false} />
          <XAxis type="number" stroke="#8792ab" fontSize={12} fontFamily="IBM Plex Mono" tickLine={false} />
          <YAxis
            type="category"
            dataKey="discovery_method"
            stroke="#8792ab"
            fontSize={11}
            fontFamily="IBM Plex Mono"
            width={140}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="count" fill="#5fc9d6" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}