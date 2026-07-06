import { useEffect, useRef, useState } from "react";
import { fetchCard, fetchStats } from "./api";
import PlayerCard from "./PlayerCard";
import CareerTable from "./CareerTable";
import ShareBar from "./ShareBar";
import { Icon } from "./icons";
import "./App.css";

const SUGGESTED = ["torvalds", "sindresorhus", "gaearon"];

export default function App() {
  const [username, setUsername] = useState("");
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardsRated, setCardsRated] = useState(null);
  const [showHow, setShowHow] = useState(false);
  const reportRef = useRef(null);

  async function scout(name) {
    const target = (name ?? username).trim();
    if (!target) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchCard(target);
      setCard(result);
      setUsername(result.username);
      const url = new URL(window.location);
      url.searchParams.set("u", result.username);
      window.history.replaceState(null, "", url);
      fetchStats().then((s) => setCardsRated(s.cardsRated)).catch(() => {});
      requestAnimationFrame(() =>
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (err) {
      setCard(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Live counter + deep link (?u=username) on load.
  useEffect(() => {
    fetchStats().then((s) => setCardsRated(s.cardsRated)).catch(() => {});
    const u = new URLSearchParams(window.location.search).get("u");
    if (u) {
      setUsername(u);
      scout(u);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      <div className="sky" aria-hidden>
        <span className="floodlight fl-a" />
        <span className="floodlight fl-b" />
        <span className="grain" />
      </div>

      <header className="topbar">
        <div className="brand">
          <BallMark />
          <span className="brand-name">
            COVER<em>DRIVE</em>
          </span>
        </div>
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
        {/* ---- Hero ---- */}
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
            <button className="how-link" onClick={() => setShowHow(true)}>
              how it works ↗
            </button>
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>

        {/* ---- Loading ---- */}
        {loading && (
          <div className="umpire">
            <span className="umpire-bails" aria-hidden />
            Third umpire reviewing…
          </div>
        )}

        {/* ---- Report ---- */}
        {card && !loading && (
          <div className="report" ref={reportRef}>
            <div className="scout-head">
              <div className="scout-eyebrow">Scout Report</div>
              <h2 className="scout-name">{card.name}</h2>
              <div className="scout-meta">
                <span className="pos-badge">{card.role.abbr}</span>
                <span className="scout-tier">{titleCase(card.tier.name)}</span>
                <span className="dot">|</span>
                <span className="scout-handle">@{card.username}</span>
                <span className="dot">|</span>
                <span className="lang-chip">{card.topLanguage}</span>
              </div>
              <p className="scout-trait">
                <strong>{card.trait.tag}</strong> {card.trait.note}
              </p>
            </div>

            <div className="report-side">
              <PlayerCard card={card} />
              <ShareBar card={card} />
            </div>

            <div className="report-main">
            <section className="panel">
              <div className="panel-title">
                <span className="tick" aria-hidden />
                Attributes
              </div>
              <Row label="Shot range" value={<Stars n={card.shotRange} />} />
              <Row label="Reverse sweep" value={<Stars n={card.reverseSweep} />} />
              <Row
                label="Work rate"
                value={<strong className="mono-val">{card.workRate}</strong>}
              />
              <Row
                label="Style"
                value={<strong className="mono-val">{card.style}</strong>}
                last
              />
            </section>

            <section className="panel">
              <div className="panel-title">
                <span className="tick" aria-hidden />
                Playstyles
              </div>
              <div className="playstyles">
                {card.playstyles.map((ps) => (
                  <div className={`ps ${ps.earned ? "on" : "off"}`} key={ps.key}>
                    <Icon name={ps.icon} size={18} />
                    <span>{ps.key}</span>
                    {ps.earned && <span className="ps-plus">+</span>}
                  </div>
                ))}
              </div>
            </section>

            <CareerTable career={card.career} name={card.name} />

            <section className="panel">
              <div className="panel-title">
                <span className="tick" aria-hidden />
                Scouting Metrics
              </div>
              {card.metrics.map((m, i) => (
                <div className="metric" key={m.label} style={{ "--i": i }}>
                  <div className="metric-head">
                    <span className="metric-label">{m.label}</span>
                    <span className="metric-detail">{m.detail}</span>
                    <span className="metric-score">{m.score}</span>
                  </div>
                  <div className="metric-bar">
                    <span style={{ "--w": `${m.score}%` }} />
                  </div>
                </div>
              ))}
            </section>

            <a
              className="profile-link"
              href={card.profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              VIEW @{card.username.toUpperCase()} ON GITHUB
              <Icon name="arrow" size={14} />
            </a>
            </div>
          </div>
        )}

        {/* ---- Empty state ---- */}
        {!card && !loading && (
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

function Row({ label, value, last }) {
  return (
    <div className={`row ${last ? "row-last" : ""}`}>
      <span className="row-label">{label}</span>
      <span className="row-value">{value}</span>
    </div>
  );
}

function Stars({ n }) {
  return (
    <span className="stars" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "s on" : "s"}>★</span>
      ))}
    </span>
  );
}

function titleCase(s) {
  return s.charAt(0) + s.slice(1).toLowerCase();
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
            <div><dt>STA — Stamina</dt><dd>recent public activity</dd></div>
          </dl>
          <p>
            Overall is the mean of the six. Tiers: 90+ Legend · 82+ Platinum ·
            74+ Gold · 64+ Silver · below that, Bronze. Your role comes from
            your strongest attribute — Opening Batter, Fast Bowler,
            Wicketkeeper, All-Rounder, Captain, or Finisher.
          </p>
          <p>
            The career table reads like a scorecard: Tests are your all-time
            record, ODIs the last 12 months, T20s the last 90 days.
          </p>
        </div>
      </div>
    </div>
  );
}
