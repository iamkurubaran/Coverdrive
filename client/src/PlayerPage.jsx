import { useEffect, useState } from "react";
import { fetchCard } from "./api";
import PlayerCard from "./PlayerCard";
import CareerTable from "./CareerTable";
import Heatmap from "./Heatmap";
import ShareBar from "./ShareBar";
import { Icon } from "./icons";

// The /player/:username route. Cards land here after a search (already
// cached by the home page) or via a shared deep link (fetched on mount).

export default function PlayerPage({ username, navigate }) {
  const [card, setCard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setCard(null);
    setError("");
    fetchCard(username)
      .then((c) => alive && setCard(c))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [username]);

  function goHome(e) {
    e?.preventDefault();
    navigate("/");
  }

  if (error) {
    return (
      <div className="page-status">
        <p className="error" role="alert">{error}</p>
        <a className="back-link solo" href="/" onClick={goHome}>
          <Icon name="arrow" size={14} className="flip" /> Back to the crease
        </a>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="umpire page-status">
        <span className="umpire-bails" aria-hidden />
        Third umpire reviewing…
      </div>
    );
  }

  return (
    <div className="report">
      <div className="report-top">
        <a className="back-link" href="/" onClick={goHome}>
          <Icon name="arrow" size={14} className="flip" /> Scout another
        </a>
        <span className="report-path">/player/{card.username}</span>
      </div>

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

        <Heatmap heatmap={card.heatmap} />

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
  );
}

/* ---------- Bits ---------- */

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
