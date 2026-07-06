// Thin client for the Coverdrive Node server. All GitHub calls and the
// rating engine live server-side (cached + optionally token-authenticated),
// so the browser never touches GitHub's rate limits directly.

const BASE = import.meta.env.VITE_API_BASE || "";

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* fall through */
  }
  if (!res.ok) {
    throw new Error(body?.error || "Couldn't reach the scoreboard. Try again.");
  }
  return body;
}

// Session cache so navigating home → /player/:u doesn't refetch.
const cardCache = new Map(); // usernameLower -> { at, card }
const CARD_TTL = 5 * 60 * 1000;

export async function fetchCard(username) {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) throw new Error("Enter a GitHub username.");
  const key = clean.toLowerCase();
  const hit = cardCache.get(key);
  if (hit && Date.now() - hit.at < CARD_TTL) return hit.card;
  const card = await get(`/api/card/${encodeURIComponent(clean)}`);
  cardCache.set(key, { at: Date.now(), card });
  return card;
}

export function fetchStats() {
  return get("/api/stats");
}

export function avatarProxyUrl(avatarUrl) {
  return `${BASE}/api/avatar?url=${encodeURIComponent(avatarUrl)}`;
}
