// Coverdrive Chrome extension popup.
// Thin vanilla-JS port of the client (App.jsx + PlayerCard.tsx): search a
// GitHub username, render the shield card from the Coverdrive server's
// /api/card response, and deep-link to the full report on the deployed app.

const BASE = "https://gitcoverdrive.onrender.com";
const SUGGESTED = ["torvalds", "sindresorhus", "gaearon"];
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const CARD_TTL = 5 * 60 * 1000;

// github.com/<segment> paths that are never user profiles.
const GITHUB_RESERVED = new Set([
  "about", "collections", "codespaces", "contact", "customer-stories",
  "enterprise", "events", "explore", "features", "issues", "join", "login",
  "logout", "marketplace", "new", "notifications", "orgs", "pricing", "pulls",
  "readme", "search", "security", "sessions", "settings", "signup", "sponsors",
  "topics", "trending",
]);

const $ = (id) => document.getElementById(id);

const els = {
  viewSearch: $("view-search"),
  viewCard: $("view-card"),
  form: $("search-form"),
  input: $("username"),
  scoutBtn: $("scout-btn"),
  tabChip: $("tab-chip"),
  suggested: $("suggested"),
  error: $("error"),
  empty: $("empty"),
  umpire: $("umpire"),
  counter: $("counter"),
  counterNum: $("counter-num"),
  backBtn: $("back-btn"),
  cardMount: $("card-mount"),
  trait: $("trait"),
  traitTag: $("trait-tag"),
  traitNote: $("trait-note"),
  reportLink: $("report-link"),
  copyBtn: $("copy-btn"),
};

// ---- Server client (mirrors client/src/api.js) -------------------------------

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
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

// Card cache in extension storage, same 5-minute TTL as the client's
// session cache — reopening the popup shouldn't refetch.
async function fetchCard(username) {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) throw new Error("Enter a GitHub username.");
  if (!USERNAME_RE.test(clean)) throw new Error("Enter a valid GitHub username.");
  const key = `card:${clean.toLowerCase()}`;
  const store = globalThis.chrome?.storage?.local;
  if (store) {
    const hit = (await store.get(key))[key];
    if (hit && Date.now() - hit.at < CARD_TTL) return hit.card;
  }
  const card = await get(`/api/card/${encodeURIComponent(clean)}`);
  if (store) store.set({ [key]: { at: Date.now(), card } });
  return card;
}

const avatarProxyUrl = (url) => `${BASE}/api/avatar?url=${encodeURIComponent(url)}`;
const playerUrl = (username) => `${BASE}/player/${encodeURIComponent(username)}`;

// ---- Shield card (ported from client/src/PlayerCard.tsx) ----------------------

const SHIELD =
  "M0.075 0.03 L0.925 0.03 C0.955 0.03 0.968 0.048 0.968 0.078 " +
  "L0.968 0.52 C0.968 0.67 0.905 0.782 0.752 0.876 " +
  "C0.664 0.93 0.577 0.962 0.5 0.978 " +
  "C0.423 0.962 0.336 0.93 0.248 0.876 " +
  "C0.095 0.782 0.032 0.67 0.032 0.52 " +
  "L0.032 0.078 C0.032 0.048 0.045 0.03 0.075 0.03 Z";

const FACE_TRANSFORM = "translate(0.5 0.5) scale(0.9815 0.9865) translate(-0.5 -0.5)";
const LEFT = ["BAT", "BWL", "FLD"];
const RIGHT = ["TEC", "EXP", "STA"];

