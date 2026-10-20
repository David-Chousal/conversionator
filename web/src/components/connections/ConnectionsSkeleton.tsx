const ROWS = [0, 1, 2, 3];

export function ConnectionsSkeleton() {
  return (
    <section className="cor-bay" aria-busy="true" aria-label="Loading connections">
      <div className="cor-bay__head">
        <span className="cor-bay__title">Connected</span>
        <span className="cor-tag">Checking signal…</span>
      </div>
      <div className="cor-list">
        {ROWS.map((row) => (
          <div key={row} className="cor-list__row cor-conn">
            <span className="cor-mark cor-mark--muted" />
            <span className="cor-conn__main" style={{ display: "grid", gap: 6 }}>
              <span className="cor-skel" style={{ width: "40%" }} />
              <span className="cor-skel" style={{ width: "65%", height: 8 }} />
            </span>
            <span className="cor-conn__signal"><span className="cor-skel" style={{ width: "50%" }} /></span>
            <span className="cor-conn__datasets"><span className="cor-skel" style={{ width: 40 }} /></span>
            <span />
          </div>
        ))}
      </div>
    </section>
  );
}
