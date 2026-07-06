import { useEffect, useState } from "react";
import { fetchCard, fetchStats } from "./api";
import PlayerPage from "./PlayerPage";
import { Icon } from "./icons";
import "./App.css";

const SUGGESTED = ["torvalds", "sindresorhus", "gaearon"];

/* ---------- Tiny router ----------------------------------------------------
   Two routes, no dependency:
     /                  → home (hero + search)
     /player/:username  → full scouting report                              */

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  function navigate(to, { replace = false } = {}) {
    if (replace) window.history.replaceState(null, "", to);
    else window.history.pushState(null, "", to);
    setPath(new URL(to, window.location.origin).pathname);
    window.scrollTo({ top: 0 });
  }
  return [path, navigate];
}

function matchPlayer(path) {
  const m = path.match(/^\/player\/([A-Za-z0-9-]{1,39})\/?$/);
  return m ? m[1] : null;
}

export default function App() {
  const [path, navigate] = usePath();
  const [showHow, setShowHow] = useState(false);

  // Legacy deep links (?u=name) redirect to the player route.
  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("u");
    if (u && !matchPlayer(window.location.pathname)) {
      navigate(`/player/${encodeURIComponent(u)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const player = matchPlayer(path);

  return (
    <div className="app">
      <div className="sky" aria-hidden>
        <span className="floodlight fl-a" />
        <span className="floodlight fl-b" />
        <span className="grain" />
      </div>

      <header className="topbar">
        <a
          className="brand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <BallMark />
          <span className="brand-name">
            COVER<em>DRIVE</em>
          </span>
        </a>
        <a
          className="gh-pill"
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <Icon name="github" size={16} />
          <span>Source</span>
        </a>
      </header>

      <main>
        {player ? (
          <PlayerPage
            key={player.toLowerCase()}
            username={player}
            navigate={navigate}
          />
        ) : (
          <HomePage navigate={navigate} onHow={() => setShowHow(true)} />
        )}
      </main>

      <footer className="footer">
        <span className="footer-stripe" aria-hidden />
        <p>
          Attributes derived from public GitHub stats via the Coverdrive server.
          Unofficial &amp; just for fun — not affiliated with the ICC or GitHub.
        </p>
      </footer>

      {showHow && <HowItWorks onClose={() => setShowHow(false)} />}
    </div>
  );
}

/* ---------- Home ---------- */

function HomePage({ navigate, onHow }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardsRated, setCardsRated] = useState(null);

  useEffect(() => {
    fetchStats().then((s) => setCardsRated(s.cardsRated)).catch(() => {});
  }, []);

  async function scout(name) {
    const target = (name ?? username).trim().replace(/^@/, "");
    if (!target || loading) return;
    setLoading(true);
    setError("");
    try {
      const card = await fetchCard(target); // warms the cache
      navigate(`/player/${encodeURIComponent(card.username)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <div className="hero-eyebrow">
          <span>GITHUB</span>
          <span className="eyebrow-x">×</span>
          <span className="eyebrow-gold">WORLD XI ’26</span>
        </div>

        <h1 className="hero-title">
          GET SELECTED<span className="full-stop">.</span>
        </h1>
        <p className="hero-sub">
          Your GitHub stats, turned into a World-XI-style cricket card — rated
          out of 99.
        </p>

        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            scout();
          }}
        >
          <div className="search-field">
            <span className="at" aria-hidden>@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="github username"
              spellCheck="false"
              autoComplete="off"
              autoCapitalize="none"
              aria-label="GitHub username"
            />
          </div>
          <button className="scout-btn" type="submit" disabled={loading}>
            {loading ? "REVIEWING…" : "SCOUT"}
            {!loading && <Icon name="arrow" size={16} />}
          </button>
        </form>

        <div className="suggested">
          <span>try</span>
          {SUGGESTED.map((s) => (
            <button key={s} onClick={() => scout(s)} disabled={loading}>
              {s}
            </button>
          ))}
          <span className="suggested-own">· or your own</span>
        </div>

        <div className="hero-meta">
          {cardsRated != null && (
            <span className="live-counter">
              <span className="live-dot" aria-hidden />
              <strong>{cardsRated.toLocaleString()}</strong>&nbsp;cards rated
            </span>
          )}
          <button className="how-link" onClick={onHow}>
            how it works ↗
          </button>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>

      {loading ? (
        <div className="umpire">
          <span className="umpire-bails" aria-hidden />
          Third umpire reviewing…
        </div>
      ) : (
        <div className="empty">
          <div className="pitch" aria-hidden>
            <span className="crease c1" />
            <span className="crease c2" />
            <span className="stumps">
              <i /><i /><i />
            </span>
          </div>
          <p>
            Step up to the crease — enter a username to generate a full
            scouting report.
          </p>
        </div>
      )}
    </>
  );
}

/* ---------- Small components ---------- */

function BallMark() {
  return (
    <svg className="ball-mark" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="26" fill="#c8102e" />
      <path d="M23 8 Q16 32 23 56" fill="none" stroke="#f6e7c8" strokeWidth="2.5" strokeDasharray="4 3" />
      <path d="M41 8 Q48 32 41 56" fill="none" stroke="#f6e7c8" strokeWidth="2.5" strokeDasharray="4 3" />
    </svg>
  );
}

function HowItWorks({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="How Coverdrive works"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>HOW IT WORKS</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <p>
            Every score derives from a public GitHub signal, squashed into a
            40–99 band with diminishing returns — mega-accounts don't peg
            everything at 99, and newcomers still land respectably.
          </p>
          <dl className="how-list">
            <div><dt>BAT — Batting</dt><dd>total stars earned</dd></div>
            <div><dt>BWL — Bowling</dt><dd>original repos shipped</dd></div>
            <div><dt>FLD — Fielding</dt><dd>total forks caught</dd></div>
            <div><dt>TEC — Technique</dt><dd>range of languages</dd></div>
            <div><dt>EXP — Experience</dt><dd>years in the game</dd></div>
            <div><dt>STA — Stamina</dt><dd>contributions in the last year</dd></div>
          </dl>
          <p>
            Overall is the mean of the six. Tiers: 90+ Legend · 82+ Platinum ·
            74+ Gold · 64+ Silver · below that, Bronze. Your role comes from
            your strongest attribute — Opening Batter, Fast Bowler,
            Wicketkeeper, All-Rounder, Captain, or Finisher.
          </p>
          <p>
            The career table reads like a scorecard: Tests are your all-time
            record, ODIs the last 12 months, T20s the last 90 days. The
            Innings Map is your commit heatmap — a year of deliveries, one
            square per day.
          </p>
        </div>
      </div>
    </div>
  );
}
