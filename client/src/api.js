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

export function fetchCard(username) {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) return Promise.reject(new Error("Enter a GitHub username."));
  return get(`/api/card/${encodeURIComponent(clean)}`);
}

export function fetchStats() {
  return get("/api/stats");
}

export function avatarProxyUrl(avatarUrl) {
  return `${BASE}/api/avatar?url=${encodeURIComponent(avatarUrl)}`;
}
