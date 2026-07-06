# Coverdrive Desktop

Coverdrive as a native desktop app for **macOS and Windows**, built with
Electron. The renderer is a dependency-free port of the web client — hero
search, the tier-colored shield card (with the 3D pointer tilt), attributes,
playstyle badges, the Cricinfo-style career table, and animated scouting
metrics — all fed by the deployed Coverdrive server at
**https://gitcoverdrive.onrender.com**. No local server needed.

## Run in development

Requires Node 18+.

```bash
cd desktop
npm install
npm start

# open straight onto a player's report:
npm start -- torvalds
```

> The Render free tier sleeps when idle — the first scout after a while can
> take ~30s while the server wakes ("third umpire reviewing…" covers it).

## Build installers

```bash
npm run dist:mac    # .dmg + .zip        (build on macOS)
npm run dist:win    # NSIS installer + portable .exe
npm run dist        # both
```

Artifacts land in `desktop/dist/`. electron-builder generates the platform
icons (`.icns` / `.ico`) from `build/icon.png` automatically. Note that
Windows installers are best built on Windows (or via CI); cross-building from
macOS requires Wine.

## Architecture

```
desktop/
├─ main.js            # BrowserWindow, app menu, single-instance lock,
│                     #   external links → system browser, deep-link arg
├─ preload.js         # contextBridge: platform + electron version only
├─ renderer/
│  ├─ index.html      # CSP-locked shell (connect-src = the Render server)
│  ├─ styles.css      # night-test-match design system at desktop size
│  └─ app.js          # server client, shield card, report panels
└─ build/icon.png     # 512px source icon for electron-builder
```

Security posture: `contextIsolation` + `sandbox` on, `nodeIntegration` off,
a strict CSP in the renderer, and every external URL is denied in-app and
routed to the system browser via `shell.openExternal`.

The server base URL is the `BASE` constant in `renderer/app.js` (and the
CSP `connect-src`/`img-src` in `renderer/index.html`, plus `SERVER` in
`main.js` for the Help menu) — change all of them together to point at a
different deployment.

## Platform notes

- **macOS** — hidden-inset title bar; the top bar is the drag region, padded
  for the traffic lights. Closing the window keeps the app running (standard
  macOS behavior); ⌘Q quits.
- **Windows** — standard title bar, single-instance lock (a second launch
  focuses the existing window), NSIS installer allows choosing the install
  directory.
