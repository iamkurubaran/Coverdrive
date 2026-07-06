import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchProfile, cacheStats } from "./github.js";
import { buildCard } from "./engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const app = express();

app.disable("x-powered-by");

// ---- CORS (open for local dev; same-origin in production) -------------------
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---- Persistent "cards rated" counter ---------------------------------------
const DATA_DIR = path.join(__dirname, "data");
const COUNTER_FILE = path.join(DATA_DIR, "counter.json");

function readCounter() {
  try {
    return JSON.parse(fs.readFileSync(COUNTER_FILE, "utf8")).cardsRated || 0;
  } catch {
    return 0;
  }
}

let cardsRated = readCounter();
let counterDirty = false;

function bumpCounter() {
  cardsRated += 1;
  counterDirty = true;
}

setInterval(() => {
  if (!counterDirty) return;
  counterDirty = false;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ cardsRated }));
  } catch {
    /* non-fatal */
  }
}, 5000).unref();

// ---- API ---------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, cache: cacheStats(), authenticated: Boolean(process.env.GITHUB_TOKEN) });
});

app.get("/api/stats", (_req, res) => {
  res.json({ cardsRated });
});

const USERNAME_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

app.get("/api/card/:username", async (req, res) => {
  const username = String(req.params.username || "").trim().replace(/^@/, "");
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "Enter a valid GitHub username." });
  }
  try {
    const { user, repos, events } = await fetchProfile(username);
    const card = buildCard(user, repos, events);
    bumpCounter();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(card);
  } catch (err) {
    if (err.code === 404) {
      return res.status(404).json({ error: `No player found for "${username}".` });
    }
    if (err.code === 429) {
      return res.status(429).json({
        error:
          "GitHub rate limit reached. Set GITHUB_TOKEN on the server, or try again shortly.",
      });
    }
    res.status(502).json({ error: "Couldn't reach the scoreboard. Try again." });
  }
});

// Proxy avatars so the client can draw them onto a canvas for image export.
app.get("/api/avatar", async (req, res) => {
  try {
    const url = new URL(String(req.query.url || ""));
    if (url.hostname !== "avatars.githubusercontent.com") {
      return res.status(400).json({ error: "Only GitHub avatars are allowed." });
    }
    const upstream = await fetch(url, { headers: { "User-Agent": "coverdrive-app" } });
    if (!upstream.ok) return res.status(502).json({ error: "Avatar unavailable." });
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    res.status(400).json({ error: "Invalid avatar URL." });
  }
});

// ---- Serve the built client in production -------------------------------------
const DIST = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🏏 Coverdrive server on http://localhost:${PORT}`);
  console.log(
    process.env.GITHUB_TOKEN
      ? "   GitHub auth: token (5,000 req/hr)"
      : "   GitHub auth: none (60 req/hr) — set GITHUB_TOKEN to lift limits"
  );
});
