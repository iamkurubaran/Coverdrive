import { useEffect, useId, useRef, useState } from "react";
import { avatarProxyUrl } from "./api";

// Self-contained drop-in card. The shield is a real SVG bezier path
// (smooth curves — no jagged clip-path polygon), with a metallic tier
// trim drawn as geometry so the border follows the curve perfectly.
// All styles are scoped (cdc-*) and shipped inside this file, so it
// replaces the old card without touching App.css.

const LEFT = ["BAT", "BWL", "FLD"];
const RIGHT = ["TEC", "EXP", "STA"];

// Shield outline in 0..1 space: rounded top corners, straight flanks,
// one smooth sweep into a soft bottom point.
const SHIELD =
  "M0.075 0.03 L0.925 0.03 C0.955 0.03 0.968 0.048 0.968 0.078 " +
  "L0.968 0.52 C0.968 0.67 0.905 0.782 0.752 0.876 " +
  "C0.664 0.93 0.577 0.962 0.5 0.978 " +
  "C0.423 0.962 0.336 0.93 0.248 0.876 " +
  "C0.095 0.782 0.032 0.67 0.032 0.52 " +
  "L0.032 0.078 C0.032 0.048 0.045 0.03 0.075 0.03 Z";

// Inner face, inset evenly inside the trim.
const FACE_TRANSFORM = "translate(0.5 0.5) scale(0.9815 0.9865) translate(-0.5 -0.5)";

// "#rrggbb" mixed toward another hex by t (0..1).
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sa, sb) => Math.round(sa + (sb - sa) * t);
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