// "#rrggbb" mixed toward another hex by t (0..1).
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sa, sb) => Math.round(sa + (sb - sa) * t);
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function svgEl(tag, attrs = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function buildFrame(tier) {
  const svg = svgEl("svg", {
    class: "cdc-frame",
    viewBox: "0 0 1 1",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
  });
  const defs = svgEl("defs");

  const trim = svgEl("linearGradient", { id: "cdc-trim", x1: 0, y1: 0, x2: 0, y2: 1 });
  for (const [offset, color] of [
    [0, mix(tier.glow, "#ffffff", 0.35)],
    [0.3, tier.accent],
    [0.72, mix(tier.accent, "#000000", 0.45)],
    [1, mix(tier.glow, "#000000", 0.25)],
  ]) {
    trim.appendChild(svgEl("stop", { offset, "stop-color": color }));
  }

  const face = svgEl("linearGradient", { id: "cdc-face", x1: 0, y1: 0, x2: 0, y2: 1 });
  for (const [offset, color] of [[0, "#1d2028"], [0.45, "#13151b"], [1, "#0a0b0f"]]) {
    face.appendChild(svgEl("stop", { offset, "stop-color": color }));
  }

  const tint = svgEl("radialGradient", { id: "cdc-tint", cx: 0.5, cy: 0, r: 0.75 });
  tint.appendChild(svgEl("stop", { offset: 0, "stop-color": tier.accent, "stop-opacity": 0.26 }));
  tint.appendChild(svgEl("stop", { offset: 1, "stop-color": tier.accent, "stop-opacity": 0 }));

  const clip = svgEl("clipPath", { id: "cdc-clip", clipPathUnits: "objectBoundingBox" });
  clip.appendChild(svgEl("path", { d: SHIELD, transform: FACE_TRANSFORM }));

  defs.append(trim, face, tint, clip);
  svg.appendChild(defs);
  svg.appendChild(svgEl("path", { d: SHIELD, fill: "url(#cdc-trim)" }));
  svg.appendChild(svgEl("path", { d: SHIELD, transform: FACE_TRANSFORM, fill: "url(#cdc-face)" }));
  svg.appendChild(svgEl("path", { d: SHIELD, transform: FACE_TRANSFORM, fill: "url(#cdc-tint)" }));
  return svg;
}

function renderCard(card) {
  const scene = el("div", "cdc-scene");
  const root = el("div", "cdc");
  root.style.setProperty("--accent", card.tier.accent);
  root.style.setProperty("--glow", card.tier.glow);

  root.appendChild(buildFrame(card.tier));

  const inner = el("div", "cdc-inner");
  inner.style.clipPath = "url(#cdc-clip)";

  const crest = el("div", "cdc-crest");
  crest.appendChild(el("span", "cdc-crest-stars", "★ ★ ★"));

  const top = el("div", "cdc-top");
  const id = el("div", "cdc-id");
  const ovr = el("span", "cdc-ovr", "0");
  const flag = el("span", "cdc-flag", card.country?.flag || "🌍");
  if (card.location) flag.title = card.location;
  id.append(ovr, el("span", "cdc-pos", card.role.abbr), flag, el("span", "cdc-lang", card.topLanguage));

  const portrait = el("div", "cdc-portrait");
  const img = document.createElement("img");
  img.src = avatarProxyUrl(card.avatar);
  img.alt = card.name;
  img.loading = "eager";
  portrait.appendChild(img);
  top.append(id, portrait);

  const surname = card.name.trim().split(/\s+/).slice(-1)[0].toUpperCase();

  const attrs = el("div", "cdc-attrs");
  const col = (keys) => {
    const c = el("div", "cdc-col");
    for (const k of keys) {
      const row = el("div", "cdc-attr");
      row.append(el("span", "cdc-num", String(card.attributes[k])), el("span", "cdc-key", k));
      c.appendChild(row);
    }
    return c;
  };
  attrs.append(col(LEFT), el("div", "cdc-divider"), col(RIGHT));

  const foot = el("div", "cdc-foot");
  foot.append(el("span", null, card.tier.name), el("span", "cdc-dot"), el("span", null, card.format));

  inner.append(crest, top, el("div", "cdc-name", surname), el("div", "cdc-rule"), attrs, foot);

  const holo = el("div", "cdc-holo");
  holo.style.clipPath = "url(#cdc-clip)";

  root.append(inner, holo);
  scene.appendChild(root);

  // Count the overall rating up, like the client card.
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    ovr.textContent = String(card.overall);
  } else {
    const start = performance.now();
    const dur = 900;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      ovr.textContent = String(Math.round(card.overall * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  return scene;
}

// ---- Views --------------------------------------------------------------------

let loading = false;

function setLoading(on) {
  loading = on;
  els.scoutBtn.disabled = on;
  els.scoutBtn.textContent = on ? "REVIEWING…" : "SCOUT";
  els.umpire.hidden = !on;
  els.empty.hidden = on;
}

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = !message;
}

function showSearchView() {
  els.viewCard.hidden = true;
  els.viewSearch.hidden = false;
  els.cardMount.replaceChildren();
  els.input.focus();
}

function showCardView(card) {
  els.viewSearch.hidden = true;
  els.viewCard.hidden = false;
  els.cardMount.replaceChildren(renderCard(card));

  if (card.trait) {
    els.traitTag.textContent = card.trait.tag;
    els.traitNote.textContent = card.trait.note;
    els.trait.hidden = false;
  } else {
    els.trait.hidden = true;
  }

  els.reportLink.href = playerUrl(card.username);
  els.copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(playerUrl(card.username));
      els.copyBtn.textContent = "COPIED ✓";
      setTimeout(() => (els.copyBtn.textContent = "COPY LINK"), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };
}

async function scout(name) {
  const target = (name ?? els.input.value).trim().replace(/^@/, "");
  if (!target || loading) return;
  setLoading(true);
  showError("");
  try {
    const card = await fetchCard(target);
    showCardView(card);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ---- Wire-up --------------------------------------------------------------------

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  scout();
});

els.backBtn.addEventListener("click", showSearchView);

for (const name of SUGGESTED) {
  const btn = el("button", null, name);
  btn.addEventListener("click", () => scout(name));
  els.suggested.appendChild(btn);
}
els.suggested.appendChild(el("span", "suggested-own", "· or your own"));

// Live "cards rated" counter.
get("/api/stats")
  .then((s) => {
    els.counterNum.textContent = Number(s.cardsRated).toLocaleString();
    els.counter.hidden = false;
  })
  .catch(() => {});

// If the active tab is a GitHub profile, offer a one-click scout.
async function detectGithubProfile() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab?.url || "");
    if (url.hostname !== "github.com") return;
    const seg = url.pathname.split("/").filter(Boolean);
    const user = seg[0];
    if (
      seg.length !== 1 ||
      !user ||
      GITHUB_RESERVED.has(user.toLowerCase()) ||
      !USERNAME_RE.test(user)
    ) {
      return;
    }
    els.tabChip.innerHTML = `Viewing <strong>@${user}</strong> on GitHub — scout this profile →`;
    els.tabChip.hidden = false;
    els.tabChip.addEventListener("click", () => scout(user));
    els.input.value = user;
  } catch {
    /* not a tab we can read, or not running as an extension */
  }
}

if (globalThis.chrome?.tabs) detectGithubProfile();

els.input.focus();
