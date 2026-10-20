import type { SignalState } from "@/lib/data";

interface SignalMeterProps {
  state: SignalState;
  lit: number;
  word: string;
  age?: string;
}

const BARS = [0, 1, 2, 3];

export function SignalMeter({ state, lit, word, age }: SignalMeterProps) {
  return (
    <span className={`cor-signal cor-signal--${state}`}>
      <span className="cor-signal__bars" aria-hidden="true">
        {BARS.map((bar) => <i key={bar} className={bar < lit ? undefined : "off"} />)}
      </span>
      {word}
      {age && <> <b>{age}</b></>}
    </span>
  );
}
