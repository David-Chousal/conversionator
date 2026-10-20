# ChannelMixer

The channel mixer is COR's global filter: a date scrubber over real spend, a strip showing each channel's share of spend, and a toggle per channel.

- Structure: a `cor-bay` with the window `cor-tag` and a campaign `cor-field` in its head, then a `cor-scrub` SVG, a `cor-strip` and `cor-toggles`.
- Scrubber: the consumer provides daily total spend; the selected window is a `cobalt-soft` field with `cobalt` handles the user drags. Presets (7d, 30d, QTD) set the window; the tag always shows the explicit dates.
- Strip segments are exactly proportional to spend share (`flex: <share>`). A muted channel's segment turns hatched and its toggle goes hollow (`aria-pressed="false"`).
- Each toggle carries the channel code (`CH·01`), name and share. Alt-click solos a channel.
- The mixer doubles as the legend for every bay on the page, so bays don't repeat legends.
