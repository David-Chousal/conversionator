# DateRangePicker

The date range picker opens from the ChannelMixer window tag and sets the range every bay uses, plus the comparison period.

- Layout: presets on the left (Today, Last 7/30/90 days, Quarter to date, Year to date, Custom), a month grid on the right, a footer with the compare switch, the explicit range and Apply.
- Range: endpoints filled `cobalt` with `on-cobalt` digits, days between on `cobalt-soft`, today underlined in `flare`. Days outside the month are `ink-muted` and not focusable.
- Weeks start on the workspace's week start (Monday by default). Dates show in the user's time zone; the footer always states the range in words.
- Compare defaults to the previous period of equal length and states it ("Compare to Jan 30 → Feb 28").
- Nothing changes until Apply; Esc closes without applying. Two-month view above 900px wide.
