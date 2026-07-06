# Coverdrive Browser Extensions

## Chrome (`chrome/`)

A Manifest V3 extension that puts Coverdrive one click away: search any
GitHub username (or scout the profile you're currently viewing on
github.com) and get the rated shield card right in the popup, with a
deep link to the full scouting report.

It talks to the deployed Coverdrive server at
**https://gitcoverdrive.onrender.com** — no local server needed. All
GitHub calls happen server-side (cached, optionally token-authenticated),
so the extension itself never touches GitHub's API.

### What it does

- **Search** — the same hero search as the web client (`@username` →
  SCOUT), with suggested players and the live "cards rated" counter.
- **Scout the current tab** — open the popup while on a
  `github.com/<user>` profile page and a one-click chip pre-fills that
  username.
- **Shield card** — the client's `PlayerCard` ported to vanilla JS/SVG:
  tier-colored bezier shield, avatar (via the server's CORS-safe proxy),
  overall count-up animation, role, flag, top language, and the six
  BAT/BWL/FLD/TEC/EXP/STA attributes.
- **Trait line + actions** — the scout's trait tag, an "open full
  report" link to `https://gitcoverdrive.onrender.com/player/<user>`,
  and a copy-link button.
- **Caching** — cards cache in `chrome.storage.local` for 5 minutes
  (same TTL as the web client), so reopening the popup doesn't refetch.

### Install (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and select the `extensions/chrome` folder.
4. Pin the cricket-ball icon and click it anywhere — or on a GitHub
   profile page for one-click scouting.

### Point it at a different server

The server base URL is the `BASE` constant at the top of
`chrome/popup.js`. If you change it, also update the matching entry in
`host_permissions` in `chrome/manifest.json`.

### Files

```
chrome/
├─ manifest.json   # MV3: action popup, activeTab + storage, host permission
├─ popup.html      # search + card views
├─ popup.css       # night-test-match design system, condensed for a popup
├─ popup.js        # server client, shield-card renderer, tab detection
└─ icons/          # generated cricket-ball icons (16/32/48/128)
```

### Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the current tab's URL to detect a GitHub profile |
| `storage` | 5-minute card cache |
| `https://gitcoverdrive.onrender.com/*` | The Coverdrive API + avatar proxy |
