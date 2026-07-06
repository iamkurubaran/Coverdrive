import { useEffect, useRef } from "react";

// GitHub-style contribution calendar, restyled for the night-test-match
// theme — a year of innings, one square per day, pitch-green intensity.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Heatmap({ heatmap }) {
  const scrollRef = useRef(null);

  // Start scrolled to the most recent weeks (like GitHub on mobile).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [heatmap]);

  if (!heatmap?.weeks?.length) return null;

  // Month labels: mark a week column when the month changes.
  const labels = [];
  let lastMonth = -1;
  heatmap.weeks.forEach((week, i) => {
    const day = week.find(Boolean);
    if (!day) return;
    const m = new Date(`${day.date}T00:00:00Z`).getUTCMonth();
    if (m !== lastMonth) {
      labels.push({ index: i, text: MONTHS[m] });
      lastMonth = m;
    }
  });
  // Drop a first label that would collide with the second.
  if (labels.length > 1 && labels[1].index - labels[0].index < 3) labels.shift();

  return (
    <section className="panel">
      <div className="panel-title">
        <span className="tick" aria-hidden />
        Innings Map
        <span className="panel-note">
          {heatmap.total.toLocaleString()} contributions · last 12 months
        </span>
      </div>

      <div className="heatmap-scroll" ref={scrollRef} tabIndex={0} role="img"
        aria-label={`Contribution heatmap: ${heatmap.total} contributions in the last year`}>
        <div className="heatmap">
          <div className="hm-months" aria-hidden>
            {labels.map((l) => (
              <span key={l.index} style={{ "--col": l.index + 1 }}>{l.text}</span>
            ))}
          </div>
          <div className="hm-grid" aria-hidden>
            {heatmap.weeks.map((week, wi) => (
              <div className="hm-week" key={wi}>
                {week.map((d, di) =>
                  d ? (
                    <span
                      key={di}
                      className={`hm-day l${d.level}`}
                      title={`${d.count} contribution${d.count === 1 ? "" : "s"} · ${d.date}`}
                    />
                  ) : (
                    <span key={di} className="hm-day hm-pad" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hm-legend" aria-hidden>
        <span>Quiet overs</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`hm-day l${l}`} />
        ))}
        <span>Boundary rush</span>
      </div>
    </section>
  );
}
