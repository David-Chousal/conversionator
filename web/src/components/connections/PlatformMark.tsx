interface PlatformMarkProps {
  monogram: string;
  /** Dashed outline for a platform that isn't connected. */
  muted?: boolean;
}

/** Placeholder tile; replace the monogram with the vendor's official logo at 20px. */
export function PlatformMark({ monogram, muted = false }: PlatformMarkProps) {
  return (
    <span className={muted ? "cor-mark cor-mark--muted" : "cor-mark"} aria-hidden="true">
      {monogram}
    </span>
  );
}
