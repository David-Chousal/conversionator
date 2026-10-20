# Readout

A readout states one headline metric, where its numbers come from, how steeply it moved, and where it sits in its own 90-day range.

- Structure: a `cor-bay` with a `cor-readout__head` (the metric `cor-tag`, an optional source `cor-badge--muted`, the channel scope tag), `cor-readout__value`, a `cor-slope`, and a `cor-range`.
- The head is fixed at 20px and never wraps (long labels truncate with a tooltip), so every tile's value starts on the same line.
- Source badge: every metric built on conversions, revenue or leads says where they come from: the CRM's name ("HubSpot") when one is connected, "Platform-reported" when the numbers are each ad platform's own pixel. Spend has no badge: it is what the platforms billed.
- Which four readouts: with a CRM, Ad spend, Leads, Cost per lead, ROAS (on closed-won revenue). Without one, Ad spend, Conversions, CPA, ROAS, all platform-reported.
- Value in `readout` style; units and cents go in `<small>` so the meaningful digits lead ("$11<small>.52</small>", "2.9<small>×</small>").
- The slope glyph's angle tracks the size of the change (cap at ±45°). Color follows meaning: `--good`, `--bad`, or `--flat` for metrics with no right direction, such as spend.
- The range track replaces a sparkline: filled dot = now, ring = previous period, ends = 90-day min and max.
- Four readouts per row on desktop; clicking one opens the drill-down drawer.
