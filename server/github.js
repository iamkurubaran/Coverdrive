// GitHub REST client with an in-memory TTL cache.
// Set GITHUB_TOKEN in the environment to lift the unauthenticated
// 60 req/hr limit to 5,000 req/hr.

const API = "https://api.github.com";
const TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000); // 10 min
const MAX_CACHE_ENTRIES = 500;

const cache = new Map(); // key -> { at, data }

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Evict the oldest entry.
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), data });
}

function headers() {
  const h = {
    Accept: "application/vnd.github+json",
    "User-Agent": "coverdrive-app",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function gh(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${API}${path}${qs ? `?${qs}` : ""}`;

  const cached = cacheGet(url);
  if (cached) return cached;

  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) {
    const err = new Error("NOT_FOUND");
    err.code = 404;
    throw err;
  }
  if (res.status === 403 || res.status === 429) {
    const err = new Error("RATE_LIMITED");
    err.code = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(`GITHUB_${res.status}`);
    err.code = 502;
    throw err;
  }

  const data = await res.json();
  cacheSet(url, data);
  return data;
}

export async function fetchProfile(username) {
  const user = await gh(`/users/${encodeURIComponent(username)}`);

  let repos = [];
  try {
    repos = await gh(`/users/${encodeURIComponent(username)}/repos`, {
      per_page: 100,
      sort: "pushed",
      type: "owner",
    });
  } catch {
    repos = [];
  }

  let events = [];
  try {
    events = await gh(`/users/${encodeURIComponent(username)}/events/public`, {
      per_page: 100,
    });
  } catch {
    events = [];
  }

  return { user, repos, events };
}

export function cacheStats() {
  return { entries: cache.size, ttlMs: TTL_MS };
}
