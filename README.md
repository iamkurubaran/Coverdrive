# 🏏 Coverdrive v4

**Your GitHub, rated for the World XI — out of 99.**

Coverdrive turns any GitHub profile into a full cricket scouting report: a
rated shield card, attributes, earned playstyle badges, a Cricinfo-style
career-statistics table, and detailed scouting metrics. A cricket-themed take
on GitFut — same idea, different sport.

**v4 is a client + server app.** All GitHub calls go through a Node.js server
with caching and optional token auth, so the browser never hits GitHub's
unauthenticated rate limits.

---

## Architecture

```
coverdrive/
├─ package.json              # root scripts (install:all, dev:*, build, start)
├─ server/                   # Node.js + Express
│  ├─ index.js               # API routes, counter, avatar proxy, static serving
│  ├─ github.js              # GitHub client + in-memory TTL cache
│  ├─ engine.js              # the full cricket rating engine
│  ├─ country.js             # location → nationality flag
│  └─ .env.example
└─ client/                   # React + Vite (mobile-first)
   ├─ index.html
   └─ src/
      ├─ App.jsx             # router + home page (hero, search, counter)\n      ├─ PlayerPage.jsx      # /player/:username scouting report route\n      ├─ Heatmap.jsx         # Innings Map — commit contribution heatmap
      ├─ PlayerCard.jsx      # 3D holographic shield card
      ├─ CareerTable.jsx     # Cricinfo-style scorecard
      ├─ ShareBar.jsx        # X / LinkedIn / copy link / PNG exports
      ├─ cardImage.js        # canvas renderer (download, copy, story format)
      ├─ api.js              # thin client for the server
      ├─ icons.jsx
      └─ App.css             # design system + responsive layout
```

### Server API

| Route | Purpose |
|---|---|
| `GET /api/card/:username` | Full scouting report incl. contribution heatmap (JSON) |
| `GET /api/stats` | Live "cards rated" counter |
| `GET /api/avatar?url=` | CORS-safe avatar proxy for canvas image export |
| `GET /api/health` | Cache + auth status |

The server caches every GitHub response for 10 minutes (configurable via
`CACHE_TTL_MS`), persists the cards-rated counter to `server/data/counter.json`,
and — when `client/dist` exists — serves the built client, so production is a
single Node process.

---

## Run it

Requires **Node 18+**.

```bash
# 1. Install both workspaces
npm run install:all

# 2. Start the server (terminal 1)
npm run dev:server            # http://localhost:8787

# 3. Start the client (terminal 2)
npm run dev:client            # http://localhost:5173 (proxies /api to :8787)
```

### Kill the rate limits entirely

The server works unauthenticated (60 req/hr, softened by caching). For real
headroom, give it a token — no scopes needed:

```bash
GITHUB_TOKEN=ghp_yourtoken npm run dev:server
```

That lifts the ceiling to **5,000 requests/hour**.

### Production

```bash
npm run build                 # builds client → client/dist
GITHUB_TOKEN=ghp_xxx npm start
# one process on http://localhost:8787 serving app + API
```

---

## The report

- **Shield card** — overall out of 99 with a count-up animation, cricket role
  badge, nationality flag (derived from profile location), top language,
  avatar, and six headline attributes. Tilts in 3D toward the pointer with a
  holographic sheen; respects `prefers-reduced-motion`.
- **Scout report header** — name, role, tier, handle, language, and a trait
  line (*GENERATIONAL TALENT*, *WICKET MACHINE*, *RISING PROSPECT*…).
- **Share bar** — post to X, share to LinkedIn, copy a deep link
  (`?u=username` loads the card directly), **Download** a rendered PNG,
  **Copy image** to the clipboard, and a 1080×1920 **Story format** export.
  All images are drawn on a canvas by hand — no capture libraries.
- **Attributes** — Shot range and Reverse sweep as ★ ratings, Work rate
  (bat / field), and a batting Style (Aggressor, Enforcer, Anchor…).
- **Playstyles** — Crowd Puller, Star Magnet, Six Machine, Marathon Innings,
  Rapid Fire, Veteran, Workhorse, All-Rounder. Earned badges glow gold.
- **Career Statistics** — a Cricinfo-style batting & fielding scorecard.
  Formats are recency buckets: **Tests** all-time, **ODIs** last 12 months,
  **T20s** last 90 days. Horizontally scrollable on phones with a sticky
  format column, exactly like a live scorecard.
- **Scouting Metrics** — Commits, Stars, Highest score, Followers, Languages,
  Issues, Reviews, Contributions, each with a value and an animated 0–99 bar.
- **Innings Map** — your GitHub contribution heatmap: one square per day for
  the last 12 months, pitch-green intensity, horizontally scrollable. Parsed
  server-side from GitHub's public calendar page (no token needed).
- **Routes** — search lives at `/`; every report gets its own shareable page
  at `/player/:username` (old `?u=` links redirect there).
- **Live counter** — total cards rated, persisted server-side.

## How the ratings map

Every score derives from a public GitHub signal, squashed into a **40–99**
band with diminishing returns.

| Attribute | Cricket meaning | GitHub signal |
|---|---|---|
| **BAT** Batting | Impact at the crease | Total stars earned |
| **BWL** Bowling | Wickets taken | Original repos shipped |
| **FLD** Fielding | Catches in the field | Total forks |
| **TEC** Technique | Range of shots | Number of languages |
| **EXP** Experience | Years in the game | Account age |
| **STA** Stamina | Endurance | Recent public activity |

Overall is the mean of the six.
**Tiers:** 90+ Legend · 82+ Platinum · 74+ Gold · 64+ Silver · else Bronze.
**Roles** (from the top attribute): Opening Batter, Fast Bowler, Wicketkeeper,
All-Rounder, Captain, Finisher.

**Career table mapping:** Mat = original repos · Runs = stars · HS = top repo
(* = still batting, i.e. not archived) · Ave = stars per repo · SR = stars per
year · 100s / 50s = repos past those star marks · 6s = 1k+ star repos ·
Ct = forks caught.

---

## Responsive design

Mobile-first throughout: single-column report on phones with a
horizontally-scrolling scorecard, two-column playstyles from 640px, and a
two-column desktop layout from 1024px where the card + share column sticks
while the report scrolls. Touch, keyboard focus, and reduced motion are all
handled.

## Notes

- Only public data is used. Unofficial and just for fun — not affiliated with
  the ICC or GitHub.
- "Commits / Issues / Reviews" read from the recent public events feed, so
  they reflect recent activity rather than all-time totals.
