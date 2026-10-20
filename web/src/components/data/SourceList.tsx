import Link from "next/link";
import { PlatformMark } from "@/components/connections/PlatformMark";
import { SignalMeter } from "@/components/status/SignalMeter";
import { dataHref, type SourceItem } from "@/lib/data/data-sources-view";

interface SourceListProps {
  sources: SourceItem[];
  selectedId: string;
}

/** Every source COR pulls from; choosing one opens its datasets. */
export function SourceList({ sources, selectedId }: SourceListProps) {
  return (
    <nav className="cor-bay" aria-label="Data sources">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">Sources</h2>
        <span className="cor-tag">{sources.length} pulling</span>
      </div>
      <div className="cor-list">
        {sources.map((source) => (
          <Link key={source.id} href={dataHref({ source: source.id })} className="cor-list__row cor-source" aria-current={source.id === selectedId ? "page" : undefined}>
            <PlatformMark monogram={source.monogram} />
            <span className="cor-list__main">
              <strong>{source.name} <span className="cor-tag">{source.code}</span></strong>
              <span className={`cor-conn__account cor-conn__account--${source.account.tone}`}>{source.datasets.enabled} of {source.datasets.total} datasets</span>
            </span>
            <SignalMeter state={source.signal.state} lit={source.signal.lit} word={source.signal.word} age={source.signal.age} />
          </Link>
        ))}
      </div>
    </nav>
  );
}
