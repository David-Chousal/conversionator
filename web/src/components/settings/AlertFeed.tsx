import type { FeedEntry } from "@/lib/data/settings-view";

/** What alerts caught recently, newest first. */
export function AlertFeed({ entries }: { entries: FeedEntry[] }) {
  return (
    <section className="cor-bay" aria-labelledby="feed-title">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title" id="feed-title">Recent alerts</h2>
        <span className="cor-tag">Last 14 days</span>
      </div>
      {entries.length === 0 ? <p className="cor-help">Nothing fired in the last 14 days.</p> : (
        <ul className="cor-feed">
          {entries.map((entry) => (
            <li key={entry.id} className="cor-feed__row"><span className="cor-tag">{entry.when}</span><span>{entry.headline}</span></li>
          ))}
        </ul>
      )}
    </section>
  );
}
