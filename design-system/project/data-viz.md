# Data visualization

Charts in COR are instruments: one scale, honest baselines, labels on the data, and color spent only on channels and meaning.

## Choosing a chart

| Question | Use | Component |
| --- | --- | --- |
| How is one metric doing? | Value, slope, 90-day range | Readout |
| How did it move over time, per channel? | Lines, directly labelled | TracePanel |
| Which channel/campaign is bigger? | Bars, zero baseline | BarPanel |
| How is a value distributed? | Histogram | BarPanel (histogram) |
| What share does each part take? (≤4) | Ring + exact key | ShareRing |
| What did we spend vs. get back? | Spend left, return right, one scale | ReturnLedger |
| When do people convert? | Weekday × hour | HeatGrid |
| Which of these 2–4 items wins? | Columns of metrics | CompareGrid |
| What exactly are the rows? | Table | DataTable |

Never: 3D, dual y-axes, pies over four slices, stacked area for more than three series, gauges with needles.

## Attribution

- Spend, impressions and clicks are always the ad platforms' figures. Leads, deals won and revenue are the CRM's, by last ad interaction; without a CRM, conversions and revenue are each platform's own and are labelled Platform-reported on every readout, column and bay.
- Never add platform-reported conversions across platforms without that label: platforms can each claim the same sale.
- CRM leads with no ad touch are shown as unattributed (hatched) in the AttributionBay, never spread across channels.

## Color

- Channels always use `ch-1`…`ch-6` in connection order and keep that color on every chart, table bar and toggle. Past six: `ch-other`.
- Sequential data uses `seq-0`…`seq-4` (one hue). Diverging data (above/below target) uses `positive` and `negative` only.
- `flare` is reserved for annotations: launches, thresholds, medians.
- Hatching means "reference, not live": previous period, muted channel, spend (money out) in the ledger, loading placeholders.

## Marks

- Lines 2px, the primary series 2.5px; endpoints get a dot and a direct label (name in `body-strong`, value in `metric`). No legend boxes; the ChannelMixer is the page legend.
- Bars square-topped; bar charts always start at zero. Line charts may start above zero when the axis says so.
- Gridlines horizontal, `line`, at round values (0, 1k, 2k). Axis labels in `tag` or `metric`, `ink-muted`.
- Stale data draws dotted, with its age in `caution` at the label.

## Interaction

- Hover or arrow keys move a `cobalt` crosshair; hollow dots mark each series; a small `surface` tip shows the date and total.
- Click any mark to open the Drawer for that slice. Every chart's bay menu offers Export CSV of exactly what is drawn.
- Each chart has an `aria-label` that states the takeaway in a sentence, and its data is reachable as a table (bay menu › View as table).

## Comparison periods

- Default comparison is the previous period of equal length. Readouts state it ("vs prev 30d"); traces draw it only on request, as the same color dashed at 60%.
