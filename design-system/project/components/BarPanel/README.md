# BarPanel

Bar panels compare discrete things: channels, campaigns, weekdays. The histogram variant shows how a value is distributed.

- Grouped bars: current period solid in the channel color, previous period beside it as a hatched outline (the hatch always means "reference, not live"). Values sit above the current bar in `metric`.
- Bars are square-topped, 36px wide with 4px between a pair; gridlines horizontal in `line`; y axis starts at zero, always.
- Horizontal bars when labels are long (campaign names) or there are more than 8 items.
- Histogram: contiguous bins with a 1px `bg` seam, one color, a `flare` median line. Used for CPC, CPA and order value distributions.
- Labels under bars name the category; never rotate them. Click a bar to open the Drawer for that category.
