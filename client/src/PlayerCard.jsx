import { useEffect, useRef, useState } from "react";
import { avatarProxyUrl } from "./api";

const LEFT = ["BAT", "BWL", "FLD"];
const RIGHT = ["TEC", "EXP", "STA"];

export default function PlayerCard({ card }) {
  const { attributes, tier } = card;
  const ref = useRef(null);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  const [overall, setOverall] = useState(reduceMotion.current ? card.overall : 0);

  // Count the overall rating up on mount.
  useEffect(() => {
    if (reduceMotion.current) {
      setOverall(card.overall);
      return;
    }
    let frame;
    const start = performance.now();
    const dur = 900;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setOverall(Math.round(card.overall * eased));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [card.overall]);

  function setTilt(px, py) {
    const el = ref.current;
    if (!el || reduceMotion.current) return;
    el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }

  function handlePointerMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }

  function resetTilt() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "18%");
  }

  const surname = card.name.trim().split(/\s+/).slice(-1)[0].toUpperCase();

  return (
    <div className="card-scene">
      <div
        ref={ref}
        className="fcard"
        style={{ "--accent": tier.accent, "--glow": tier.glow }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onPointerCancel={resetTilt}
      >
        <div className="fcard-holo" aria-hidden />
        <div className="fcard-inner">
          <div className="fcard-crest" aria-hidden>
            <span className="crest-stars">★ ★ ★</span>
            <span className="crest-ball" />
          </div>

          <div className="fcard-top">
            <div className="fcard-idcol">
              <span className="fc-ovr">{overall}</span>
              <span className="fc-pos">{card.role.abbr}</span>
              <span className="fc-flag" title={card.location || ""}>
                {card.country?.flag || "🌍"}
              </span>
              <span className="fc-lang">{card.topLanguage}</span>
            </div>
            <div className="fcard-portrait">
              <img
                src={avatarProxyUrl(card.avatar)}
                alt={card.name}
                crossOrigin="anonymous"
                loading="eager"
              />
            </div>
          </div>

          <div className="fcard-name">{surname}</div>
          <div className="fcard-rule" aria-hidden />

          <div className="fcard-attrs">
            <div className="fc-col">
              {LEFT.map((k) => (
                <div className="fc-attr" key={k}>
                  <span className="fc-num">{attributes[k]}</span>
                  <span className="fc-key">{k}</span>
                </div>
              ))}
            </div>
            <div className="fc-divider" aria-hidden />
            <div className="fc-col">
              {RIGHT.map((k) => (
                <div className="fc-attr" key={k}>
                  <span className="fc-num">{attributes[k]}</span>
                  <span className="fc-key">{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fcard-foot">
            <span>{card.tier.name}</span>
            <span className="fcard-foot-dot" aria-hidden />
            <span>{card.format}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
