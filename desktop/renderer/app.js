// Coverdrive desktop renderer — a dependency-free port of the web client
// (App.jsx + PlayerPage.jsx + PlayerCard.tsx + CareerTable.jsx). All data
// comes from the deployed Coverdrive server.

const BASE = "https://gitcoverdrive.onrender.com";
const SUGGESTED = ["torvalds", "sindresorhus", "gaearon"];
const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const CARD_TTL = 5 * 60 * 1000;

// macOS hides the native title bar (hiddenInset), so pad for traffic lights.
if (globalThis.coverdrive?.platform === "darwin") {
  document.body.classList.add("mac");
}

const $ = (id) => document.getElementById(id);

const els = {
  viewHome: $("view-home"),
  viewReport: $("view-report"),
  form: $("search-form"),
  input: $("username"),
  scoutBtn: $("scout-btn"),
  suggested: $("suggested"),
  error: $("error"),
  empty: $("empty"),
  umpire: $("umpire"),
  counter: $("counter"),
  counterNum: $("counter-num"),
  backBtn: $("back-btn"),
  brandBtn: $("brand-btn"),
  report: $("report"),
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

const cardCache = new Map(); // usernameLower -> { at, card }

async function fetchCard(username) {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) throw new Error("Enter a GitHub username.");
  if (!USERNAME_RE.test(clean)) throw new Error("Enter a valid GitHub username.");
  const key = clean.toLowerCase();
  const hit = cardCache.get(key);
  if (hit && Date.now() - hit.at < CARD_TTL) return hit.card;
  const card = await get(`/api/card/${encodeURIComponent(clean)}`);
  cardCache.set(key, { at: Date.now(), card });
  return card;
}

const avatarProxyUrl = (url) => `${BASE}/api/avatar?url=${encodeURIComponent(url)}`;
const playerUrl = (username) => `${BASE}/player/${encodeURIComponent(username)}`;

// ---- DOM helpers ---------------------------------------------------------------

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

const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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

  // 3D tilt toward the pointer, like the web card.
  if (!reduceMotion) {
    root.addEventListener("pointermove", (e) => {
      const r = root.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      root.style.setProperty("--rx", `${(0.5 - py) * 9}deg`);
      root.style.setProperty("--ry", `${(px - 0.5) * 11}deg`);
      root.style.setProperty("--mx", `${px * 100}%`);
      root.style.setProperty("--my", `${py * 100}%`);
    });
    const reset = () => {
      root.style.setProperty("--rx", "0deg");
      root.style.setProperty("--ry", "0deg");
      root.style.setProperty("--mx", "50%");
      root.style.setProperty("--my", "18%");
    };
    root.addEventListener("pointerleave", reset);
    root.addEventListener("pointercancel", reset);
  }

  // Count the overall rating up on mount.
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

// ---- Report panels (ported from client/src/PlayerPage.jsx) --------------------

function panel(title) {
  const section = el("section", "panel");
  const head = el("div", "panel-title");
  head.append(el("span", "tick"), document.createTextNode(title));
  section.appendChild(head);
  return section;
}

function scoutHeader(card) {
  const head = el("div", "scout-head");
  head.appendChild(el("div", "scout-kicker", "SCOUT REPORT"));
  head.appendChild(el("h2", "scout-name selectable", card.name));

  const line = el("div", "scout-line");
  const piece = (text, cls) => el("span", cls || null, text);
  const sep = () => piece("·", "sep");
  line.append(
    piece(`@${card.username}`),
    sep(),
    piece(card.role.name),
    sep(),
    piece(card.tier.name, "gold"),
    sep(),
    piece(card.topLanguage)
  );
  head.appendChild(line);

  if (card.trait) {
    head.appendChild(el("span", "trait-tag", card.trait.tag));
    head.appendChild(el("p", "trait-note", card.trait.note));
  }
  return head;
}

function starsSpan(n) {
  const span = el("span", "stars");
  span.appendChild(document.createTextNode("★".repeat(n)));
  const off = el("span", "off", "★".repeat(5 - n));
  span.appendChild(off);
  return span;
}

function attributesPanel(card) {
  const section = panel("Attributes");
  const rows = el("div", "attr-rows");
  const row = (label, valueNode) => {
    const r = el("div", "attr-row");
    r.appendChild(el("span", "label", label));
    r.appendChild(valueNode);
    return r;
  };
  rows.append(
    row("Shot range", starsSpan(card.shotRange)),
    row("Reverse sweep", starsSpan(card.reverseSweep)),
    row("Work rate (bat / field)", el("strong", "mono-val", card.workRate)),
    row("Style", el("strong", "mono-val", card.style))
  );
  section.appendChild(rows);
  return section;
}

