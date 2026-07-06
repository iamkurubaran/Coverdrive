// Cricinfo-style career statistics — the report's signature cricket element.
// Horizontally scrollable on small screens, exactly like a live scorecard.
export default function CareerTable({ career, name }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <span className="tick" aria-hidden />
        Career Statistics
      </div>
      <p className="career-sub">
        {name} — batting &amp; fielding across formats
      </p>

      <div className="career-scroll" role="region" aria-label="Career statistics table" tabIndex={0}>
        <table className="career-table">
          <thead>
            <tr>
              {career.columns.map((c) => (
                <th key={c} scope="col">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {career.rows.map((r) => (
              <tr key={r.format}>
                <th scope="row">{r.format}</th>
                <td>{r.mat}</td>
                <td className="strong">{r.runs}</td>
                <td>{r.hs}</td>
                <td>{r.ave}</td>
                <td>{r.sr}</td>
                <td>{r.hundreds}</td>
                <td>{r.fifties}</td>
                <td>{r.sixes}</td>
                <td>{r.ct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="career-legend">{career.legend}</p>
    </section>
  );
}
