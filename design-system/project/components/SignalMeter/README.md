# SignalMeter

A signal meter shows how fresh a connection's data is, as signal bars plus a word, the way an operator reads channel strength.

- Structure: `cor-signal` + one of `--ok`, `--stale`, `--failed`, `--off`; inside, `cor-signal__bars` with four `<i>` (unlit ones get `off`), then the word and an age in `<b>`.
- Bars encode freshness against the hourly automatic sync: 4 = synced under 15 min, 3 = under 2 h (on schedule), 2 = under 12 h (stale: two or more scheduled runs missed), 1 = older, 0 = failed or paused. Next to a source, pair it with its schedule line in a `cor-tag` ("Auto · next in 56m").
- The consumer provides the state, the lit bar count and the age. The word is always present; bars never carry meaning alone.
- Appears on Connections rows, the Data source list, and on a bay's rail when one of its sources is degraded.
