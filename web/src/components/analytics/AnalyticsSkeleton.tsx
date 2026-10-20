const READOUTS = ["Ad spend", "ROAS", "Cost per acquisition", "Conversions"];

export function AnalyticsSkeleton() {
  return (
    <div className="cor-grid12" aria-busy="true" aria-label="Loading analytics">
      <div className="span-12">
        <section className="cor-bay">
          <div className="cor-bay__head"><span className="cor-tag">Window · loading</span></div>
          <span className="cor-skel" style={{ height: 48 }} />
        </section>
      </div>
      {READOUTS.map((label) => (
        <div key={label} className="span-3">
          <section className="cor-bay">
            <div className="cor-bay__head"><span className="cor-tag">{label}</span><span className="cor-tag">Syncing…</span></div>
            <span className="cor-skel cor-skel--num" />
            <span className="cor-skel" style={{ width: "40%" }} />
          </section>
        </div>
      ))}
      <div className="span-12">
        <section className="cor-bay">
          <div className="cor-bay__head"><span className="cor-bay__title">Spend by channel</span></div>
          <span className="cor-skel" style={{ height: 200 }} />
        </section>
      </div>
    </div>
  );
}
