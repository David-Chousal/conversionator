# HeatGrid

The heat grid shows a metric across two time dimensions, usually conversions by weekday and two-hour block, to time budgets and posts.

- Grid: weekdays down (Monday first), 12 two-hour blocks across, hour labels every 6 hours in the user's time zone (named in the scope tag).
- Color: the five-step `seq-0`…`seq-4` cobalt ramp, quantized into equal-count buckets. The legend states the real range ("0–46 per block").
- Every cell has a tooltip with the exact value; the whole grid has an `aria-label` summarising the peak.
- One metric per grid. Never use channel colors or a rainbow here.