const PS_ICONS = {
  users: "◎",
  star: "★",
  flame: "✶",
  infinity: "∞",
  forward: "»",
  clock: "◷",
  bolt: "↯",
  globe: "⬡",
};

function playstylesPanel(card) {
  const section = panel("Playstyles");
  const grid = el("div", "playstyles");
  for (const ps of card.playstyles) {
    const badge = el("div", ps.earned ? "playstyle earned" : "playstyle");
    badge.append(el("span", "ps-icon", PS_ICONS[ps.icon] || "•"), el("span", null, ps.key));
    grid.appendChild(badge);
  }
  section.appendChild(grid);
  return section;
}

function careerPanel(card) {
  const section = panel("Career Statistics");
  section.appendChild(
    el("p", "career-sub", `${card.name} — batting & fielding across formats`)
  );

  const scroll = el("div", "career-scroll");
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", "Career statistics table");
  scroll.tabIndex = 0;

  const table = el("table", "career-table");
  const thead = el("thead");
  const headRow = el("tr");
  for (const c of card.career.columns) {
    const th = el("th", null, c);
    th.scope = "col";
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);

  const tbody = el("tbody");
  for (const r of card.career.rows) {
    const tr = el("tr");
    const th = el("th", null, r.format);
    th.scope = "row";
    tr.appendChild(th);
    const cells = [r.mat, r.runs, r.hs, r.ave, r.sr, r.hundreds, r.fifties, r.sixes, r.ct];
    cells.forEach((v, i) => {
      tr.appendChild(el("td", i === 1 ? "strong" : null, String(v)));
    });
    tbody.appendChild(tr);
  }

  table.append(thead, tbody);
  scroll.appendChild(table);
  section.appendChild(scroll);
  section.appendChild(el("p", "career-legend", card.career.legend));
  return section;
}

function metricsPanel(card) {
  const section = panel("Scouting Metrics");
  const grid = el("div", "metrics");
  const fills = [];
  for (const m of card.metrics) {
    const metric = el("div", "metric");
    const head = el("div", "metric-head");
    head.append(el("span", "label", m.label), el("span", "detail", m.detail));
    const bar = el("div", "metric-bar");
    const fill = el("span", "metric-fill");
    bar.appendChild(fill);
    fills.push([fill, m.score]);
    metric.append(head, bar);
    grid.appendChild(metric);
  }
  section.appendChild(grid);
  // Animate the bars in after layout.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      for (const [fill, score] of fills) fill.style.width = `${score}%`;
    })
  );
  return section;
}

function renderReport(card) {
  const report = els.report;
  report.replaceChildren();

  const side = el("div", "report-side");
  side.appendChild(renderCard(card));

  const actions = el("div", "report-actions");
  const open = el("a", "report-btn", "OPEN ON THE WEB ↗");
  open.href = playerUrl(card.username);
  open.target = "_blank";
  open.rel = "noreferrer";
  const copy = el("button", "copy-btn", "COPY LINK");
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(playerUrl(card.username));
      copy.textContent = "COPIED ✓";
      setTimeout(() => (copy.textContent = "COPY LINK"), 1400);
    } catch {
      /* clipboard unavailable */
    }
  });
  actions.append(open, copy);
  side.appendChild(actions);

  const main = el("div", "report-main");
  main.append(
    scoutHeader(card),
    attributesPanel(card),
    playstylesPanel(card),
    careerPanel(card),
    metricsPanel(card)
  );

  report.append(side, main);
}

// ---- Views ---------------------------------------------------------------------

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

function showHome() {
  els.viewReport.hidden = true;
  els.viewHome.hidden = false;
  els.report.replaceChildren();
  els.input.focus();
  els.input.select();
}

function showReport(card) {
  els.viewHome.hidden = true;
  els.viewReport.hidden = false;
  renderReport(card);
  window.scrollTo({ top: 0 });
}

async function scout(name) {
  const target = (name ?? els.input.value).trim().replace(/^@/, "");
  if (!target || loading) return;
  setLoading(true);
  showError("");
  try {
    const card = await fetchCard(target);
    showReport(card);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// ---- Wire-up ---------------------------------------------------------------------

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  scout();
});

els.backBtn.addEventListener("click", showHome);
els.brandBtn.addEventListener("click", showHome);

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

// Deep link: main passes ?u=<username> (from CLI arg or COVERDRIVE_SCOUT).
const deepLink = new URLSearchParams(window.location.search).get("u");
if (deepLink) {
  els.input.value = deepLink;
  scout(deepLink);
} else {
  els.input.focus();
}
