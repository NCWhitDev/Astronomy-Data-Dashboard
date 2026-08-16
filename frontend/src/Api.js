const API_BASE = "http://localhost:3001";

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function fetchExoplanets(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/exoplanets${query ? `?${query}` : ""}`);
}

export function fetchExoplanetSample(limit = 300) {
  return request(`/api/exoplanets/sample?limit=${limit}`);
}

export function fetchDiscoveriesByYear() {
  return request("/api/stats/discoveries-by-year");
}

export function fetchDiscoveryMethods() {
  return request("/api/stats/discovery-methods");
}