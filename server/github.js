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

// ---------------------------------------------------------------------------
// Contribution calendar (the green heatmap). GitHub serves it as public HTML
// at github.com/users/:u/contributions — no token required. We parse the
// day cells (date + level) and their tooltips (exact counts) and return a
// week-bucketed grid the client can render. Failures return null; the
// heatmap simply doesn't show.

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}

export async function fetchContributions(username) {
  const key = `contrib:${username.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://github.com/users/${encodeURIComponent(username)}/contributions`,
      { headers: { "User-Agent": "coverdrive-app", Accept: "text/html" } }
    );
    if (!res.ok) return null;
    const html = await res.text();

    const days = [];
    const byId = new Map();
    const tdRe = /<td[^>]*ContributionCalendar-day[^>]*>/g;
    let m;
    while ((m = tdRe.exec(html))) {
      const tag = m[0];
      const date = attr(tag, "data-date");
      if (!date) continue;
      const day = { date, level: Number(attr(tag, "data-level") || 0), count: 0 };
      days.push(day);
      const id = attr(tag, "id");
      if (id) byId.set(id, day);
    }
    if (!days.length) return null;

    // Exact counts live in <tool-tip for="cell-id">N contributions on …</tool-tip>
    const tipRe = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
    let sawCounts = false;
    while ((m = tipRe.exec(html))) {
      const day = byId.get(m[1]);
      if (!day) continue;
      const n = m[2].match(/^([\d,]+)\s+contribution/i);
      if (n) {
        day.count = Number(n[1].replace(/,/g, ""));
        sawCounts = true;
      }
    }
    // Markup drift fallback: estimate counts from the 0–4 intensity level.
    if (!sawCounts) {
      const est = [0, 2, 5, 9, 14];
      for (const d of days) d.count = est[d.level] || 0;
    }

    days.sort((a, b) => (a.date < b.date ? -1 : 1));
    const total = days.reduce((s, d) => s + d.count, 0);

    // Bucket into GitHub-style week columns (Sunday-first).
    const weeks = [];
    let week = new Array(new Date(`${days[0].date}T00:00:00Z`).getUTCDay()).fill(null);
    for (const d of days) {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) weeks.push(week);

    const result = { total, weeks, estimated: !sawCounts };
    cacheSet(key, result);
    return result;
  } catch {
    return null;
  }
}

export function cacheStats() {
  return { entries: cache.size, ttlMs: TTL_MS };
}
