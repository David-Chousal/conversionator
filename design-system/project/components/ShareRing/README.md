# ShareRing

The share ring is COR's pie chart: a thick ring of up to four parts with the total in the middle and an exact key beside it.

- Ring: 12px stroke on r=40, segments in `ch-n` starting at 12 o'clock, clockwise largest first, 2px gaps, butt ends. Center: total in Satoshi Bold with a mono caption.
- The key lists every part with value and percentage; percentages are rounded so they sum to 100.
- More than four parts: show the top three and group the rest as "Other" in `ch-other`, or use a horizontal BarPanel.
- For share over time, use the ChannelMixer strip or a stacked bar, never several rings.