export default function PlayerCard({ card }) {
  const { attributes, tier } = card;
  const ref = useRef(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
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
      setOverall(Math.round(card.overall * (1 - Math.pow(1 - k, 3))));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [card.overall]);

  function setTilt(px, py) {
    const el = ref.current;
    if (!el || reduceMotion.current) return;
    el.style.setProperty("--rx", `${(0.5 - py) * 9}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 11}deg`);
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
  const clip = `url(#cdc-clip-${uid})`;

  return (
    <div className="cdc-scene">
      <div
        ref={ref}
        className="cdc"
        style={{ "--accent": tier.accent, "--glow": tier.glow }}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onPointerCancel={resetTilt}
      >
        {/* Geometry: metallic trim + dark face, both smooth beziers */}
        <svg
          className="cdc-frame"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={`cdc-trim-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mix(tier.glow, "#ffffff", 0.35)} />
              <stop offset="0.3" stopColor={tier.accent} />
              <stop offset="0.72" stopColor={mix(tier.accent, "#000000", 0.45)} />
              <stop offset="1" stopColor={mix(tier.glow, "#000000", 0.25)} />
            </linearGradient>
            <linearGradient id={`cdc-face-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1d2028" />
              <stop offset="0.45" stopColor="#13151b" />
              <stop offset="1" stopColor="#0a0b0f" />
            </linearGradient>
            <radialGradient id={`cdc-tint-${uid}`} cx="0.5" cy="0" r="0.75">
              <stop offset="0" stopColor={tier.accent} stopOpacity="0.26" />
              <stop offset="1" stopColor={tier.accent} stopOpacity="0" />
            </radialGradient>
            <clipPath id={`cdc-clip-${uid}`} clipPathUnits="objectBoundingBox">
              <path d={SHIELD} transform={FACE_TRANSFORM} />
            </clipPath>
          </defs>
          <path d={SHIELD} fill={`url(#cdc-trim-${uid})`} />
          <path d={SHIELD} transform={FACE_TRANSFORM} fill={`url(#cdc-face-${uid})`} />
          <path d={SHIELD} transform={FACE_TRANSFORM} fill={`url(#cdc-tint-${uid})`} />
        </svg>

        {/* Content, clipped to the curved face */}
        <div className="cdc-inner" style={{ clipPath: clip }}>
          <div className="cdc-crest" aria-hidden>
            <span className="cdc-crest-stars">★ ★ ★</span>
          </div>

          <div className="cdc-top">
            <div className="cdc-id">
              <span className="cdc-ovr">{overall}</span>
              <span className="cdc-pos">{card.role.abbr}</span>
              <span className="cdc-flag" title={card.location || ""}>
                {card.country?.flag || "🌍"}
              </span>
              <span className="cdc-lang">{card.topLanguage}</span>
            </div>
            <div className="cdc-portrait">
              <img
                src={avatarProxyUrl(card.avatar)}
                alt={card.name}
                crossOrigin="anonymous"
                loading="eager"
              />
            </div>
          </div>

          <div className="cdc-name">{surname}</div>
          <div className="cdc-rule" aria-hidden />

          <div className="cdc-attrs">
            <div className="cdc-col">
              {LEFT.map((k) => (
                <div className="cdc-attr" key={k}>
                  <span className="cdc-num">{attributes[k]}</span>
                  <span className="cdc-key">{k}</span>
                </div>
              ))}
            </div>
            <div className="cdc-divider" aria-hidden />
            <div className="cdc-col">
              {RIGHT.map((k) => (
                <div className="cdc-attr" key={k}>
                  <span className="cdc-num">{attributes[k]}</span>
                  <span className="cdc-key">{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cdc-foot">
            <span>{card.tier.name}</span>
            <span className="cdc-dot" aria-hidden />
            <span>{card.format}</span>
          </div>
        </div>

        {/* Holographic sheen following the pointer */}
        <div className="cdc-holo" style={{ clipPath: clip }} aria-hidden />
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.cdc-scene {
  perspective: 1200px;
  display: flex;
  justify-content: center;
  padding: 12px 0;
}

.cdc {
  --rx: 0deg; --ry: 0deg; --mx: 50%; --my: 18%;
  --ink: #f5f0e3;
  --soft: rgba(214, 205, 182, 0.6);
  position: relative;
  width: min(340px, 86vw);
  aspect-ratio: 5 / 7;
  transform: rotateX(var(--rx)) rotateY(var(--ry));
  transform-style: preserve-3d;
  transition: transform 0.18s ease-out;
  filter: drop-shadow(0 24px 42px rgba(0, 0, 0, 0.62))
          drop-shadow(0 0 22px color-mix(in srgb, var(--glow) 14%, transparent));
  animation: cdc-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  container-type: inline-size;
}

@keyframes cdc-in {
  from { opacity: 0; transform: translateY(26px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.cdc-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.cdc-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8.5% 10% 9.5%;
  color: var(--ink);
  background: repeating-linear-gradient(
    90deg,
    transparent 0 12px,
    rgba(255, 255, 255, 0.02) 12px 13px
  );
}

.cdc-holo {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: radial-gradient(
    circle at var(--mx) var(--my),
    color-mix(in srgb, var(--glow) 26%, transparent),
    color-mix(in srgb, var(--glow) 6%, transparent) 30%,
    transparent 58%
  );
  mix-blend-mode: screen;
}

.cdc-crest { margin-bottom: 1.5%; }

.cdc-crest-stars {
  font-size: 10px;
  letter-spacing: 5px;
  color: var(--accent);
  text-shadow: 0 0 10px color-mix(in srgb, var(--glow) 50%, transparent);
}

.cdc-top {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 4%;
  margin-top: 2%;
}

.cdc-id {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  min-width: 30%;
}

.cdc-ovr {
  font-family: "Saira Condensed", "Arial Narrow", sans-serif;
  font-weight: 800;
  font-size: clamp(46px, 14cqw, 60px);
  line-height: 0.9;
  color: var(--accent);
  text-shadow: 0 0 22px color-mix(in srgb, var(--glow) 38%, transparent);
}

.cdc-pos {
  font-family: "Saira Condensed", "Arial Narrow", sans-serif;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 1.5px;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
  padding-bottom: 3px;
}

.cdc-flag { font-size: 20px; line-height: 1; }

.cdc-lang {
  font-family: "Saira Condensed", "Arial Narrow", sans-serif;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--soft);
  text-transform: uppercase;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cdc-portrait {
  flex: 1;
  display: flex;
  justify-content: center;
}

.cdc-portrait img {
  width: clamp(112px, 39cqw, 152px);
  height: clamp(112px, 39cqw, 152px);
  border-radius: 50%;
  object-fit: cover;
  background: #0d0f13;
  border: 2px solid var(--accent);
  box-shadow:
    0 0 0 5px rgba(255, 255, 255, 0.045),
    0 10px 26px rgba(0, 0, 0, 0.55);
}

.cdc-name {
  margin-top: 6%;
  font-family: "Saira Condensed", "Arial Narrow", sans-serif;
  font-weight: 800;
  font-size: clamp(26px, 9.5cqw, 35px);
  letter-spacing: 2px;
  max-width: 92%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cdc-rule {
  width: 60%;
  height: 1px;
  margin: 3% 0 4.5%;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--accent) 65%, transparent),
    transparent
  );
}

.cdc-attrs {
  display: flex;
  align-items: stretch;
  gap: 7%;
  width: 80%;
}

.cdc-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.cdc-divider {
  width: 1px;
  background: color-mix(in srgb, var(--accent) 35%, transparent);
}

.cdc-attr {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.cdc-num {
  font-family: "Saira Condensed", "Arial Narrow", sans-serif;
  font-weight: 800;
  font-size: 21px;
  min-width: 30px;
  text-align: right;
  color: var(--ink);
}

.cdc-key {
  font-family: "Saira Condensed", "Arial Narrow", sans-serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 1.5px;
  color: var(--soft);
}

.cdc-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  font-family: "Saira Condensed", "Arial Narrow", sans-serif;
  font-weight: 600;
  font-size: 9.5px;
  letter-spacing: 2.5px;
  color: var(--soft);
  white-space: nowrap;
}

.cdc-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent);
}

@media (min-width: 640px) { .cdc { width: 360px; } }
@media (min-width: 1024px) { .cdc { width: 380px; } }

@media (prefers-reduced-motion: reduce) {
  .cdc { transform: none !important; animation: none; }
}
`;
