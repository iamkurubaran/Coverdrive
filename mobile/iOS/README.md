# 🏏 Coverdrive for iOS

Native SwiftUI client for the deployed Coverdrive server at
**https://gitcoverdrive.onrender.com** — search a GitHub username, get a
World-XI-style cricket scouting report: the shield card, attributes,
playstyles, the Innings Map commit heatmap, a Cricinfo-style career table,
and scouting metrics.

## Requirements

- **Xcode 26** (iOS 26 SDK) — required to compile the Liquid Glass APIs
- Runs on **iOS 18+**: on iOS 26 the UI uses real Liquid Glass
  (`glassEffect`, `GlassEffectContainer`, interactive tints); on iOS 18–25
  it gracefully falls back to matching ultra-thin materials

## Run it

1. Unzip and open `Coverdrive.xcodeproj`
2. Select your team under *Signing & Capabilities* (bundle id `com.coverdrive.ios`)
3. Build & run on a simulator or device

No dependencies, no configuration — the server URL is baked into `API.swift`.
Note: the Render free tier cold-starts, so the very first scout of the day can
take ~30 seconds; the app's timeout accounts for this.

## Structure

| File | What it is |
|---|---|
| `CoverdriveApp.swift` | Entry point (dark scheme, gold tint) |
| `Theme.swift` | Palette, condensed display type, tricolor stripe, Liquid Glass helpers with pre-26 fallbacks |
| `Models.swift` | Codable models matching the server's `/api/card` payload |
| `API.swift` | Async client: card, stats, avatar proxy, share URLs |
| `HomeView.swift` | Hero ("GET SELECTED."), glass search capsule, suggested players, live counter, how-it-works sheet |
| `CardView.swift` | The shield card as a native bezier `Shape` — metallic tier trim, dark face, drag tilt + holo sheen, rating count-up |
| `PlayerView.swift` | Full report + share bar (link, card image via `ImageRenderer`, save to Photos) |
| `HeatmapView.swift` | Innings Map — pitch-green contribution calendar, auto-scrolled to recent weeks |

## Design notes

Mirrors the web client's night-test-match theme: near-black canvas with
floodlight glows, condensed heavy uppercase display type against light body
text, gold/pitch-green/ball-red accents, and the tricolor signature stripe.
Chrome (search, chips, panels, share buttons) sits on Liquid Glass per
Apple's guidelines — glass for the floating control layer, opaque content
(the card, tables) underneath. Reduce Motion disables the tilt and count-up.
