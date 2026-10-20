# TracePanel

A trace panel plots one metric per channel over the mixer's window, labelled directly at the line ends instead of with a legend.

- Structure: a `cor-bay` with `cor-bay__title` and a scope `cor-tag` on the rail, then a `cor-trace` SVG.
- The consumer provides the series (colored `ch-n`), the y scale, annotations and the hovered index.
- Each line ends in a dot, its channel name in `body-strong` and its latest value in `metric`. Nudge labels apart by at least 28px; never add a legend box.
- Gridlines horizontal in `line`; x ticks are short `line-strong` marks with uppercase mono dates.
- Annotations (launches, alert thresholds) hang from the rail as a small `flare` pennant with a mono label beside it and a dotted drop line.
- Hover shows a `cobalt` crosshair, hollow dots on each series and a total in a small `surface` tip.
- A stale channel draws dotted and shows its age in `caution` next to its value.
