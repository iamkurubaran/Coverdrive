# 🏏 Coverdrive

Turn any GitHub profile into a cricket-style scouting report with ratings, playstyles, and shareable insights.

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-18%2B-339933.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18-61DAFB.svg)](https://react.dev)
[![Render](https://img.shields.io/badge/deploy-render-46E3B7.svg)](https://render.com)
[![Support @iamkurubaran on Chai4Me](https://chai4.me/badge.svg)](https://chai4.me/iamkurubaran)

## Live demo

- https://gitcoverdrive.onrender.com/

## Overview

Coverdrive is a full-stack experience that turns public GitHub activity into a fun, polished cricket scouting report. It combines a Vite-powered frontend with a Node.js backend so the browser avoids unauthenticated GitHub rate limits while still rendering rich analytics.

## Highlights

- Cricket-themed player cards with a 0–99 score and role-based tiers
- Shareable player pages, exportable images, and story-style layouts
- Career stats presented like a live scorecard
- Contribution heatmaps and scouting metrics from GitHub data
- Built-in caching and optional GitHub token support for higher API limits

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Data source: GitHub public API and contribution calendar parsing
- Deployment: Render

## Project structure

```text
coverdrive/
├─ client/          # React + Vite frontend
├─ server/          # Express API and rating engine
├─ desktop/         # Electron shell (optional)
└─ mobile/          # Mobile projects
```

## Getting started

Requirements: Node.js 18+

```bash
npm run install:all
npm run dev:server
npm run dev:client
```

- Server: http://localhost:8787
- Client: http://localhost:5173

### GitHub API rate-limit help

The server can run without authentication, but adding a token gives you more headroom:

```bash
GITHUB_TOKEN=ghp_yourtoken npm run dev:server
```

### Production build

```bash
npm run build
GITHUB_TOKEN=ghp_xxx npm start
```

## API overview

| Route | Purpose |
| --- | --- |
| `GET /api/card/:username` | Full scouting report JSON |
| `GET /api/stats` | Live cards-rated counter |
| `GET /api/avatar?url=` | Safe image proxy for export rendering |
| `GET /api/health` | Health and cache status |

## Development notes

- The server caches GitHub responses and persists the counter in the data directory.
- The client is designed to be mobile-first and accessible.
- The app uses public GitHub data only and is intended for fun, non-official use.

## Contributing

Contributions are welcome. Open an issue or submit a pull request if you want to improve the scoring logic, add a new report section, or improve the developer experience.

## License

MIT © Kurubaran Anandhan
